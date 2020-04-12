const { KDF_PBKDF2, KDF_PBKDF2_ITERATIONS_DEFAULT } = require('./lib/crypto');
const utils = require('./lib/api_utils');
const { User } = require('./lib/models');

const handler = async (req, res) => {
  console.log('Prelogin handler triggered');

  if (!req.body) {
    utils.validationError('Request body is missing', res);
    return;
  }

  const body = utils.normalizeBody(req.body);

  const [user] = (await User.scan()
    .equalTo('email', body.email.toLowerCase())
    .find());

  if (!user) {
    utils.validationError('Unknown username', res);
    return;
  }

  utils.okResponse({
    Kdf: KDF_PBKDF2,
    KdfIterations: user.get('kdfIterations') || KDF_PBKDF2_ITERATIONS_DEFAULT,
  }, res);
};

module.exports = handler;
