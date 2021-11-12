import { DQAChartAbstractionService } from '../../reports/DQA/dqa-chart-abstraction-service';
var authorizer = require('../../authorization/etl-authorizer');
var resolveLocationUuidToId = require('../../location/resolve-location-uuid-to-id');
var privileges = authorizer.getAllPrivileges();
const routes = [
  {
    method: 'GET',
    path: '/etl/dqa-chart-abstraction',
    config: {
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewPatient
        }
      },
      handler: function (request, reply) {
        if (request.query.locationUuids) {
          resolveLocationUuidToId
            .resolveLocationUuidsParamsToIds(request.query)
            .then((result) => {
              let locations = result;
              let limit = 300;
              let patientType = '';
              let startDate = '';
              let endDate = '';
              if (request.query.limit != null) {
                limit = request.query.limit;
              }
              if (
                request.query.startDate != null &&
                request.query.endDate != null
              ) {
                startDate = request.query.startDate;
                endDate = request.query.endDate;
              }
              if (request.query.patientType != null) {
                patientType = request.query.patientType;
              }
              let offset = 0;
              if (request.query.startIndex != null) {
                offset = request.query.startIndex;
              }

              let service = new DQAChartAbstractionService();
              service
                .getDQAChartAbstractionReport(
                  locations,
                  limit,
                  offset,
                  startDate,
                  endDate,
                  patientType
                )
                .then((result) => {
                  reply(result);
                })
                .catch((error) => {
                  reply(error);
                });
            });
        }
      },
      description: 'Get DQA reports ',
      notes: 'Returns DQA reports',
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
