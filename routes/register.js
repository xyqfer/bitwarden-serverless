const utils = require('./lib/api_utils');
const { User } = require('./lib/models');
const { buildUserDocument } = require('./lib/bitwarden');

const handler = async (req, res) => {
  console.log('Registration handler triggered');
  if (process.env.DISABLE_USER_REGISTRATION === 'true') {
    utils.validationError('Signups are not permitted', res);
    return;
  }

  if (!req.body) {
    utils.validationError('Missing request body', res);
    return;
  }

  const body = utils.normalizeBody(req.body);

  if (!body.masterpasswordhash) {
    utils.validationError('masterPasswordHash cannot be blank', res);
    return;
  }

  if (!/^.+@.+\..+$/.test(body.email)) {
    utils.validationError('supply a valid e-mail', res);
    return;
  }

  if (!/^\d\..+\|.+/.test(body.key)) {
    utils.validationError('supply a valid key', res);
    return;
  }

  try {
    const existingUser = await User.scan()
      .equalTo('email', body.email.toLowerCase())
      .find();

    if (existingUser.length > 0) {
      utils.validationError('E-mail already taken', res);
      return;
    }

    await User.createAsync(buildUserDocument(body));

    utils.okResponse('', res);
  } catch (e) {
    utils.serverError(e.message, e, res);
  }
};

module.exports = handler;
