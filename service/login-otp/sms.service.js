const axios = require('axios');
const config = require('../../conf/config.json');

class SmsService {
  constructor() {
    const smsConfig = config.sms;

    if (
      !smsConfig ||
      !smsConfig.baseUrl ||
      !smsConfig.apiKey ||
      !smsConfig.partnerId ||
      !smsConfig.shortcode
    ) {
      this.invalidConfig = true;
      this.configError =
        'Incomplete or missing SMS configuration in config.json';
      return;
    }

    this.baseUrl = smsConfig.baseUrl;
    this.apiKey = smsConfig.apiKey;
    this.partnerId = smsConfig.partnerId;
    this.shortcode = smsConfig.shortcode;
    this.invalidConfig = false;
  }

  formatPhoneNumber(phone) {
    if (!phone) return null;

    const digits = phone.replace(/\D/g, '');
    const lastNine = digits.slice(-9);

    if (lastNine.length !== 9) return null;

    return '254' + lastNine;
  }

  async sendOtp(phone, otp, message) {
    if (this.invalidConfig) {
      return {
        success: false,
        statusCode: 500,
        message: this.configError
      };
    }

    const formattedPhone = this.formatPhoneNumber(phone);
    if (!formattedPhone) {
      return {
        success: false,
        statusCode: 400,
        message: 'Invalid or missing phone number'
      };
    }

    try {
      const url =
        `${this.baseUrl}/api/services/sendsms?apikey=${this.apiKey}` +
        `&partnerID=${this.partnerId}` +
        `&message=${encodeURIComponent(message)}` +
        `&shortcode=${this.shortcode}` +
        `&mobile=${formattedPhone}`;

      const response = await axios.get(url);

      return {
        success: true,
        statusCode: response.status,
        data: response.data,
        message: 'OTP SMS sent to your phone'
      };
    } catch (error) {
      console.error(
        'SMS sending failed:',
        error.response?.data || error.message
      );

      return {
        success: false,
        statusCode: error.response?.status || 500,
        error: error.response?.data || error.message,
        message: 'Failed to send SMS'
      };
    }
  }
}

module.exports = SmsService;
