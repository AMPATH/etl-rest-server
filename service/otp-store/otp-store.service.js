const redis = require('ioredis');
const config = require('../../conf/config.json');

const redisServer = new redis({
  host: config.redis.REDIS_HOST,
  port: config.redis.REDIS_PORT,
  password: config.redis.REDIS_PASSWORD
});

class OtpStore {
  constructor() {
    if (!OtpStore.instance) {
      this.store = new Map();
      OtpStore.instance = this;
    }
    return OtpStore.instance;
  }

  async storeOtp(username, otp, otpExpiry) {
    await redisServer.set(username, otp, 'EX', 120);
  }

  async verify(username, otp) {
    const record = await redisServer.get(username);
    if (!record) {
      return { data: username, success: false, message: 'OTP not found!' };
    }
    if (record !== String(otp)) {
      return { data: username, success: false, message: 'Invalid OTP!' };
    }

    await redisServer.del(username);
    return { data: username, success: true };
  }
}

module.exports = OtpStore;
