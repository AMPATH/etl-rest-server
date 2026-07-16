var Boom = require('boom');

const {
  DischargeSummaryService
} = require('../../service/maternity-discharge/discharge-summary.service');
const routes = [
  {
    method: 'GET',
    path: '/discharge-summary',
    config: {
      auth: false,
      handler: async function (request, reply) {
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
      },
      description: 'Get patient maternity discharge encounter',
      notes: 'Get patient maternity discharge encounter',
      tags: ['api'],
      validate: {}
    }
  }
];
exports.routes = (server) => server.route(routes);
