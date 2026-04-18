var authorizer = require('../../authorization/etl-authorizer');
var etlHelpers = require('../../etl-helpers');
var privileges = authorizer.getAllPrivileges();
var preRequest = require('../../pre-request-processing');
import { Lab706Service } from '../../service/lab-706.service';

const routes = [
  {
    method: 'GET',
    path: '/etl/lab-706',
    config: {
      // plugins: {
      //   hapiAuthorization: {
      //     role: privileges.canViewClinicDashBoard
      //   }
      // },
      // auth: false,
      handler: function (request, reply) {
        preRequest.resolveLocationIdsToLocationUuids(request, function () {
          let requestParams = Object.assign({}, request.query, request.params);
          let reportParams = etlHelpers.getReportParams(
            'lab706Aggregate',
            ['startDate', 'endDate', 'locationUuids'],
            requestParams
          );

          let service = new Lab706Service(
            'lab706Aggregate',
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
  }
];
exports.routes = (server) => server.route(routes);
