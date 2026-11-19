const authorizer = require('../../authorization/etl-authorizer');
const etlHelpers = require('../../etl-helpers');
const privileges = authorizer.getAllPrivileges();
const preRequest = require('../../pre-request-processing');
const {
  TXRTTSummaryReportService
} = require('../../service/datim-reports/txrtt-summary.service');
const routes = [
  {
    method: 'GET',
    path: '/etl/txrtt-summary',
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
            'txrtt-summary-report',
            ['endDate', 'locationUuids'],
            requestParams
          );
          reportParams.requestParams.isAggregated = true;

          let service = new TXRTTSummaryReportService(
            'txrtt-summary-report',
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
      description: 'txrtt quarterly summary dataset',
      notes: 'txrtt quarterly summary dataset',
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
    path: '/etl/txrtt-summary-patient-list',
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
            let reportParams = etlHelpers.getReportParams(
              'txrtt-summary-report',
              ['endDate', 'locationUuids'],
              requestParams
            );
            delete reportParams.requestParams['gender'];
            // Optional paging, for clients that load the list a page at a time
            // (startIndex / limit). Without it the whole list comes back.
            if (request.query.limit !== undefined) {
              reportParams.requestParams.limitParam = Number(
                request.query.limit
              );
              reportParams.requestParams.offSetParam =
                Number(request.query.startIndex) || 0;
            }
            const txmlReportService = new TXRTTSummaryReportService(
              'txrtt-summary-report',
              reportParams.requestParams
            );
            txmlReportService
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
        'Get patient list for txrtt summary report of the location and month provided',
      notes: 'Returns patient list of txrtt summary indicators',
      tags: ['api']
    }
  }
];
exports.routes = (server) => server.route(routes);
