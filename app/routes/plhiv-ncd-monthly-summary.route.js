var authorizer = require('../../authorization/etl-authorizer');
import { PlhivNcdMonthlySummaryService } from '../../service/plhiv-ncd/plhiv-ncd-monthly-summary.service';
var etlHelpers = require('../../etl-helpers');
var privileges = authorizer.getAllPrivileges();
var preRequest = require('../../pre-request-processing');
const routes = [
  {
    method: 'GET',
    path: '/etl/plhiv-ncd-monthly-summary',
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
            'plhiv-ncd-monthly-summary',
            ['endDate', 'locationUuids'],
            requestParams
          );
          reportParams.requestParams.isAggregated = true;

          let service = new PlhivNcdMonthlySummaryService(
            'plhivNcdMonthlySummaryReport',
            reportParams.requestParams
          );
          service
            .getAggregateReport()
            .then((result) => {
              reply(result);
            })
            .catch((error) => {
              reply(error);
            });
        });
      },
      description: 'Generates a monthly non-communicable disease (NCDs) report for People Living with HIV (PLHIV)',
      notes: `The following indicators are shown:
                     Number of active PLHIV and hypertensive
                     Number of active PLHIV and diabetic
                     Number of active PLHIV that are hypertensive and diabetic
                     Number of active PLHIV with mental disorders
                     Number of active PLHIV with Other
                 The data is being collected on the clinical forms under additional medications and other commorbities`,
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
    path: '/etl/plhiv-ncd-monthly-summary-patient-list',
    config: {
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      handler: function (request, reply) {
        request.query.reportName = 'plhiv-ncd-summary-patient-list';
        preRequest.resolveLocationIdsToLocationUuids(request, function () {
          let requestParams = Object.assign({}, request.query, request.params);

          let requestCopy = _.cloneDeep(requestParams);
          let reportParams = etlHelpers.getReportParams(
            request.query.reportName,
            ['startDate', 'endDate', 'locationUuids', 'locations'],
            requestParams
          );
          requestCopy.locationUuids = reportParams.requestParams.locationUuids;
          const prepService = new PlhivNcdMonthlySummaryService(
            'plhivNcdMonthlySummaryReport',
            requestCopy
          );

          prepService
            .generatePatientList(requestParams.indicators.split(','))
            .then((results) => {
              reply(results);
            })
            .catch((err) => {
              reply(err);
            });
        });
      },
      description:
        'Get patient list for PLHIV NCD monthly summary report of the location and month provided',
      notes: 'Returns patient list of PLHIV NCD monthly summary indicators',
      tags: ['api']
    }
  }
];
exports.routes = (server) => server.route(routes);
