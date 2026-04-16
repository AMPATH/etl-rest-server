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

/**
 * List sale orders with optional filters.
 * Calls GET /ampath/billing/orders
 *
 * @param {object} filters
 * @param {string}  [filters.company_external_id] - Location UUID of the facility
 * @param {string}  [filters.date_from]           - ISO date YYYY-MM-DD (inclusive)
 * @param {string}  [filters.date_to]             - ISO date YYYY-MM-DD (inclusive)
 * @param {string}  [filters.state]               - draft|sent|sale|done|cancel
 * @param {number}  [filters.limit]               - Max records (default 100)
 * @param {number}  [filters.offset]              - Pagination offset (default 0)
 */
function listOrders(filters) {
  var odooConfig = getOdooConfig();
  var qs = {};
  if (filters) {
    if (filters.company_external_id)
      qs.company_external_id = filters.company_external_id;
    if (filters.date_from) qs.date_from = filters.date_from;
    if (filters.date_to) qs.date_to = filters.date_to;
    if (filters.state) qs.state = filters.state;
    if (filters.limit !== undefined) qs.limit = filters.limit;
    if (filters.offset !== undefined) qs.offset = filters.offset;
  }
  return rp({
    method: 'GET',
    uri: odooConfig.host + '/ampath/billing/orders',
    qs: qs,
    headers: authHeaders(odooConfig),
    json: true,
    rejectUnauthorized: false
  });
}

module.exports = {
  getBillingByPatient: getBillingByPatient,
  getBillingByOrder: getBillingByOrder,
  listOrders: listOrders
};
