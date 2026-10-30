const Promise = require('bluebird');
import { MultiDatasetPatientlistReport } from '../../app/reporting-framework/multi-dataset-patientlist.report.js';
import { PatientlistMysqlReport } from '../../app/reporting-framework/patientlist-mysql.report.js';
import ReportProcessorHelpersService from '../../app/reporting-framework/report-processor-helpers.service';

const SUM_ALIASES = [
  'quantity',
  'al_6s',
  'al_12s',
  'al_18s',
  'al_24s',
  'artesunate_vials',
  'qty_dispensed_al_6s',
  'qty_dispensed_al_12s',
  'qty_dispensed_al_18s',
  'qty_dispensed_al_24s',
  'qty_dispensed_artesunate_vials',
  'patients_al_5_14kg',
  'patients_al_15_24kg',
  'patients_al_25_34kg',
  'patients_al_35kg',
  'microscopy_pos',
  'microscopy_neg',
  'mrdt_pos',
  'mrdt_neg',
  'mrdt_inv',
  'no_test_done',
  'microscopy_positive',
  'microscopy_negative',
  'microscopy_total_tested',
  'rdt_positive',
  'rdt_negative',
  'rdt_invalid',
  'rdt_total_tested',
  'diagnostics_total_positive',
  'diagnostics_total_negative',
  'diagnostics_total_tested'
];

const MAX_ALIASES = [
  'visit_date',
  'facility',
  'ip_op',
  'age_years',
  'drug_name',
  'drug_id',
  'drug_uuid',
  'order_id',
  'encounter_id',
  'location_id',
  'report_id'
];

function wrapColumn(column, fn) {
  const inner =
    column.type === 'simple_column'
      ? column.column
      : column.expressionOptions && column.expressionOptions.expression;
  if (!inner || new RegExp('^' + fn + '\\s*\\(', 'i').test(inner)) {
    return column;
  }
  return {
    type: 'derived_column',
    alias: column.alias,
    expressionType: 'simple_expression',
    expressionOptions: {
      expression: fn + '(' + inner + ')'
    }
  };
}

function aggregatePatientLineColumns(schema) {
  if (!schema || !Array.isArray(schema.columns)) {
    return;
  }
  schema.columns = schema.columns.map((column) => {
    if (SUM_ALIASES.indexOf(column.alias) !== -1) {
      return wrapColumn(column, 'SUM');
    }
    if (MAX_ALIASES.indexOf(column.alias) !== -1) {
      return wrapColumn(column, 'MAX');
    }
    return column;
  });
}

class Moh645PatientListReport extends PatientlistMysqlReport {
  generatePatientListJsonQuery(
    aggregateSchema,
    baseSchema,
    templateSchema,
    params
  ) {
    const generated = super.generatePatientListJsonQuery(
      aggregateSchema,
      baseSchema,
      templateSchema,
      params
    );
    aggregatePatientLineColumns(generated.generated);
    return generated;
  }
}

const DIAGNOSTIC_INDICATORS = [
  'microscopy_positive',
  'microscopy_negative',
  'microscopy_total_tested',
  'rdt_positive',
  'rdt_negative',
  'rdt_invalid',
  'rdt_total_tested',
  'diagnostics_total_positive',
  'diagnostics_total_negative',
  'diagnostics_total_tested'
];

export class Moh645Service extends MultiDatasetPatientlistReport {
  constructor(reportName, params) {
    super(reportName, params);
  }

  generateReport(additionalParams) {
    const that = this;
    return new Promise((resolve, reject) => {
      super
        .generateReport(additionalParams)
        .then((results) => {
          if (additionalParams && additionalParams.type === 'patient-list') {
            resolve(results);
          } else {
            let finalResult = [];
            const reportProcessorHelpersService = new ReportProcessorHelpersService();
            for (let result of results) {
              if (
                result.report &&
                result.report.reportSchemas &&
                result.report.reportSchemas.main &&
                result.report.reportSchemas.main.transFormDirectives &&
                result.report.reportSchemas.main.transFormDirectives.joinColumn
              ) {
                finalResult = reportProcessorHelpersService.joinDataSets(
                  that.params[
                    result.report.reportSchemas.main.transFormDirectives
                      .joinColumnParam
                  ] ||
                    result.report.reportSchemas.main.transFormDirectives
                      .joinColumn,
                  finalResult,
                  result.results.results.results
                );
              }
            }

            resolve({
              queriesAndSchemas: results,
              result: finalResult
            });
          }
        })
        .catch((error) => {
          console.error('MOH 645 generation error: ', error);
          reject(error);
        });
    });
  }

  getPatientListReport(requestParams) {
    const indicators = (requestParams.indicators || '')
      .split(',')
      .map((indicator) => indicator.trim())
      .filter(Boolean);
    const usesDiagnostics = indicators.some((indicator) =>
      DIAGNOSTIC_INDICATORS.includes(indicator)
    );
    const params = Object.assign({}, this.params, {
      startIndex: Number(requestParams.startIndex || 0),
      limit: Number(requestParams.limit || 300)
    });
    const report = new Moh645PatientListReport(
      usesDiagnostics ? 'moh645DiagnosticsAggregate' : 'moh645MonthlyAggregate',
      params
    );
    return report.generatePatientListReport(
      indicators.length ? indicators : ['qty_dispensed_al_24s']
    );
  }
}
