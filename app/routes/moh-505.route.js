var authorizer = require('../../authorization/etl-authorizer');
var etlHelpers = require('../../etl-helpers');
var preRequest = require('../../pre-request-processing');
var _ = require('underscore');
import { Moh505Service } from '../../service/moh-505/moh-505.service';

var privileges = authorizer.getAllPrivileges();

const routes = [
  {
    method: 'GET',
    path: '/etl/moh-505',
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
            'MOH-505-report',
            ['startDate', 'endDate', 'locationUuids'],
            requestParams
          );

          let service = new Moh505Service(
            'MOH-505-report',
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
      description: 'MOH 505 IDSR weekly epidemic monitoring report',
      notes:
        'Returns one summary row per location with disease indicators disaggregated into < 5 years / >= 5 years age bands (dc__age_range__<band>__<indicator> columns) for the selected period and locations',
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
    path: '/etl/moh-505/patient-list',
    config: {
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      handler: function (request, reply) {
        if (request.query.locationUuids && request.query.startDate) {
          preRequest.resolveLocationIdsToLocationUuids(request, function () {
            let requestParams = Object.assign(
              {},
              request.query,
              request.params
            );
            requestParams.startDate = requestParams.startDate.split('T')[0];
            requestParams.endDate = requestParams.endDate.split('T')[0];
            requestParams.startIndex = Number(requestParams.startIndex || 0);
            requestParams.limit = Number(requestParams.limit || 50);

            let reportParams = etlHelpers.getReportParams(
              'moh505AgeDisaggregation',
              ['startDate', 'endDate', 'locationUuids'],
              requestParams
            );

            let requestCopy = _.cloneDeep(requestParams);
            requestCopy.locations = reportParams.requestParams.locations;
            requestCopy.limitParam = requestParams.limit;
            requestCopy.offSetParam = requestParams.startIndex;

            let service = new Moh505Service(
              'moh505AgeDisaggregation',
              requestCopy
            );

            service
              .getPatientListReport(requestCopy)
              .then((result) => {
                reply(result);
              })
              .catch((error) => {
                console.error('MOH 505 patient list error: ', error);
                reply(error);
              });
          });
        } else {
          reply('Missing location or service params');
        }
      },
      description: 'MOH 505 IDSR report patient list',
      notes:
        'Returns the paginated MOH 240 register rows for the supplied dc__age_range__ indicators behind the MOH 505 weekly figures',
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
