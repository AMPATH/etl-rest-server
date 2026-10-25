const authorizer = require('../../authorization/etl-authorizer');
const etlHelpers = require('../../etl-helpers');
const privileges = authorizer.getAllPrivileges();
const preRequest = require('../../pre-request-processing');
const {
  CaseSurveillanceService
} = require('../../service/case-surveillance/case-surveillance.service');
const E = Math.E;
const routes = [
  {
    method: 'GET',
    path: '/etl/cs-case-surveillance',
    options: {
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      handler: function (request, h) {
        return new Promise(async function (resolve) {
          var reply = function (payload) {
            return resolve(payload);
          };

          preRequest.resolveLocationIdsToLocationUuids(request, function () {
            let requestParams = Object.assign(
              {},
              request.query,
              request.params
            );
            let reportParams = etlHelpers.getReportParams(
              'case-surveillance-summary-report',
              ['endDate', 'locationUuids'],
              requestParams
            );
            reportParams.requestParams.isAggregated = true;

            let service = new CaseSurveillanceService(
              'case-surveillance-summary-report',
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
        });
      },
      description: 'case surveillance summary dataset',
      notes: 'case surveillance summary dataset',
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
    path: '/etl/cs-case-surveillance-patient-list',
    options: {
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      handler: function (request, h) {
        return new Promise(async function (resolve) {
          var reply = function (payload) {
            return resolve(payload);
          };

          if (request.query.locationUuids) {
            preRequest.resolveLocationIdsToLocationUuids(request, function () {
              let requestParams = Object.assign(
                {},
                request.query,
                request.params
              );
              let reportParams = etlHelpers.getReportParams(
                'case-surveillance-summary-report',
                ['endDate', 'locationUuids'],
                requestParams
              );
              delete reportParams.requestParams['gender'];
              const caseSurveillanceService = new CaseSurveillanceService(
                'case-surveillance-summary-report',
                reportParams.requestParams
              );
              caseSurveillanceService
                .generatePatientListReport(reportParams.requestParams)
                .then((result) => {
                  reply(result);
                })
                .catch((error) => {
                  reply(error);
                });
            });
          }
        });
      },
      description:
        'Get patient list for case surveillance summary report of the location and month provided',
      notes: 'Returns patient list of case surveillance summary indicators',
      tags: ['api']
    }
  }
];
exports.routes = (server) => server.route(routes);
