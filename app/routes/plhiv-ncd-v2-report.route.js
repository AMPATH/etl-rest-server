const authorizer = require('../../authorization/etl-authorizer');
const etlHelpers = require('../../etl-helpers');
const privileges = authorizer.getAllPrivileges();
const preRequest = require('../../pre-request-processing');
const {
  PLHIVNCDv2SummaryReportService
} = require('../../service/plhiv-ncd-v2/plhiv-ncd-v2-summary.service');
const routes = [
  {
    method: 'GET',
    path: '/etl/plhiv-ncd-v2-monthly-report',
    config: {
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      handler: function (request, reply) {
        preRequest.resolveLocationIdsToLocationUuids(request, function () {
          let requestParams = Object.assign({}, request.query, request.params);
          requestParams.visitState =
            requestParams.currentView === 'monthly' ? [0, 1] : [1];
          let reportParams = etlHelpers.getReportParams(
            'plhiv-ncd-v2-monthly-report',
            ['startDate', 'endDate', 'locationUuids'],
            requestParams
          );
          reportParams.requestParams.isAggregated = true;

          let service = new PLHIVNCDv2SummaryReportService(
            'plhiv-ncd-v2-monthly-report',
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
      description: 'plhiv-ncd summary dataset',
      notes: 'plhiv-ncd summary dataset',
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
    path: '/etl/plhiv-ncd-v2-monthly-report-patient-list',
    config: {
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      handler: function (request, reply) {
        if (request.query.locationUuids) {
          preRequest.resolveLocationIdsToLocationUuids(request, function () {
            let requestParams = Object.assign(
              {},
              request.query,
              request.params
            );
            requestParams.visitState =
              requestParams.currentView === 'monthly' ? [0, 1] : [1];
            let reportParams = etlHelpers.getReportParams(
              'plhiv-ncd-v2-monthly-report',
              ['startDate', 'endDate', 'locationUuids'],
              requestParams
            );
            delete reportParams.requestParams['gender'];
            const plhivncdV2ReportService = new PLHIVNCDv2SummaryReportService(
              'plhiv-ncd-v2-monthly-report',
              reportParams.requestParams
            );
            plhivncdV2ReportService
              .generatePatientListReport(reportParams.requestParams)
              .then((result) => {
                reply(result);
              })
              .catch((error) => {
                reply(error);
              });
          });
        }
      },
      description:
        'Get patient list for plhiv-ncd summary report of the location and month provided',
      notes: 'Returns patient list of plhiv-ncd summary indicators',
      tags: ['api']
    }
  }
];
exports.routes = (server) => server.route(routes);
