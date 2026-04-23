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
  },
  {
    method: 'GET',
    path: '/moh-740-report/patient-list',
    config: {
      handler: function (request, reply) {
        if (request.query.locationUuids) {
          (request.query.reportName = 'moh-740-report'),
            preRequest.resolveLocationIdsToLocationUuids(request, function () {
              let requestParams = Object.assign(
                {},
                request.query,
                request.params
              );

              let requestCopy = _.cloneDeep(requestParams);
              let reportParams = etlHelpers.getReportParams(
                request.query.reportName,
                ['startDate', 'endDate', 'locationUuids', 'locations'],
                requestParams
              );
              let report = 'MOH-740-report';
              requestCopy.locations = reportParams.requestParams.locations;
              const moh740Service = new Moh740Service(report, requestCopy);

              moh740Service
                .getPatientListReport(requestParams)
                .then((results) => {
                  reply(results);
                })
                .catch((err) => {
                  reply(Boom.internal('An error occured', err));
                });
            });
        }
      },
      description: 'MOH-412 Report',
      notes: 'Returns Report for HIV Cervical Cancer Screening',
      tags: ['api']
    }
  }
];

exports.routes = (server) => server.route(routes);
