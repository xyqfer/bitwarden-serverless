const speakeasy = require('speakeasy');
const utils = require('./lib/api_utils');
const { User, Device } = require('./lib/models');
const { regenerateTokens, hashesMatch, DEFAULT_VALIDITY } = require('./lib/bitwarden');

const handler = async (req, res) => {
  console.log('Login handler triggered');
  if (!req.body) {
    utils.validationError('Missing request body', res);
    return;
  }

  const body = utils.normalizeBody(req.body);

  let eventHeaders;
  let device;
  let deviceType;
  let user;

  try {
    switch (body.grant_type) {
      case 'password':
        if ([
          'client_id',
          'grant_type',
          'password',
          'scope',
          'username',
        ].some((param) => {
          if (!body[param]) {
            utils.validationError(param + ' must be supplied', res);
            return true;
          }

          return false;
        })) {
          return;
        }

        if (body.scope !== 'api offline_access') {
          utils.validationError('Scope not supported', res);
          return;
        }

        [user] = (await User.scan()
          .equalTo('email', body.username.toLowerCase())
          .find());

        if (!user) {
          utils.validationError('Invalid username or password', res);
          return;
        }

        if (!hashesMatch(user.get('passwordHash'), body.password)) {
          utils.validationError('Invalid username or password', res);
          return;
        }

        if (user.get('totpSecret')) {
          const verified = speakeasy.totp.verify({
            secret: user.get('totpSecret'),
            encoding: 'base32',
            token: body.twofactortoken,
          });

          if (!verified) {
            res.status(400).send({
              error: 'invalid_grant',
              error_description: 'Two factor required.',
              TwoFactorProviders: [0],
              TwoFactorProviders2: { 0: null },
            });
            return;
          }
        }

        // Web vault doesn't send device identifier
        if (body.deviceidentifier) {
          device = await Device.getAsync(body.deviceidentifier);
          if (device && device.get('userUuid') !== user.get('uuid')) {
            await device.destroy();
            device = null;
          }
        }

        if (!device) {
          device = await Device.createAsync({
            userUuid: user.get('uuid'),
            uuid: body.deviceidentifier,
          });
        }

        // Browser extension sends body, web and mobile send header.
        // iOS sends lower case header with string value.
        eventHeaders = utils.normalizeBody(req.headers);
        deviceType = body.devicetype;
        if (!Number.isNaN(eventHeaders['device-type'])) {
          deviceType = parseInt(req.headers['device-type'], 10);
        }

        if (body.devicename && deviceType) {
          // Browser extension sends body, web and mobile send header
          device.set('type', deviceType);
          device.set('name', body.devicename);
        }

        if (body.devicepushtoken) {
          device.set('pushToken', body.devicepushtoken);
        }

        break;
      case 'refresh_token':
        if (!body.refresh_token) {
          utils.validationError('Refresh token must be supplied', res);
          return;
        }

        console.log('Login attempt using refresh token', { refreshToken: body.refresh_token });

        [device] = (await Device.scan()
          .equalTo('refreshToken', body.refresh_token)
          .find());

        if (!device) {
          console.error('Invalid refresh token', { refreshToken: body.refresh_token });
          utils.validationError('Invalid refresh token', res);
          return;
        }

        user = await User.getAsync(device.get('userUuid'));
        break;
      default:
        utils.validationError('Unsupported grant type', res);
        return;
    }

    const tokens = regenerateTokens(user, device);

    device.set('refreshToken', tokens.refreshToken);

    device = await device.save();
    const privateKey = user.get('privateKey') || null;

    utils.okResponse({
      access_token: tokens.accessToken,
      expires_in: DEFAULT_VALIDITY,
      token_type: 'Bearer',
      refresh_token: tokens.refreshToken,
      Key: user.get('key'),
      PrivateKey: privateKey ? privateKey.toString('utf8') : null,
    }, res);
  } catch (e) {
    utils.serverError('Internal error', e, res);
  }
};

module.exports = handler;
