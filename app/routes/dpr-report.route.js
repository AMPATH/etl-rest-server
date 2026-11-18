const authorizer = require('../../authorization/etl-authorizer');
const privileges = authorizer.getAllPrivileges();
const preRequest = require('../../pre-request-processing');
const Boom = require('boom');
const {
  DprReportService
} = require('../../service/dpr-report/dpr-report.service');

const routes = [
  {
    method: 'GET',
    path: '/etl/dqa-dpr-report',
    config: {
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewPatient
        }
      },
      handler: function (request, reply) {
        preRequest.resolveLocationIdsToLocationUuids(request, function () {
          const requestParams = Object.assign(
            {},
            request.query,
            request.params
          );
          if (requestParams.locationUuids && !requestParams.locations) {
            return reply(
              Boom.badRequest(
                'None of the selected locations could be resolved'
              )
            );
          }

          let service;
          try {
            service = new DprReportService('dqa-dpr-report', requestParams);
          } catch (error) {
            return reply(Boom.badRequest(error.message));
          }

          service
            .generateReport()
            .then((result) => {
              reply(result);
            })
            .catch((error) => {
              console.error('DPR report error', error);
              reply(Boom.badImplementation(error.message || String(error)));
            });
        });
      },
      description: 'DPR (Kenya DPR 2026 RoC) DQA line list',
      notes:
        'Query params: locationUuids, startDate/endDate (12-month cohort ART start window), ' +
        'optional m24StartDate/m24EndDate, siteCodes, mflCodes, studySitesOnly (0|1)',
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
