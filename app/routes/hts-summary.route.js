const { HTSModuleService } = require('../hts/hts-module.service');

const routes = [
  {
    method: 'GET',
    path: '/etl/hts-summary/{patient_uuid}',
    options: {
      plugins: {},
      handler: function (request, h) {
        return new Promise(async function (resolve) {
          var reply = function (payload) {
            return resolve(payload);
          };

          const { patient_uuid } = request.params;
          const hts_summary = new HTSModuleService();
          hts_summary
            .getHTSSummary(patient_uuid)
            .then((result) => {
              reply(result);
            })
            .catch(function (error) {
              reply(new Boom(500, 'Internal server error.', '', '', error));
            });
        });
      },
      description: 'HTS Summary',
      notes: 'HTS Summary',
      tags: ['HTS Summary api']
    }
  },
  {
    method: 'GET',
    path: '/etl/hts-latest-encounter/{patient_uuid}',
    options: {
      plugins: {},
      handler: function (request, h) {
        return new Promise(async function (resolve) {
          var reply = function (payload) {
            return resolve(payload);
          };

          const { patient_uuid } = request.params;
          const hts_summary = new HTSModuleService();
          hts_summary
            .getHTSLastEncounterDetails(patient_uuid)
            .then((result) => {
              reply(result);
            })
            .catch(function (error) {
              reply(new Boom(500, 'Internal server error.', '', '', error));
            });
        });
      },
      description: 'HTS Last Encounter',
      notes: 'HTS Last Encounter',
      tags: ['HTS Last Encounter api']
    }
  }
];

exports.routes = (server) => server.route(routes);
