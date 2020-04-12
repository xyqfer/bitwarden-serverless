const utils = require('./lib/api_utils');
const { loadContextFromHeader, buildCipherDocument, touch } = require('./lib/bitwarden');
const { mapCipher } = require('./lib/mappers');
const { Cipher } = require('./lib/models');

const postHandler = async (req, res) => {
  console.log('Cipher create handler triggered');

  if (!req.body) {
    utils.validationError('Request body is missing', res);
    return;
  }

  const body = utils.normalizeBody(req.body);

  let user;
  try {
    ({ user } = await loadContextFromHeader(req.headers.authorization));
  } catch (e) {
    utils.validationError('User not found: ' + e.message, res);
    return;
  }

  if (!body.type || !body.name) {
    utils.validationError('Missing name and type of vault item', res);
    return;
  }

  try {
    const cipher = await Cipher.createAsync(buildCipherDocument(body, user));

    await touch(user);

    utils.okResponse({ ...mapCipher(cipher), Edit: true }, res);
  } catch (e) {
    utils.serverError('Server error saving vault item', e, res);
  }
};

const putHandler = async (req, res) => {
  console.log('Cipher edit handler triggered');
  if (!req.body) {
    utils.validationError('Request body is missing', res);
    return;
  }

  const body = utils.normalizeBody(req.body);

  let user;
  try {
    ({ user } = await loadContextFromHeader(req.headers.authorization));
  } catch (e) {
    utils.validationError('User not found: ' + e.message, res);
    return;
  }

  if (!body.type || !body.name) {
    utils.validationError('Missing name and type of vault item', res);
    return;
  }

  const cipherUuid = req.params.uuid;
  if (!cipherUuid) {
    utils.validationError('Missing vault item ID', res);
  }

  try {
    let cipher = await Cipher.getAsync(user.get('uuid'), cipherUuid);

    if (!cipher) {
      utils.validationError('Unknown vault item', res);
      return;
    }

    Object.entries(buildCipherDocument(body, user)).forEach(([key, value]) => {
      cipher.set(key, value);
    });

    cipher = await cipher.save();
    await touch(user);

    utils.okResponse({ ...mapCipher(cipher), Edit: true }, res);
  } catch (e) {
    utils.serverError('Server error saving vault item', e, res);
  }
};

const deleteHandler = async (req, res) => {
  console.log('Cipher delete handler triggered');

  let user;
  try {
    ({ user } = await loadContextFromHeader(req.headers.authorization));
  } catch (e) {
    utils.validationError('User not found: ' + e.message, res);
  }

  const cipherUuid = req.params.uuid;
  if (!cipherUuid) {
    utils.validationError('Missing vault item ID', res);
  }

  try {
    await Cipher.destroyAsync(user.get('uuid'), cipherUuid);
    await touch(user);

    utils.okResponse('', res);
  } catch (e) {
    utils.validationError(e.toString(), res);
  }
};

module.exports = {
  postHandler,
  putHandler,
  deleteHandler,
};
