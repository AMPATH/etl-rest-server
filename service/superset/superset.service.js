import axios from 'axios';

var config = require('../../conf/config.json');

class SupersetService {
  constructor() {
    this.secretKey = config.superset.GUEST_TOKEN_JWT_SECRET;
    this.dashboardId = config.superset.DASHBOARD_ID;
    this.supersetUrl = config.superset.SUPERSET_URL;
    this.username = config.superset.SUPERSET_USERNAME;
    this.password = config.superset.SUPERSET_PASSWORD;
  }

  async getAccessToken() {
    const response = await axios.post(
      `${this.supersetUrl}/api/v1/security/login`,
      {
        username: this.username,
        password: this.password,
        provider: 'db',
        refresh: true
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.access_token;
  }

  async getSupersetGuestToken(locationId) {
    const token = await this.getAccessToken();

    const response = await axios.post(
      `${this.supersetUrl}/api/v1/security/guest_token`,
      {
        user: {
          first_name: 'ampath',
          last_name: 'ampath',
          username: 'admin'
        },
        resources: [{ type: 'dashboard', id: this.dashboardId }],
        rls: [
          {
            clause: `location_id = ${locationId}`
          }
        ],
        aud: 'superset',
        type: 'guest'
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.token;
  }
}

module.exports = SupersetService;
