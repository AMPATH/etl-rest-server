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

/**
 * Fetch on-hand stock for a drug at an OpenMRS location's warehouse.
 * Calls GET /ampath/inventory/stock
 *
 * @param {object} filters
 * @param {string} filters.openmrs_drug_uuid
 * @param {string} filters.company_external_id - OpenMRS order location UUID
 * @param {string} [filters.lot_name]
 */
function getInventoryStock(filters) {
  return inventoryGet('/ampath/inventory/stock', filters);
}

/**
 * Fetch lot/batch list for a drug at an OpenMRS location's warehouse.
 * Calls GET /ampath/inventory/batches
 *
 * @param {object} filters
 * @param {string} filters.openmrs_drug_uuid
 * @param {string} filters.company_external_id
 * @param {string} [filters.lot_name]
 */
function getInventoryBatches(filters) {
  return inventoryGet('/ampath/inventory/batches', filters);
}

/**
 * Fetch quantity available (on-hand + free) for a drug.
 * Calls GET /ampath/inventory/quantity
 *
 * @param {object} filters
 * @param {string} filters.openmrs_drug_uuid
 * @param {string} filters.company_external_id
 */
function getInventoryQuantity(filters) {
  return inventoryGet('/ampath/inventory/quantity', filters, {
    includeLotName: false
  });
}

/**
 * @param {string} path
 * @param {object} filters
 * @param {{ includeLotName?: boolean }} [options]
 */
function inventoryGet(path, filters, options) {
  var odooConfig = getOdooConfig();
  var includeLotName = !options || options.includeLotName !== false;
  var qs = {};
  if (filters) {
    if (filters.openmrs_drug_uuid)
      qs.openmrs_drug_uuid = filters.openmrs_drug_uuid;
    if (filters.company_external_id)
      qs.company_external_id = filters.company_external_id;
    if (includeLotName && filters.lot_name) qs.lot_name = filters.lot_name;
  }
  return rp({
    method: 'GET',
    uri: odooConfig.host + path,
    qs: qs,
    headers: authHeaders(odooConfig),
    json: true,
    rejectUnauthorized: false
  });
}

/**
 * Dispense (decrement) stock via outgoing stock.picking.
 * Calls POST /ampath/inventory/dispense
 *
 * @param {object} body
 */
function dispenseInventory(body) {
  var odooConfig = getOdooConfig();
  return rp({
    method: 'POST',
    uri: odooConfig.host + '/ampath/inventory/dispense',
    headers: authHeaders(odooConfig),
    body: body || {},
    json: true,
    rejectUnauthorized: false
  });
}

/**
 * Reverse a prior dispense keyed by openmrs_order_id.
 * Calls POST /ampath/inventory/reverse
 *
 * @param {object} body
 * @param {string} body.openmrs_order_id
 */
function reverseInventory(body) {
  var odooConfig = getOdooConfig();
  return rp({
    method: 'POST',
    uri: odooConfig.host + '/ampath/inventory/reverse',
    headers: authHeaders(odooConfig),
    body: body || {},
    json: true,
    rejectUnauthorized: false
  });
}

module.exports = {
  getBillingByPatient: getBillingByPatient,
  getBillingByOrder: getBillingByOrder,
  listOrders: listOrders,
  getInventoryStock: getInventoryStock,
  getInventoryBatches: getInventoryBatches,
  getInventoryQuantity: getInventoryQuantity,
  dispenseInventory: dispenseInventory,
  reverseInventory: reverseInventory
};
