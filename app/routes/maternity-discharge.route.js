var Boom = require('@hapi/boom');

const {
  DischargeSummaryService
} = require('../../service/maternity-discharge/discharge-summary.service');
const routes = [
  {
    method: 'GET',
    path: '/discharge-summary',
    options: {
      handler: async function (request, h) {
        return new Promise(async function (resolve) {
          var reply = function (payload) {
            return resolve(payload);
          };

          const { crId, amrsId } = request.query;
          try {
            const dischargeSummaryService = new DischargeSummaryService();
            const results = await dischargeSummaryService.getDischargeSummary(
              crId,
              amrsId
            );
            reply({
              results: results
            });
          } catch (error) {
            reply(Boom.badRequest());
          }
        });
      },
      description: 'Get patient maternity discharge encounter',
      notes: 'Get patient maternity discharge encounter',
      tags: ['api'],
      validate: {}
    }
  }
];
exports.routes = (server) => server.route(routes);
