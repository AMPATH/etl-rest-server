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
      auth: 'default',
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
      auth: 'default',
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
      auth: 'default',
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
  }
];

exports.routes = function (server) {
  server.route(routes);
};
