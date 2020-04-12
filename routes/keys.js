const querystring = require('querystring');
const utils = require('./lib/api_utils');
const { regenerateTokens, loadContextFromHeader, DEFAULT_VALIDITY } = require('./lib/bitwarden');

const handler = async (req, res) => {
  console.log('Keys handler triggered', JSON.stringify(req, null, 2));
  if (!req.body) {
    utils.validationError('Missing request body', res);
    return;
  }

  const contentType = req.headers['Content-Type'].split(';')[0];
  let body;
  if (contentType === 'application/json') {
    body = utils.normalizeBody(req.body);
  } else {
    body = utils.normalizeBody(querystring.parse(event.body));
  }

  let user;
  let device;
  try {
    ({ user, device } = await loadContextFromHeader(req.headers.authorization));
  } catch (e) {
    utils.validationError('User not found: ' + e.message, res);
    return;
  }

  const re = /^2\..+\|.+/;
  if (!re.test(body.encryptedprivatekey)) {
    utils.validationError('Invalid key', res);
    return;
  }

  user.set({ privateKey: body.encryptedprivatekey });
  user.set({ publicKey: body.publickey });

  const tokens = regenerateTokens(user, device);

  device.set({ refreshToken: tokens.refreshToken });

  device = await device.updateAsync();
  await user.updateAsync();

  try {
    utils.okResponse({
      access_token: tokens.accessToken,
      expires_in: DEFAULT_VALIDITY,
      token_type: 'Bearer',
      refresh_token: tokens.refreshToken,
      Key: user.get('key'),
      Id: user.get('uuid'),
      Name: user.get('name'),
      Email: user.get('email'),
      EmailVerified: user.get('emailVerified'),
      Premium: user.get('premium'),
      MasterPasswordHint: user.get('passwordHint'),
      Culture: user.get('culture'),
      TwoFactorEnabled: user.get('totpSecret'),
      PrivateKey: user.get('privateKey'),
      SecurityStamp: user.get('securityStamp'),
      Organizations: '[]',
      Object: 'profile',
    }, res);
  } catch (e) {
    utils.serverError('Internal error', e, res);
  }
};

module.exports = handler;
