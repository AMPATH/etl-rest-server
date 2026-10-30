const Promise = require('bluebird');
import { MultiDatasetPatientlistReport } from '../../app/reporting-framework/multi-dataset-patientlist.report.js';
import { PatientlistMysqlReport } from '../../app/reporting-framework/patientlist-mysql.report.js';
import ReportProcessorHelpersService from '../../app/reporting-framework/report-processor-helpers.service';

const TEST_SLUGS = [
  'hiv_rapid',
  'hbv_rapid',
  'cd4',
  'viral_load',
  'crag',
  'fbc',
  'hb',
  'albumin',
  'alp',
  'alt',
  'creatinine',
  'potassium',
  'sodium',
  'chloride',
  'ggt',
  'glucose',
  'hdl',
  'hcg',
  'amylase',
  'protein',
  'cholesterol',
  'triglycerides',
  'bilirubin',
  'urea'
];

const SUM_ALIASES = TEST_SLUGS.reduce((aliases, slug) => {
  aliases.push('tests_' + slug, 'qty_used_' + slug);
  return aliases;
}, []);

const MAX_ALIASES = [
  'visit_date',
  'facility',
  'age_years',
  'order_id',
  'report_id',
  'location_id',
  'concept_id',
  'test_name'
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

class Moh643PatientListReport extends PatientlistMysqlReport {
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

export class Moh643Service extends MultiDatasetPatientlistReport {
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
          console.error('MOH 643 generation error: ', error);
          reject(error);
        });
    });
  }

  getPatientListReport(requestParams) {
    const indicators = (requestParams.indicators || '')
      .split(',')
      .map((indicator) => indicator.trim())
      .filter(Boolean);
    const params = Object.assign({}, this.params, {
      startIndex: Number(requestParams.startIndex || 0),
      limit: Number(requestParams.limit || 300)
    });
    const report = new Moh643PatientListReport(
      'moh643MonthlyAggregate',
      params
    );
    return report.generatePatientListReport(
      indicators.length ? indicators : ['tests_hiv_rapid']
    );
  }
}
