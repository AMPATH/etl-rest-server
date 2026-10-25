const axios = require('axios');
const querystring = require('querystring');
const eidFacilityMap = require('../../../service/eid/eid-facility-mappings');
const db = require('../../../etl-db');
// import formurlencoded from 'form-urlencoded';
export class LabClient {
  config = null;
  constructor(config) {
    if (!config.serverUrl && !config.apiKey) {
      throw Error('Please check if the server url and apikey is set');
    }
    this.config = config;
  }
  /* This functions have swallow promise errors because the specific user case where we want all promises resolve when executed with Promise.All
        procced with caution
    */
  fetchDNAPCR(filterOptions, offset) {
    if (!filterOptions) {
      throw Error('Please supply filter options');
    }
    filterOptions.test = 1;
    filterOptions.dispatched = 1;
    return this.getFetchRequest(filterOptions, offset).catch(function (err) {
      //return error;
      return err;
    });
  }

  fetchViralLoad(filterOptions, offset) {
    if (!filterOptions) {
      throw Error('Please supply filter options');
    }
    filterOptions.test = 2;
    filterOptions.dispatched = 1;
    return this.getFetchRequest(filterOptions, offset).catch(function (err) {
      //return error;
      return err;
    });
  }

  fetchPendingViralLoad(filterOptions, offset) {
    if (!filterOptions) {
      throw Error('Please supply filter options');
    }
    filterOptions.test = 2;
    filterOptions.dispatched = 0;
    return this.getFetchRequest(filterOptions, offset).catch(function (err) {
      //return error;
      return err;
    });
  }

  fetchCD4(filterOptions, offset) {
    if (!filterOptions) {
      throw Error('Please supply filter options');
    }
    filterOptions.test = 3;
    filterOptions.dispatched = 1;
    return this.getFetchRequest(filterOptions, offset).catch(function (err) {
      //return error;
      return err;
    });
  }

  postLabPayload(payload) {
    switch (payload.test) {
      case 1:
        return this.postDNAPCR(payload);
      case 2:
        return this.postViralLoad(payload);
      case 3:
        return this.postCD4(payload);
      case 5:
        return this.postHPV(payload);
      default:
        break;
    }
  }
  postDNAPCR(payload) {
    return this.getPostRequest(payload, `${this.config.serverUrl}/api/eid`);
  }

  postViralLoad(payload) {
    return this.getPostRequest(payload, `${this.config.serverUrl}/api/vl`);
  }

  postCD4(payload) {
    return this.getPostRequest(payload, `${this.config.serverUrl}/api/cd4`);
  }
  postHPV(payload) {
    return this.getPostRequest(payload, `${this.config.serverUrl}/api/hpv`);
  }
  getPostRequest(payload, endpoint) {
    try {
      return axios.post(endpoint, querystring.stringify(payload), {
        headers: {
          apikey: this.config.apiKey,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 40000,
        // request-promise (without json: true) resolved with the raw body string
        transformResponse: [(data) => data]
      });
    } catch (error) {
      console.log('getPostRequestError', error.message);
    }
  }

  getFetchRequest(filterOptions, offset) {
    // process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
    let fetchOffset = 1;
    // let facilityCodes = this.getFacitityCodes().join();
    // filterOptions.facility_code = facilityCodes;
    let facilityCodes = this.getFacitityCodesDictionary();

    if (offset) {
      fetchOffset = offset;
    }
    // var host = new String(this.config.serverUrl).substr(8);
    var options = {
      uri: `${this.config.serverUrl}/api/function?page=${fetchOffset}`,
      headers: {
        apikey: this.config.apiKey,
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      timeout: 40000,
      form: filterOptions
    };
    return new Promise((resolve, reject) => {
      axios
        .post(options.uri, querystring.stringify(filterOptions), {
          headers: options.headers,
          timeout: options.timeout
        })
        .then((res) => {
          const response = res.data;
          var unknownMFL = [];
          if (Array.isArray(response.data) && response.data.length > 0) {
            response.data = response.data.filter((item) => {
              if (facilityCodes[item.facility_code]) {
                return true;
              } else {
                unknownMFL.push(item.facility_code);
              }
              return false;
            });
          }
          if (unknownMFL.length > 0) {
            // post unknown MFL code to slack
            console.warn('Unknown MFL codes', unknownMFL);
          }
          // console.log('RESULTS', response);
          resolve(response);
        })
        .catch((err) => {
          console.error('LAB INTEGRATION ERROR:', err);
          this.logRequestError(err, options)
            .then((result) => {
              reject(err);
            })
            .catch((error) => {
              reject(err);
            });
        });
    });
  }

  getFacitityCodes() {
    let facilityCodes = [];
    for (let key in eidFacilityMap) {
      let facility = eidFacilityMap[key];
      if (facility.mflCode && facility.mflCode !== '') {
        facilityCodes.push(facility.mflCode);
      }
    }
    return facilityCodes;
  }

  getFacitityCodesDictionary() {
    let facilityCodes = {};
    for (let key in eidFacilityMap) {
      let facility = eidFacilityMap[key];
      if (facility.mflCode && facility.mflCode !== '') {
        facilityCodes[facility.mflCode] = facility.mflCode;
      }
    }
    return facilityCodes;
  }

  logRequestError(error, options) {
    // console.log('Logging lab request error...', error);
    var sql =
      'INSERT INTO etl.eid_lab_request_errors(error,options)' +
      ' VALUES(?, ?);';

    var queryObject = {
      query: sql,
      sqlParams: [String(error), JSON.stringify(options)]
    };

    return new Promise(function (resolve, reject) {
      db.queryReportServer(queryObject, function (response) {
        if (response.error) {
          reject(response);
        } else {
          resolve(response);
        }
      });
    });
  }
}
