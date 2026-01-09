class OtpStore {
  constructor() {
    if (!OtpStore.instance) {
      this.store = new Map();
      OtpStore.instance = this;
    }
    return OtpStore.instance;
  }

  storeOtp(username, otp, otpExpiry) {
    this.store.set(username, { otp, otpExpiry });
  }

  verify(username, otp) {
    const record = this.store.get(username);
    if (!record) {
      throw new Error('OTP not found!');
    }
    if (record.otp !== otp) {
      throw new Error('Invalid OTP!');
    }
    if (Date.now() > record.otpExpiry) {
      this.store.delete(username);
      throw new Error('OTP has Expired');
    }
    this.store.delete(username);
    return { data: username, success: true };
  }
}

module.exports = OtpStore;
