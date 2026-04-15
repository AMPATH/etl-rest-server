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
