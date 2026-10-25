'use strict';
var axios = require('axios');
var https = require('https');
var cache = require('./session-cache');
module.exports = (function () {
  var sessionCookie = '';

  // OpenMRS may run behind a self-signed certificate in internal deployments;
  // keep the TLS behavior the previous request-promise client had.
  var httpsAgent = new https.Agent({ rejectUnauthorized: false });

  return {
    getRequestPromise: function getRequestPromise(queryString, url) {
      return axios
        .get(url, {
          params: queryString,
          headers: {
            'User-Agent': 'Request-Promise',
            Cookie: sessionCookie
          },
          httpsAgent: httpsAgent
        })
        .then(function (response) {
          return response.data;
        });
    },
    setAuthorization: function (authorization) {
      sessionCookie = authorization;
    },
    getAuthorization: function () {
      return sessionCookie;
    },
    postRequestPromise: function postRequestPromise(payload, uri) {
      return axios
        .post(uri, payload, {
          headers: {
            'User-Agent': 'Request-Promise',
            Cookie: sessionCookie,
            'content-type': 'application/json'
          },
          httpsAgent: httpsAgent
        })
        .then(function (response) {
          return response.data;
        });
    },
    deleteRequestPromise: function deleteRequestPromise(uri) {
      // Resolves with the full response (status, headers, data), matching
      // the previous resolveWithFullResponse behavior.
      return axios.delete(uri, {
        headers: {
          'User-Agent': 'Request-Promise',
          Cookie: sessionCookie
        },
        httpsAgent: httpsAgent
      });
    }
  };
})();
