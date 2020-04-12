const utils = require('./lib/api_utils');
const { loadContextFromHeader } = require('./lib/bitwarden');
const { getRevisionDateAsMillis, mapUser } = require('./lib/mappers');
const { Device } = require('./lib/models');

const profileHandler = async (req, res) => {
  console.log('Account profile handler triggered');

  let user;
  try {
    ({ user } = await loadContextFromHeader(req.headers.authorization));
  } catch (e) {
    utils.validationError('User not found: ' + e.message, res);
  }

  try {
    utils.okResponse(mapUser(user), res);
  } catch (e) {
    utils.serverError(e.toString(), null, res);
  }
};

const putProfileHandler = async (req, res) => {
  console.log('Update account profile handler triggered');

  let user;
  try {
    ({ user } = await loadContextFromHeader(req.headers.authorization));
  } catch (e) {
    utils.validationError('User not found: ' + e.message, res);
  }

  const body = utils.normalizeBody(req.body);

  [['masterpasswordhint', 'passwordHint'], ['name', 'name'], ['culture', 'culture']].forEach(([requestAttr, attr]) => {
    if (body[requestAttr]) {
      user.set({ [attr]: body[requestAttr] });
    }
  });

  try {
    user = await user.updateAsync();

    utils.okResponse(mapUser(user), res);
  } catch (e) {
    utils.serverError(e.toString(), null, res);
  }
};

const revisionDateHandler = async (req, res) => {
  console.log('Account revision date handler triggered');

  let user;
  try {
    ({ user } = await loadContextFromHeader(req.headers.authorization));
  } catch (e) {
    utils.validationError('User not found: ' + e.message, res);
  }

  try {
    utils.okResponse(getRevisionDateAsMillis(user), res);
  } catch (e) {
    utils.serverError(e.toString(), null, res);
  }
};

const pushTokenHandler = async (req, res) => {
  console.log('Push token handler triggered');

  let device;
  try {
    await loadContextFromHeader(req.headers.authorization);
    device = await Device.getAsync(req.params.uuid);

    if (!device) {
      throw new Error('Device not found');
    }
  } catch (e) {
    utils.validationError('User not found: ' + e.message, res);
  }

  const body = utils.normalizeBody(req.body);

  try {
    device.set('pushToken', body.pushtoken);

    device = await device.save();

    res.status(204).set('Content-Type', 'text/plain');
  } catch (e) {
    utils.serverError(e.toString(), null, res);
  }
};

module.exports = {
  profileHandler,
  putProfileHandler,
  revisionDateHandler,
  pushTokenHandler,
};
