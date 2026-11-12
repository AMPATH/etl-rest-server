var authorizer = require('../../authorization/etl-authorizer');
var etlHelpers = require('../../etl-helpers');
var privileges = authorizer.getAllPrivileges();
var preRequest = require('../../pre-request-processing');
import { Lab706Service } from '../../service/lab-706.service';
import { PatientlistMysqlReport } from '../reporting-framework/patientlist-mysql.report';

// Analyte drill-downs over panel tests (urinalysis members, lipid members,
// the FBC Hb bands) select panel order rows, but the register should read as
// the single indicator the user clicked, not the whole panel readout.  Map
// each member-scoped indicator to its analyte concept(s) and a display
// label; the patient-list template renders them through the {memberConceptCsv}
// / {memberLabel} expression injections.  'NULL' / 'NONE' sentinels keep
// whole-panel drill-downs unscoped (the injector leaves falsy values
// unsubstituted, so the params must always be set to something truthy).
const MEMBER_SCOPED_INDICATORS = {
  urine_glucose: { concepts: [2340], label: 'Glucose' },
  urine_ketones: { concepts: [7276], label: 'Ketones' },
  urine_proteins: { concepts: [2339], label: 'Proteins' },
  urine_pus_cells: { concepts: [1984], label: 'Pus cells' },
  urine_rbc: { concepts: [1985], label: 'RBC' },
  urine_t_vaginalis: { concepts: [15086], label: 'T. vaginalis' },
  urine_yeast_cells: { concepts: [15084], label: 'Yeast cells' },
  urine_microscopy: {
    concepts: [1984, 1985, 15086, 15084],
    label: 'Urine microscopy'
  },
  cholesterol: { concepts: [1006], label: 'Total cholesterol' },
  triglycerides: { concepts: [1009], label: 'Triglycerides' },
  ldl: { concepts: [1008], label: 'LDL' },
  fbc_hb: { concepts: [21], label: 'HB (FBC)' }
};

function resolveMemberScope(indicators) {
  for (let indicator of indicators) {
    let base = indicator
      .replace(/^(total_|positive_|min_|max_)/, '')
      .replace(/_with_members$/, '');
    if (base.startsWith('fbc_hb_')) {
      base = 'fbc_hb';
    }
    let scope = MEMBER_SCOPED_INDICATORS[base];
    if (scope) {
      return scope;
    }
  }
  return null;
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

        let memberScope = resolveMemberScope(indicators);
        requestParams.memberConceptCsv = memberScope
          ? memberScope.concepts.join(',')
          : 'NULL';
        requestParams.memberLabel = memberScope ? memberScope.label : 'NONE';

        let report = new PatientlistMysqlReport(
          'lab706Aggregate',
          requestParams
        );
        report
          .generatePatientListReport(indicators, { countRows: true })
          .then((result) => {
            let rows = result.results.results;
            // The report counts over the same joins and filters without the
            // register's per-row subqueries; a missing total leaves the
            // register's pager to infer page counts.
            result.results = {
              results: rows,
              size: rows.length,
              total: result.totalCount
            };
            reply(result);
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
