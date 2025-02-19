var authorizer = require('../../authorization/etl-authorizer');
var privileges = authorizer.getAllPrivileges();
var dbRegister = require('../registers-framework/registers-db');

const routes = [
  {
    method: 'GET',
    path: '/etl/hei-register',
    config: {
      plugins: {},
      handler: function (request, reply) {
        dbRegister
          .getHeiDetails(request.query.p)
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
    path: '/etl/care-and-treatment-register',
    config: {
      plugins: {},
      handler: function (request, reply) {
        dbRegister
          .getCareTreatmentDetails(request.query.p)
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
