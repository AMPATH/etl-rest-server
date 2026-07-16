'use strict';

var Joi = require('joi');
var odooProxyService = require('../../service/odoo/odoo-proxy.service');

function handleError(err, reply) {
  var statusCode = (err && err.statusCode) || 500;
  var message = (err && err.message) || 'Error communicating with Odoo';
  reply({ error: message }).code(statusCode);
}

var routes = [
  {
    method: 'GET',
    path: '/etl/odoo/billing/patient/{patientId}',
    config: {
      handler: function (request, reply) {
        odooProxyService
          .getBillingByPatient(request.params.patientId)
          .then(function (result) {
            reply(result);
          })
          .catch(function (err) {
            handleError(err, reply);
          });
      },
      description: 'Get full billing status for a patient',
      notes:
        'Returns all sale orders for the patient identified by their OpenMRS UUID, ' +
        'including order lines with per-line billing status and linked invoices.',
      tags: ['api', 'odoo', 'billing'],
      validate: {
        options: { allowUnknown: true },
        params: {
          patientId: Joi.string()
            .required()
            .description('OpenMRS patient UUID (x_external_identifier)')
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/etl/odoo/billing/orders',
    config: {
      handler: function (request, reply) {
        var q = request.query;
        odooProxyService
          .listOrders({
            company_external_id: q.company_external_id,
            date_from: q.date_from,
            date_to: q.date_to,
            state: q.state,
            limit: q.limit,
            offset: q.offset
          })
          .then(function (result) {
            reply(result);
          })
          .catch(function (err) {
            handleError(err, reply);
          });
      },
      description: 'List sale orders with optional filters',
      notes:
        'Returns a paginated list of sale orders including order lines. ' +
        'Filter by facility location UUID, date range, or order state.',
      tags: ['api', 'odoo', 'billing'],
      validate: {
        options: { allowUnknown: true },
        query: {
          company_external_id: Joi.string()
            .optional()
            .description('OpenMRS location UUID of the facility'),
          date_from: Joi.string()
            .optional()
            .description('ISO date YYYY-MM-DD (inclusive lower bound)'),
          date_to: Joi.string()
            .optional()
            .description('ISO date YYYY-MM-DD (inclusive upper bound)'),
          state: Joi.string()
            .valid('draft', 'sent', 'sale', 'done', 'cancel')
            .optional()
            .description('Order state'),
          limit: Joi.number()
            .integer()
            .min(1)
            .max(500)
            .optional()
            .description('Max records to return (default 100)'),
          offset: Joi.number()
            .integer()
            .min(0)
            .optional()
            .description('Pagination offset (default 0)')
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/etl/odoo/billing/order/{id}',
    config: {
      handler: function (request, reply) {
        var orderId = parseInt(request.params.id, 10);

        if (isNaN(orderId)) {
          return reply({ error: 'Order id must be a number' }).code(400);
        }

        odooProxyService
          .getBillingByOrder(orderId)
          .then(function (result) {
            reply(result);
          })
          .catch(function (err) {
            handleError(err, reply);
          });
      },
      description: 'Get full billing detail for a single sale order',
      notes:
        'Returns the sale order with all order lines (billing status, product info) ' +
        'and linked invoices including the invoiced line items.',
      tags: ['api', 'odoo', 'billing'],
      validate: {
        options: { allowUnknown: true },
        params: {
          id: Joi.number()
            .integer()
            .required()
            .description('Odoo sale order id')
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/etl/odoo/inventory/stock',
    config: {
      handler: function (request, reply) {
        var q = request.query;
        odooProxyService
          .getInventoryStock({
            openmrs_drug_uuid: q.openmrs_drug_uuid,
            company_external_id: q.company_external_id,
            lot_name: q.lot_name
          })
          .then(function (result) {
            reply(result);
          })
          .catch(function (err) {
            handleError(err, reply);
          });
      },
      description:
        'Get Odoo on-hand stock for a drug at an OpenMRS location warehouse',
      notes:
        'Proxies to Odoo GET /ampath/inventory/stock. ' +
        'company_external_id should be the OpenMRS order location UUID.',
      tags: ['api', 'odoo', 'inventory'],
      validate: {
        options: { allowUnknown: true },
        query: {
          openmrs_drug_uuid: Joi.string()
            .required()
            .description('OpenMRS drug UUID (product x_openmrs_drug_uuid)'),
          company_external_id: Joi.string()
            .required()
            .description('OpenMRS order location UUID'),
          lot_name: Joi.string()
            .optional()
            .description('Optional lot name filter')
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/etl/odoo/inventory/dispense',
    config: {
      handler: function (request, reply) {
        odooProxyService
          .dispenseInventory(request.payload)
          .then(function (result) {
            reply(result);
          })
          .catch(function (err) {
            handleError(err, reply);
          });
      },
      description: 'Dispense/decrement Odoo stock via outgoing picking',
      notes:
        'Proxies to Odoo POST /ampath/inventory/dispense. ' +
        'Does not use sale orders; billing remains in OpenMRS/O3.',
      tags: ['api', 'odoo', 'inventory'],
      validate: {
        options: { allowUnknown: true },
        payload: Joi.object({
          openmrs_drug_uuid: Joi.string().required(),
          quantity: Joi.number().positive().required(),
          company_external_id: Joi.string()
            .required()
            .description('OpenMRS order location UUID'),
          openmrs_order_id: Joi.string().optional().allow(null, ''),
          patient_external_id: Joi.string().optional().allow(null, ''),
          lot_id: Joi.number().integer().optional().allow(null),
          uom_name: Joi.string().optional().allow(null, '')
        })
      }
    }
  }
];

exports.routes = function (server) {
  server.route(routes);
};
