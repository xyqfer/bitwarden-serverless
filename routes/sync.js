const utils = require('./lib/api_utils');
const { loadContextFromHeader } = require('./lib/bitwarden');
const { mapUser, mapCipher, mapFolder } = require('./lib/mappers');
const { Cipher, Folder } = require('./lib/models');

const handler = async (req, res) => {
  console.log('Sync handler triggered', JSON.stringify(req, null, 2));

  let user;
  try {
    ({ user } = await loadContextFromHeader(req.headers.Authorization));
  } catch (e) {
    utils.validationError('User not found', res);
    return;
  }

  let ciphers;
  let folders;
  try {
    [ciphers, folders] = await Promise.all(
      Cipher.query(user.get('uuid')).find(),
      Folder.query(user.get('uuid')).find()
    );
  } catch (e) {
    utils.serverError('Server error loading vault items', e, res);
    return;
  }

  const response = {
    Profile: mapUser(user),
    Folders: folders.map(mapFolder),
    Ciphers: ciphers.map(mapCipher),
    Collections: [],
    Domains: {
      EquivalentDomains: null,
      GlobalEquivalentDomains: [],
      Object: 'domains',
    },
    Object: 'sync',
  };

  utils.okResponse(response, res);
};

module.exports = handler;
