const authorizer = require('../../authorization/etl-authorizer');
const etlHelpers = require('../../etl-helpers');
const privileges = authorizer.getAllPrivileges();
const preRequest = require('../../pre-request-processing');
const _ = require('lodash');
const {
  TXNEWSummaryReportService
} = require('../../service/datim-reports/txnew-summary.service');
const routes = [
  {
    method: 'GET',
    path: '/etl/txnew-summary',
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
            'txnew-summary-report',
            ['endDate', 'locationUuids'],
            requestParams
          );
          reportParams.requestParams.isAggregated = true;

          let service = new TXNEWSummaryReportService(
            'txnew-summary-report',
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
      description: 'txnew quarterly summary dataset',
      notes: 'txnew quarterly summary dataset',
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
    path: '/etl/txnew-summary-patient-list',
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
              'txnew-summary-report',
              ['endDate', 'locationUuids'],
              requestParams
            );
            delete reportParams.requestParams['gender'];
            const txmlReportService = new TXNEWSummaryReportService(
              'txnew-summary-report',
              reportParams.requestParams
            );
            txmlReportService
              .generatePatientListReport(reportParams.requestParams)
              .then((result) => {
                _.each(result.results.results, (item) => {
                  item.arv_first_regimen = etlHelpers.getARVNames(
                    item.arv_first_regimen
                  );
                });
                reply(result);
              })
              .catch((error) => {
                reply(error);
              });
          });
        }
      },
      description:
        'Get patient list for txnew summary report of the location and month provided',
      notes: 'Returns patient list of txnew summary indicators',
      tags: ['api']
    }
  }
];
exports.routes = (server) => server.route(routes);
