var authorizer = require('../../authorization/etl-authorizer');
var privileges = authorizer.getAllPrivileges();
var surge_weeks = require('../../service/surge-reports/surge-weeks.service');
const routes = [
  {
    method: 'GET',
    path: '/etl/surge-weeks',
    options: {
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewPatient
        }
      },
      handler: function (request, h) {
        return new Promise(async function (resolve) {
          var reply = function (payload) {
            return resolve(payload);
          };

          surge_weeks
            .getSurgeWeeks()
            .then((result) => {
              reply(result);
            })
            .catch((err) => console.log('ERROR', err));
        });
      },
      description: 'Surge weeks',
      notes: 'Surge weekst',
      tags: ['Surge weeks api'],
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
