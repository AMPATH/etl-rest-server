'use strict';

var rp = require('request-promise');
var cache = require('memory-cache');
var config = require('../../conf/config');

var CACHE_KEY_PREFIX = 'odoo_api_key_';

function getOdooConfig() {
  var odooConfig = config.odoo || {};
  return {
    host: odooConfig.host || 'http://localhost:8069',
    username: odooConfig.username || 'admin',
    password: odooConfig.password || 'admin',
    db: odooConfig.db || 'odoo',
    apiKeyCacheTtlMs: odooConfig.apiKeyCacheTtlMs || 3600000
  };
}

function getCacheKey(username) {
  return CACHE_KEY_PREFIX + username;
}

function fetchApiKey(odooConfig) {
  var options = {
    method: 'GET',
    uri: odooConfig.host + '/odoo_connect',
    headers: {
      login: odooConfig.username,
      password: odooConfig.password,
      db: odooConfig.db
    },
    json: true,
    rejectUnauthorized: false
  };

  return rp(options).then(function (response) {
    var apiKey = response['api-key'];
    if (!apiKey) {
      throw new Error('No api-key returned from /odoo_connect');
    }
    return apiKey;
  });
}

function getApiKey() {
  var odooConfig = getOdooConfig();
  var cacheKey = getCacheKey(odooConfig.username);
  var cached = cache.get(cacheKey);

  if (cached) {
    return Promise.resolve(cached);
  }

  return fetchApiKey(odooConfig).then(function (apiKey) {
    cache.put(cacheKey, apiKey, odooConfig.apiKeyCacheTtlMs);
    return apiKey;
  });
}

function invalidateApiKey() {
  var odooConfig = getOdooConfig();
  cache.del(getCacheKey(odooConfig.username));
}

/**
 * Proxy a GET request to Odoo's /send_request endpoint.
 * @param {string} model - Odoo model name (e.g. 'sale.order')
 * @param {object} [queryParams] - Optional query parameters
 * @param {number} [recordId] - Optional record id for single-record fetch (maps to `Id`)
 */
function proxyGetRequest(model, queryParams, recordId) {
  var odooConfig = getOdooConfig();

  return getApiKey()
    .then(function (apiKey) {
      var qs = { model: model };
      if (recordId != null) {
        qs.Id = recordId;
      }

      var options = {
        method: 'GET',
        uri: odooConfig.host + '/send_request',
        qs: qs,
        headers: {
          'api-key': apiKey,
          login: odooConfig.username,
          password: odooConfig.password
        },
        json: true,
        rejectUnauthorized: false
      };

      return rp(options);
    })
    .catch(function (err) {
      // If the API key is stale (401/403), invalidate cache and retry once
      if (err.statusCode === 401 || err.statusCode === 403) {
        invalidateApiKey();
        return getApiKey().then(function (freshKey) {
          var odooConf = getOdooConfig();
          var qs = { model: model };
          if (recordId != null) {
            qs.Id = recordId;
          }
          return rp({
            method: 'GET',
            uri: odooConf.host + '/send_request',
            qs: qs,
            headers: {
              'api-key': freshKey,
              login: odooConf.username,
              password: odooConf.password
            },
            json: true,
            rejectUnauthorized: false
          });
        });
      }
      throw err;
    });
}

/**
 * Proxy a POST request to Odoo's /send_request endpoint.
 * @param {string} model - Odoo model name
 * @param {object} body - Record data to create
 */
function proxyPostRequest(model, body) {
  var odooConfig = getOdooConfig();

  return getApiKey().then(function (apiKey) {
    var options = {
      method: 'POST',
      uri: odooConfig.host + '/send_request',
      qs: { model: model },
      headers: {
        'api-key': apiKey,
        login: odooConfig.username,
        password: odooConfig.password
      },
      body: body,
      json: true,
      rejectUnauthorized: false
    };
    return rp(options);
  });
}

/**
 * Proxy a PUT request to Odoo's /send_request endpoint.
 * @param {string} model - Odoo model name
 * @param {number} recordId - Record id to update
 * @param {object} body - Fields to update
 */
function proxyPutRequest(model, recordId, body) {
  var odooConfig = getOdooConfig();

  return getApiKey().then(function (apiKey) {
    var options = {
      method: 'PUT',
      uri: odooConfig.host + '/send_request',
      qs: { model: model, id: recordId },
      headers: {
        'api-key': apiKey,
        login: odooConfig.username,
        password: odooConfig.password
      },
      body: body,
      json: true,
      rejectUnauthorized: false
    };
    return rp(options);
  });
}

module.exports = {
  getApiKey: getApiKey,
  invalidateApiKey: invalidateApiKey,
  proxyGetRequest: proxyGetRequest,
  proxyPostRequest: proxyPostRequest,
  proxyPutRequest: proxyPutRequest
};
