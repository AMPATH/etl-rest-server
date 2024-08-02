var authorizer = require('../../authorization/etl-authorizer');
import { AHDMonthlySummaryService } from '../../service/ahd-monthly-summary.service';
var etlHelpers = require('../../etl-helpers');
var privileges = authorizer.getAllPrivileges();
var preRequest = require('../../pre-request-processing');
const routes = [
  {
    method: 'GET',
    path: '/etl/ahd-monthly-summary',
    config: {
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      handler: function (request, reply) {
        preRequest.resolveLocationIdsToLocationUuids(request, function () {
          let requestParams = Object.assign({}, request.query, request.params);
          let reportParams = etlHelpers.getReportParams(
            'ahd-monthly-summary',
            ['endDate', 'startDate', 'locationUuids'],
            requestParams
          );

          reportParams.requestParams.isAggregated = true;
          let service = new AHDMonthlySummaryService(
            'ahd-monthly-summary',
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
      description: 'ahd monthly summary dataset',
      notes: 'ahd monthly summary dataset',
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
    path: '/etl/ahd-monthly-summary-patient-list',
    config: {
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      handler: function (request, reply) {
        request.query.reportName = 'ahd-monthly-summary';
        preRequest.resolveLocationIdsToLocationUuids(request, function () {
          let requestParams = Object.assign({}, request.query, request.params);

          let requestCopy = _.cloneDeep(requestParams);
          let reportParams = etlHelpers.getReportParams(
            request.query.reportName,
            ['startDate', 'endDate', 'locationUuids', 'locations'],
            requestParams
          );
          requestCopy.locationUuids = reportParams.requestParams.locationUuids;
          const ahdService = new AHDMonthlySummaryService(
            'ahd-monthly-summary',
            requestCopy
          );
          ahdService
            .generatePatientListReport(reportParams.requestParams)
            .then((results) => {
              reply(results);
            })
            .catch((err) => {
              reply(err);
            });
        });
      },
      description:
        'Get patient list for ahd monthly summary report of the location and month provided',
      notes: 'Returns patient list of ahd monthly summary indicators',
      tags: ['api']
    }
  }
];
exports.routes = (server) => server.route(routes);
