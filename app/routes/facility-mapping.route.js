var authorizer = require('../../authorization/etl-authorizer');
var privileges = authorizer.getAllPrivileges();
var facilitymappings = require('../facility-mappings/facility-mapping');

const routes = [
  {
    method: 'GET',
    path: '/etl/parentlocations',
    options: {
      plugins: {},
      handler: function (request, h) {
        return new Promise(async function (resolve) {
          var reply = function (payload) {
            return resolve(payload);
          };

          facilitymappings
            .getParentLocations(request.query.p)
            .then((result) => {
              reply(result);
            })
            .catch((error) => {
              reply(error);
            });
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
    path: '/etl/childlocations',
    options: {
      plugins: {},
      handler: function (request, h) {
        return new Promise(async function (resolve) {
          var reply = function (payload) {
            return resolve(payload);
          };

          facilitymappings
            .getChildLocations(request.query)
            .then((result) => {
              reply(result);
            })
            .catch((error) => {
              reply(error);
            });
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
