'use strict';

var Joi = require('joi');
var odooProxyService = require('../../service/odoo/odoo-proxy.service');

var routes = [
  {
    method: 'GET',
    path: '/etl/odoo/{model}',
    config: {
      auth: 'default',
      handler: function (request, reply) {
        var model = request.params.model;

        odooProxyService
          .proxyGetRequest(model)
          .then(function (result) {
            reply(result);
          })
          .catch(function (err) {
            var statusCode = (err && err.statusCode) || 500;
            var message =
              (err && err.message) || 'Error proxying request to Odoo';
            reply({ error: message }).code(statusCode);
          });
      },
      description: 'Proxy GET request to Odoo REST API for a given model',
      notes:
        'Fetches all records from Odoo via /send_request using credentials from server config.',
      tags: ['api', 'odoo'],
      validate: {
        options: { allowUnknown: true },
        params: {
          model: Joi.string()
            .required()
            .description(
              'Odoo model name, e.g. sale.order, res.partner, product.template'
            )
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/etl/odoo/{model}/{id}',
    config: {
      auth: 'default',
      handler: function (request, reply) {
        var model = request.params.model;
        var recordId = parseInt(request.params.id, 10);

        if (isNaN(recordId)) {
          return reply({ error: 'Record id must be a number' }).code(400);
        }

        odooProxyService
          .proxyGetRequest(model, null, recordId)
          .then(function (result) {
            reply(result);
          })
          .catch(function (err) {
            var statusCode = (err && err.statusCode) || 500;
            var message =
              (err && err.message) || 'Error proxying request to Odoo';
            reply({ error: message }).code(statusCode);
          });
      },
      description: 'Proxy GET request to Odoo REST API for a single record',
      notes: 'Fetches a single record by id from Odoo via /send_request.',
      tags: ['api', 'odoo'],
      validate: {
        options: { allowUnknown: true },
        params: {
          model: Joi.string().required().description('Odoo model name'),
          id: Joi.number().integer().required().description('Record id')
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/etl/odoo/{model}',
    config: {
      auth: 'default',
      handler: function (request, reply) {
        var model = request.params.model;
        var body = request.payload || {};

        odooProxyService
          .proxyPostRequest(model, body)
          .then(function (result) {
            reply(result).code(201);
          })
          .catch(function (err) {
            var statusCode = (err && err.statusCode) || 500;
            var message =
              (err && err.message) || 'Error proxying request to Odoo';
            reply({ error: message }).code(statusCode);
          });
      },
      description: 'Proxy POST request to Odoo REST API to create a record',
      notes: 'Creates a new record in Odoo via /send_request.',
      tags: ['api', 'odoo'],
      validate: {
        options: { allowUnknown: true },
        params: {
          model: Joi.string().required().description('Odoo model name')
        }
      }
    }
  },
  {
    method: 'PUT',
    path: '/etl/odoo/{model}/{id}',
    config: {
      auth: 'default',
      handler: function (request, reply) {
        var model = request.params.model;
        var recordId = parseInt(request.params.id, 10);
        var body = request.payload || {};

        if (isNaN(recordId)) {
          return reply({ error: 'Record id must be a number' }).code(400);
        }

        odooProxyService
          .proxyPutRequest(model, recordId, body)
          .then(function (result) {
            reply(result);
          })
          .catch(function (err) {
            var statusCode = (err && err.statusCode) || 500;
            var message =
              (err && err.message) || 'Error proxying request to Odoo';
            reply({ error: message }).code(statusCode);
          });
      },
      description: 'Proxy PUT request to Odoo REST API to update a record',
      notes: 'Updates an existing record in Odoo via /send_request.',
      tags: ['api', 'odoo'],
      validate: {
        options: { allowUnknown: true },
        params: {
          model: Joi.string().required().description('Odoo model name'),
          id: Joi.number().integer().required().description('Record id')
        }
      }
    }
  }
];

exports.routes = function (server) {
  server.route(routes);
};
