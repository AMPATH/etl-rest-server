var authorizer = require('../../authorization/etl-authorizer');
var etlHelpers = require('../../etl-helpers');
var preRequest = require('../../pre-request-processing');
import { Lab706Service } from '../../service/lab-706.service';

const routes = [
  {
    method: 'GET',
    path: '/moh-505',
    config: {
      auth: false,
      handler: function (request, reply) {
        preRequest.resolveLocationIdsToLocationUuids(request, function () {
          let requestParams = Object.assign({}, request.query, request.params);
          let reportParams = etlHelpers.getReportParams(
            'MOH-505-report',
            ['startDate', 'endDate', 'locationUuids'],
            requestParams
          );

          let service = new Lab706Service(
            'MOH-505-report',
            reportParams.requestParams
          );
          service
            .generateReport(reportParams.requestParams)
            .then((result) => {
              reply(result);
            })
            .catch((error) => {
              reply(error);
            });
        });
      },
      description: 'Lab 706 blood chemistry aggregated report',
      notes:
        'Returns total exams, max and min blood sugar grouped by test datetime',
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
    path: '/moh-505/patient-list',
    config: {
      auth: false,
      handler: function (request, reply) {
        if (request.query.locationUuids) {
          if (request.query['startDate']) {
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

            let report = 'MOH-505-report';
            requestCopy.locations = reportParams.requestParams.locations;
            let service = new Lab706Service(report, requestCopy);

            service
              .getPatientListReport(requestParams)
              .then((result) => {
                reply(result);
              })
              .catch((error) => {
                console.error('Error: ', error);
                reply(error);
              });
          } else {
            reply('Misssing location or service params');
          }
        }
      },
      description: 'Service Queue Daily report Patient List',
      notes: 'Service Queue Daily report Patient List',
      tags: ['api']
    }
  }
];
exports.routes = (server) => server.route(routes);
