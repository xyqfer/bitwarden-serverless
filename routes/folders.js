const utils = require('./lib/api_utils');
const { loadContextFromHeader, touch } = require('./lib/bitwarden');
const { mapFolder } = require('./lib/mappers');
const { Folder } = require('./lib/models');

const postHandler = async (req, res) => {
  console.log('Folder create handler triggered');

  if (!req.body) {
    utils.validationError('Missing request body', res);
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

  if (!body.name) {
    utils.validationError('Missing folder name', res);
    return;
  }

  try {
    const folder = await Folder.createAsync({
      name: body.name,
      userUuid: user.get('uuid'),
    });
    await touch(user);

    utils.okResponse(mapFolder(folder), res);
  } catch (e) {
    utils.serverError('Server error saving folder', e, res);
  }
};

const putHandler = async (req, res) => {
  console.log('Folder edit handler triggered');
  if (!req.body) {
    utils.validationError('Missing request body', res);
    return;
  }

  const body = utils.normalizeBody(req.body);

  let user;
  try {
    ({ user } = await loadContextFromHeader(req.headers.authorization));
  } catch (e) {
    utils.validationError('Cannot load user from access token: ' + e, res);
    return;
  }

  if (!body.name) {
    utils.validationError('Missing folder name', res);
    return;
  }

  const folderUuid = req.params.uuid;
  if (!folderUuid) {
    utils.validationError('Missing folder ID', res);
  }

  try {
    let folder = await Folder.getAsync(user.get('uuid'), folderUuid);
    await touch(user);

    if (!folder) {
      utils.validationError('Unknown folder', res);
      return;
    }

    folder.set('name', body.name);

    folder = await folder.save();

    utils.okResponse(mapFolder(folder), res);
  } catch (e) {
    utils.serverError('Server error saving folder', e, res);
  }
};

const deleteHandler = async (req, res) => {
  console.log('Folder delete handler triggered');

  let user;
  try {
    ({ user } = await loadContextFromHeader(req.headers.authorization));
  } catch (e) {
    utils.validationError('User not found', res);
  }

  const folderUuid = req.params.uuid;
  if (!folderUuid) {
    utils.validationError('Missing folder ID', res);
  }

  try {
    await Folder.destroyAsync(user.get('uuid'), folderUuid);
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
