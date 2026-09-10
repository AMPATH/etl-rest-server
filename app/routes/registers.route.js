var authorizer = require('../../authorization/etl-authorizer');
var privileges = authorizer.getAllPrivileges();
var facilitymappings = require('../facility-mappings/registers');

const routes = [
  {
    method: 'GET',
    path: '/etl/prepregisterdata',
    config: {
      plugins: {},
      handler: function (request, reply) {
        facilitymappings
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
  }
];

exports.routes = (server) => server.route(routes);
