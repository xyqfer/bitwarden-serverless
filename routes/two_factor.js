const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { User } = require('./lib/models');

const setupHandler = async (email) => {
  console.log('2FA setup handler triggered');

  if (!email) {
    console.log('E-mail must be supplied');
    return;
  }

  let user;
  try {
    [user] = (await User.scan()
      .equalTo('email', email.toLowerCase())
      .find());
  } catch (e) {
    console.log('User not found');
    return;
  }

  try {
    const secret = speakeasy.generateSecret();

    user.set('totpSecretTemp', secret.base32);
    await user.save();

    const code = await qrcode.toDataURL(secret.otpauth_url);

    console.log(code);
  } catch (e) {
    console.log('ERROR:', e);
  }
};

const completeHandler = async (email, code) => {
  console.log('2FA complete handler triggered');

  if (!email) {
    console.log('E-mail must be supplied');
    return;
  }

  if (!code) {
    console.log('Verification code must be supplied');
    return;
  }

  let user;
  try {
    [user] = (await User.scan()
      .equalTo('email', email.toLowerCase())
      .find());
  } catch (e) {
    console.log('User not found');
    return;
  }

  try {
    const verified = speakeasy.totp.verify({
      secret: user.get('totpSecretTemp'),
      encoding: 'base32',
      token: code,
    });

    if (verified) {
      user.set('totpSecret', user.get('totpSecretTemp'));
      user.set('totpSecretTemp', null);
      user.set('securityStamp', undefined);

      await user.save();

      console.log('OK, 2FA setup.');
    } else {
      console.log('ERROR, Could not verify supplied code, please try again.');
    }
  } catch (e) {
    console.log('ERROR:', e);
  }
};

module.exports = {
  setupHandler,
  completeHandler,
};
