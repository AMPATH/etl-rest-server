const { method, config } = require('bluebird');
var authorizer = require('../../authorization/etl-authorizer');
var privileges = authorizer.getAllPrivileges();
var registersmappings = require('../moh-registers/registers-mapping');
const { error } = require('jquery');
const { validate } = require('node-cron');
const { options } = require('joi');

const routes = [
  {
    method: 'GET',
    path: '/etl/registers/prepregisterdata',
    config: {
      plugins: {},
      handler: function (request, reply) {
        registersmappings
          .getPrEPRegisterData(request.query)
          .then((result) => {
            reply(result);
          })
          .catch((error) => {
            reply(error);
          });
      },
      description: 'List of facilities with MFL code',
      notes: 'Returns facilities list',
      tags: ['api'],
      validate: {
        options: {
          allowUnknown: true
        },
        params: {}
      }
    }
  },
  {
    method: 'GET',
    path: '/etl/registers/defaultertracing',
    config: {
      plugins: {},
      handler: function (request, reply) {
        registersmappings
          .getDefaulterTracingRegisterData(request.query)
          .then((result) => {
            reply(result);
          })
          .catch((error) => {
            reply(error);
          });
      },
      description: 'List of facilities with MFL code',
      notes: 'Returns facilities list',
      tags: ['api'],
      validate: {
        options: {
          allowUnknown: true
        },
        params: {}
      }
    }
  },
  {
    method: 'GET',
    path: '/etl/registers/heiregister',
    config: {
      plugins: {},
      handler: function (request, reply) {
        registersmappings
          .getHEIRegisterData(request.query)
          .then((result) => {
            reply(result);
          })
          .catch((error) => {
            reply(error);
          });
      },
      description: 'List of facilities with MFL code',
      notes: 'Returns facilities list',
      tags: ['api'],
      validate: {
        options: {
          allowUnknown: true
        },
        params: {}
      }
    }
  },
  {
    method: 'GET',
    path: '/etl/registers/cntregister',
    config: {
      plugins: {},
      handler: function (request, reply) {
        registersmappings
          .getCNTRegisterData(request.query)
          .then((result) => {
            reply(result);
          })
          .catch((error) => {
            reply(error);
          });
      },
      description: 'List of facilities with MFL code',
      notes: 'Returns facilities list',
      tags: ['api'],
      validate: {
        options: {
          allowUnknown: true
        },
        params: {}
      }
    }
  },
  {
    method: 'GET',
    path: '/etl/registers/ancregister',
    config: {
      plugins: {},
      handler: function (request, reply) {
        registersmappings
          .getANCRegisterData(request.query)
          .then((result) => {
            reply(result);
          })
          .catch((error) => {
            reply(error);
          });
      },
      description: 'List of facilities with MFL code',
      notes: 'Returns facilities list',
      tags: ['api'],
      validate: {
        options: {
          allowUnknown: true
        },
        params: {}
      }
    }
  },
  {
    method: 'GET',
    path: '/etl/registers/pncregister',
    config: {
      plugins: {},
      handler: function (request, reply) {
        registersmappings
          .getPNCRegisterData(request.query)
          .then((result) => {
            reply(result);
          })
          .catch((error) => {
            reply(error);
          });
      },
      description: 'List of facilities with MFL code',
      notes: 'Returns facilities list',
      tags: ['api'],
      validate: {
        options: {
          allowUnknown: true
        },
        params: {}
      }
    }
  }
];

exports.routes = (server) => server.route(routes);
