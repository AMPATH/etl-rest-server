const preRequest = require('../../pre-request-processing');
import { Moh740Service } from '../../service/moh-740/moh-740.service';
const etlHelpers = require('../../etl-helpers.js');
const routes = [
  {
    method: 'GET',
    path: '/moh-740-report',
    config: {
      handler: async function (request, reply) {
        if (request.query.locationUuids) {
          preRequest.resolveLocationIdsToLocationUuids(request, function () {
            let requestParams = Object.assign(
              {},
              request.query,
              request.params
            );
            let reportParams = etlHelpers.getReportParams(
              'moh-740-report',
              ['startDate', 'endDate', 'locationUuids'],
              requestParams
            );
            let report = 'MOH-740-report';

            const moh740Service = new Moh740Service(
              report,
              reportParams.requestParams
            );
            moh740Service
              .generateReport()
              .then((result) => {
                reply(result);
              })
              .catch((error) => {
                reply(error);
              });
          });
        }
      },
      description: 'Get MOH-740 Monthly report summary',
      notes: 'MOH-740 report',
      tags: ['api'],
      validate: {}
    }
  }
];

exports.routes = (server) => server.route(routes);
