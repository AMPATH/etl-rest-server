var authorizer = require('../../authorization/etl-authorizer');
import { HEIRegisterService } from '../../service/moh-tools/hei_register/hei-register-service';
var etlHelpers = require('../../etl-helpers');
var privileges = authorizer.getAllPrivileges();
var preRequest = require('../../pre-request-processing');
const routes = [
  {
    method: 'GET',
    path: '/etl/hei-register',
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
            'hei-register',
            ['endDate', 'startDate', 'locationUuids'],
            requestParams
          );

          reportParams.requestParams.isAggregated = true;
          let service = new HEIRegisterService(
            'hei-register',
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
      description: 'hei reigister',
      notes: 'hei register',
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
