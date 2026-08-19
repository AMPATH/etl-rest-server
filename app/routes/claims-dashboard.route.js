var Boom = require('boom');
var preRequest = require('../../pre-request-processing');
var authorizer = require('../../authorization/etl-authorizer');
var privileges = authorizer.getAllPrivileges();
var Joi = require('joi');
var etlHelpers = require('../../etl-helpers.js');

const {
  ClaimsDashboardSummaryService
} = require('../../service/claims-dashboard-summary/claims-dashboard-summary.service');

const routes = [
  {
    method: 'GET',
    path: '/etl/claims-dashboard',
    config: {
      handler: function (request, reply) {
        if (request.query.locationUuids) {
          preRequest.resolveLocationIdsToLocationUuids(request, function () {
            let requestParams = Object.assign(
              {},
              request.query,
              request.params
            );
            console.log('PARAMS: ', request.query);
            let reportParams = etlHelpers.getReportParams(
              'claimsSummary',
              ['endDate', 'startDate', 'locationUuids'],
              requestParams
            );

            reportParams.requestParams.isAggregated = true;

            let claimsSummaryService = new ClaimsDashboardSummaryService(
              'claimsSummary',
              reportParams.requestParams
            );

            claimsSummaryService
              .generateReport(reportParams.requestParams)
              .then((result) => {
                reply(result);
              })
              .catch((error) => {
                reply(error);
              });
          });
        }
      },
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      description: 'Get Claims Summary',
      notes: 'Returns Claims Summary',
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
    path: '/etl/claims-dahsboard-patient-list',
    config: {
      handler: function (request, reply) {
        if (request.query.locationUuids) {
          preRequest.resolveLocationIdsToLocationUuids(request, function () {
            let requestParams = Object.assign(
              {},
              request.query,
              request.params
            );

            let reportParams = etlHelpers.getReportParams(
              'claimsSummary',
              ['endDate', 'startDate', 'locationUuids', 'isAggregated'],
              requestParams
            );

            let requestCopy = _.cloneDeep(requestParams);

            let claimsSummaryService = new ClaimsDashboardSummaryService(
              'claimsSummary',
              reportParams.requestParams
            );

            requestCopy.locations = reportParams.requestParams.locations;
            requestCopy.limitParam = requestParams.limit;
            requestCopy.offSetParam = requestParams.startIndex;
            delete reportParams.requestParams['gender'];

            claimsSummaryService
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
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      description: 'Get Claims Summary',
      notes: 'Returns Claims Summary',
      tags: ['api'],
      validate: {
        options: {
          allowUnknown: true
        },
        query: {
          limit: Joi.number()
            .required()
            .description('The offset to control pagination')
        },
        params: {}
      }
    }
  }
];

exports.routes = (server) => server.route(routes);
