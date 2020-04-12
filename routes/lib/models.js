const AV = require('leancloud-storage');
const { v4: uuidv4 } = require('uuid');
const devicesTableName = 'DEVICES_TABLE';
const usersTableName = 'USERS_TABLE';
const cipherTableName = 'CIPHERS_TABLE';
const folderTableName = 'FOLDERS_TABLE';

// The migration script runs updates on the models depending on each row's version
// This is the latest version available for each model, new entries have this version
const CIPHER_MODEL_VERSION = 1;
const USER_MODEL_VERSION = 2;

const Device = (() => {
  const getAsync = async (uuid) => {
    const query = new AV.Query(devicesTableName);
    const data = await query.equalTo('uuid', uuid).find();

    if (data && data.length > 0) {
      return data[0];
    }
  };

  const createAsync = async (data) => {
    const device = new AV.Object(devicesTableName);

    Object.entries(data).forEach(([key, value]) => {
      device.set(key, value);
    });

    await device.save();
    return device;
  };

  const scan = () => {
    return new AV.Query(devicesTableName);
  };

  return {
    getAsync,
    createAsync,
    scan
  };
})();

const User = (() => {
  const getAsync = async (uuid) => {
    const query = new AV.Query(usersTableName);
    const data = await query.equalTo('uuid', uuid).find();

    if (data && data.length > 0) {
      return data[0];
    }
  };

  const createAsync = async (data) => {
    const user = new AV.Object(usersTableName);

    Object.entries(data).forEach(([key, value]) => {
      user.set(key, value);
    });

    user.set('uuid', uuidv4());

    await user.save();
    return user;
  };

  const scan = () => {
    return new AV.Query(usersTableName);
  };

  return {
    getAsync,
    scan,
    createAsync
  };
})();

const Cipher = (() => {
  const getAsync = async (userUuid, uuid) => {
    const query = new AV.Query(cipherTableName);
    query.equalTo('userUuid', userUuid);
    query.equalTo('uuid', uuid);
    const data = await query.find();

    if (data && data.length > 0) {
      return data[0];
    }
  };

  const query = (userUuid) => {
    const query = new AV.Query(cipherTableName);
    query.equalTo('userUuid', userUuid);
    return query;
  };

  const destroyAsync = async (userUuid, uuid) => {
    const cipher = await getAsync(userUuid, uuid);

    if (cipher) {
      cipher.destroy();
    }
  };

  const createAsync = async (data) => {
    const cipher = new AV.Object(cipherTableName);

    Object.entries(data).forEach(([key, value]) => {
      cipher.set(key, value);
    });

    cipher.set('uuid', uuidv4());

    await cipher.save();
    return cipher;
  };

  return {
    getAsync,
    createAsync,
    destroyAsync,
    query,
  };
})();

const Folder = (() => {
  const getAsync = async (userUuid, uuid) => {
    const query = new AV.Query(folderTableName);
    query.equalTo('userUuid', userUuid);
    query.equalTo('uuid', uuid);
    const data = await query.find();

    if (data && data.length > 0) {
      return data[0];
    }
  };

  const createAsync = async (data) => {
    const folder = new AV.Object(folderTableName);

    Object.entries(data).forEach(([key, value]) => {
      folder.set(key, value);
    });

    folder.set('uuid', uuidv4());

    await folder.save();
    return folder;
  };

  const query = (userUuid) => {
    const query = new AV.Query(folderTableName);
    query.equalTo('userUuid', userUuid);
    return query;
  };

  const destroyAsync = async (userUuid, uuid) => {
    const folder = await getAsync(userUuid, uuid);

    if (folder) {
      folder.destroy();
    }
  };

  return {
    getAsync,
    destroyAsync,
    query,
    createAsync
  };
})();

module.exports = {
  CIPHER_MODEL_VERSION,
  USER_MODEL_VERSION,
  Device,
  User,
  Cipher,
  Folder
};
