class OtpService {
  constructor() {}

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
}

module.exports = OtpService;
