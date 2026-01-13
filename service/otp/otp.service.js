const { values } = require('lodash');
const db = require('../../etl-db');
const bcrypt = require('bcryptjs');

class OtpService {
  constructor() {}

  getUserEmail(username) {
    if (!username) {
      throw new Error('username not defined');
    }
    return new Promise((resolve, reject) => {
      const sql = `SELECT 
      u.person_id,
      pa.value as email

    FROM
        amrs.users u
        INNER JOIN amrs.person_attribute pa ON u.person_id = pa.person_id AND pa.person_attribute_type_id = 163
    WHERE
         u.username = '${username}'
        AND u.retired = 0`;
      const queryParts = {
        sql: sql
      };
      db.queryServer(queryParts, function (result) {
        result.sql = sql;
        resolve(result.result);
      });
    });
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
    now.setSeconds(now.getSeconds() + seconds * 1000);
    return now;
  }
}

module.exports = OtpService;
