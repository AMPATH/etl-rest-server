const nodemailer = require('nodemailer');
const config = require('../../conf/config.json');
const OtpService = require('../otp/otp.service');
const OtpStore = require('../otp-store/otp-store.service');

class EmailService {
  constructor() {
    const mailConfig = config.nodemailer;

    if (
      !mailConfig ||
      !mailConfig.EMAIL_HOST ||
      !mailConfig.EMAIL_USER ||
      !mailConfig.EMAIL_PASS ||
      !mailConfig.EMAIL_FROM
    ) {
      this.invalidConfig = true;
      this.configError =
        'Incomplete or missing Email configuration in config.json';
      return;
    }

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

    this.invalidConfig = false;

    this.transporter.verify((error) => {
      if (error) {
        console.error('EMAIL SERVER NOT READY:', error.message);
      }
    });
  }

  async sendOtp(email, message) {
    if (this.invalidConfig) {
      return {
        success: false,
        statusCode: 500,
        message: this.configError
      };
    }

    if (!email) {
      return {
        success: false,
        statusCode: 400,
        message: 'Invalid or missing email address'
      };
    }

    try {
      const info = await this.transporter.sendMail({
        from: config.nodemailer.EMAIL_FROM,
        to: email,
        subject: `OTP - Taifa Care AMRS Login`,
        text: message
      });

      return {
        success: true,
        statusCode: 200,
        data: info,
        message: 'OTP sent to your email'
      };
    } catch (err) {
      console.error('EMAIL sending failed:', err.message);

      return {
        success: false,
        statusCode: 500,
        error: err.message,
        message: 'Failed to send OTP email'
      };
    }
  }
}

module.exports = EmailService;
