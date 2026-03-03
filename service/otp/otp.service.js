const crypto = require('crypto');
const config = require('../../conf/config.json');

class OtpService {
  constructor() {
    const otpConfig = config.otpKey;

    if (!otpConfig) {
      this.invalidConfig = true;
      this.configError =
        'Incomplete or missing OTP configuration in config.json';
      return;
    }
    this.localKey = otpConfig;
    this.invalidConfig = false;
  }

  generateOtp(length) {
    let otp = '';
    const characters = '0123456789';
    for (let i = 0; i < length; i++) {
      otp += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return otp;
  }

  getOtpExpiry(seconds) {
    const now = new Date();
    now.setMinutes(now.getSeconds() + seconds * 1000);
    return now;
  }

  isSecretValid(providedSecret) {
    if (typeof providedSecret !== 'string') return false;

    const encoder = new TextEncoder();

    const hashProvided = crypto
      .createHash('sha256')
      .update(encoder.encode(providedSecret))
      .digest();

    const hashActual = crypto
      .createHash('sha256')
      .update(encoder.encode(this.localKey))
      .digest();

    return crypto.timingSafeEqual(hashProvided, hashActual);
  }
}

module.exports = OtpService;
