'use strict';

var rp = require('request-promise');
var config = require('../../conf/config');

function getOdooConfig() {
  var odooConfig = config.odoo || {};
  return {
    host: odooConfig.host || 'http://localhost:8069',
    username: odooConfig.username || 'admin',
    password: odooConfig.password || 'admin'
  };
}

/**
 * Shared auth headers for all Odoo requests.
 */
function authHeaders(odooConfig) {
  return {
    login: odooConfig.username,
    password: odooConfig.password
  };
}

// ------------------------------------------------------------------
// Billing status endpoints  (ampath_billing controller)
// ------------------------------------------------------------------

/**
 * Fetch full billing status for a patient by their OpenMRS external ID.
 * Calls GET /ampath/billing/patient/<patientExternalId>
 *
 * @param {string} patientExternalId - OpenMRS patient UUID
 */
function getBillingByPatient(patientExternalId) {
  var odooConfig = getOdooConfig();
  return rp({
    method: 'GET',
    uri:
      odooConfig.host +
      '/ampath/billing/patient/' +
      encodeURIComponent(patientExternalId),
    headers: authHeaders(odooConfig),
    json: true,
    rejectUnauthorized: false
  });
}

/**
 * Fetch full billing detail for a single sale order by its Odoo id.
 * Calls GET /ampath/billing/order/<orderId>
 *
 * @param {number} orderId - Odoo sale.order id
 */
function getBillingByOrder(orderId) {
  var odooConfig = getOdooConfig();
  return rp({
    method: 'GET',
    uri: odooConfig.host + '/ampath/billing/order/' + orderId,
    headers: authHeaders(odooConfig),
    json: true,
    rejectUnauthorized: false
  });
}

module.exports = {
  getBillingByPatient: getBillingByPatient,
  getBillingByOrder: getBillingByOrder
};
