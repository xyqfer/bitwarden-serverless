const AV = require('leancloud-storage');
const devicesTableName = 'DEVICES_TABLE';
const usersTableName = 'USERS_TABLE';
const cipherTableName = 'CIPHERS_TABLE';
const folderTableName = 'FOLDERS_TABLE';

// The migration script runs updates on the models depending on each row's version
// This is the latest version available for each model, new entries have this version
const CIPHER_MODEL_VERSION = 1;
const USER_MODEL_VERSION = 2;

// const Device2 = dynogels.define('Device', {
//   hashKey: 'uuid',
//   timestamps: true,
//   tableName: devicesTableName,

//   schema: {
//     uuid: dynogels.types.uuid(),
//     userUuid: Joi.string().required(),
//     name: Joi.string().allow(null),
//     type: Joi.number(),
//     pushToken: Joi.string().allow(null),
//     refreshToken: Joi.string().allow(null),
//   },
// });

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

  return {
    getAsync,
    createAsync
  };
})();

// const User2 = dynogels.define('User', {
//   hashKey: 'uuid',
//   timestamps: true,
//   tableName: usersTableName,

//   schema: {
//     uuid: dynogels.types.uuid(),
//     email: Joi.string().email().required(),
//     emailVerified: Joi.boolean(),
//     premium: Joi.boolean(),
//     name: Joi.string().allow(null),
//     passwordHash: Joi.string().required(),
//     passwordHint: Joi.string().allow(null),
//     key: Joi.string(),
//     jwtSecret: Joi.string().required(),
//     privateKey: Joi.binary(),
//     publicKey: Joi.binary(),
//     totpSecret: Joi.string().allow(null),
//     totpSecretTemp: Joi.string().allow(null),
//     securityStamp: dynogels.types.uuid(),
//     culture: Joi.string(),
//     kdfIterations: Joi.number().min(5000).max(1e6),
//     version: Joi.number().allow(null),
//   },
// });

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

// const Cipher2 = dynogels.define('Cipher', {
//   hashKey: 'userUuid',
//   rangeKey: 'uuid',
//   timestamps: true,
//   tableName: cipherTableName,

//   schema: {
//     userUuid: Joi.string().required(),
//     uuid: dynogels.types.uuid(), // Auto-generated
//     folderUuid: Joi.string().allow(null),
//     organizationUuid: Joi.string().allow(null),
//     type: Joi.number(),
//     version: Joi.number().allow(null),
//     data: Joi.object().allow(null),
//     favorite: Joi.boolean(),
//     attachments: Joi.any().allow(null),
//     name: Joi.string().allow(null),
//     notes: Joi.string().allow(null),
//     fields: Joi.any().allow(null),
//     login: Joi.object().allow(null),
//     securenote: Joi.object().allow(null),
//     identity: Joi.object().allow(null),
//     card: Joi.object().allow(null),
//   },
// });

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

  const query = async (userUuid) => {
    const query = new AV.Query(cipherTableName);
    query.equalTo('userUuid', userUuid);
    return await query.find();
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

// const Folder2 = dynogels.define('Folder', {
//   hashKey: 'userUuid',
//   rangeKey: 'uuid',
//   timestamps: true,
//   tableName: folderTableName,

//   schema: {
//     userUuid: Joi.string().required(),
//     uuid: dynogels.types.uuid(), // Auto-generated
//     name: Joi.string().required(),
//   },
// });

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

  const query = async (userUuid) => {
    const query = new AV.Query(folderTableName);
    query.equalTo('userUuid', userUuid);
    return await query.find();
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
    query
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
