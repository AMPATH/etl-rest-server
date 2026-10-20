var authorizer = require('../../authorization/etl-authorizer');
var etlHelpers = require('../../etl-helpers');
var privileges = authorizer.getAllPrivileges();
var preRequest = require('../../pre-request-processing');
import { Lab706Service } from '../../service/lab-706.service';
import { PatientlistMysqlReport } from '../reporting-framework/patientlist-mysql.report';
import QueryService from '../database-access/query.service';

// The generated patient-list SQL carries LIMIT/OFFSET for the page; the count
// query must run over the unpaginated statement.
function stripPaging(sqlQuery) {
  return sqlQuery.replace(/LIMIT \d+( OFFSET \d+)?\s*$/i, '');
}

const routes = [
  {
    method: 'GET',
    path: '/etl/lab-706',
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
            'lab706Aggregate',
            ['startDate', 'endDate', 'locationUuids'],
            requestParams
          );

          let service = new Lab706Service(
            'lab706Aggregate',
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
      description: 'Lab 706 blood chemistry aggregated report',
      notes:
        'Returns one summary row of indicator totals (tests done, positivity, banding) for the selected period and locations',
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
    path: '/etl/lab-706/patient-list',
    config: {
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      handler: function (request, reply) {
        let requestParams = Object.assign({}, request.query, request.params);
        requestParams.locationUuids = request.query.locationUuids.split(',');
        let indicators = [];
        if (requestParams.indicators) {
          indicators = requestParams.indicators.split(',');
        }

        requestParams.startDate = requestParams.startDate.split('T')[0];
        requestParams.endDate = requestParams.endDate.split('T')[0];
        requestParams.startIndex = Number(requestParams.startIndex || 0);
        requestParams.limit = Number(requestParams.limit || 50);

        let report = new PatientlistMysqlReport(
          'lab706Aggregate',
          requestParams
        );
        report
          .generatePatientListReport(indicators)
          .then((result) => {
            let rows = result.results.results;
            let countSql =
              'SELECT COUNT(*) AS total FROM (' +
              stripPaging(report.reportQuery) +
              ') AS patient_list_count';
            let queryService = new QueryService();
            return queryService.executeQuery(countSql).then((countResult) => {
              // Reply keeps the patient-list envelope and adds the real
              // total so the register's pager stops inferring page counts.
              result.results = {
                results: rows,
                size: rows.length,
                total: countResult[0].total
              };
              reply(result);
            });
          })
          .catch((error) => {
            reply(error);
          });
      },
      description: 'Lab 706 MOH 240 laboratory register patient list',
      notes:
        'Returns the paginated MOH 240 register rows (A-AA) for the supplied indicators, with an exact total',
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
