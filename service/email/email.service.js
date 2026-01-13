const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
var config = require('../../conf/config.json');
const OtpService = require('../otp/otp.service');
const OtpStore = require('../otp-store/otp-store.service');

class EmailService {
  constructor() {
    const mailConfig = config.nodemailer;
    this.otpService = new OtpService();
    this.otpStore = new OtpStore();

    this.transporter = nodemailer.createTransport({
      host: mailConfig.EMAIL_HOST,
      port: mailConfig.EMAIL_PORT ? Number(mailConfig.EMAIL_PORT) : 465,
      secure: true,
      auth: {
        user: mailConfig.EMAIL_USER,
        pass: mailConfig.EMAIL_PASS
      }
    });

    this.verifyConnection();
  }

  verifyConnection() {
    this.transporter.verify((error) => {
      if (error) {
        throw new Error('EMAIL SERVER NOT READY');
      }
    });
  }

  async sendOtp(username, email, otp, otpExpiry) {
    try {
      this.otpStore.storeOtp(username, otp, otpExpiry);
      this.transporter.sendMail({
        from: config.nodemailer.EMAIL_FROM,
        to: email,
        subject: otp,
        text: `Your OTP code is: ${otp}. It expires after one minute`
      });
      return { message: 'OTP sent to your email', user: username };
    } catch (err) {
      throw new Error('ERROR OCCURED WHEN SAVING AND SENDING OTP');
    }
  }
}

module.exports = EmailService;
