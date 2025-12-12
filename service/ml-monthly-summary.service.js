const Promise = require('bluebird');
import { MultiDatasetPatientlistReport } from '../app/reporting-framework/multi-dataset-patientlist.report.js';
import ReportProcessorHelpersService from '../app/reporting-framework/report-processor-helpers.service.js';

const mlSummaryPatientListCols = require('../app/reporting-framework/json-reports/ml-predictions/ml-summary-patient-list-cols.json');

export class MlMonthlySummaryService extends MultiDatasetPatientlistReport {
  constructor(reportName, params) {
    super(reportName, params);
  }

  generateReport(additionalParams) {
    const that = this;
    return new Promise((resolve, reject) => {
      super.generateReport(additionalParams).then((results) => {
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
            result: finalResult
          });
        }
      });
    }).catch((error) => {
      reject(error);
    });
  }

  generatePatientListReport(reportParams) {
    const indicators = reportParams.requestIndicators.split(',') || [];
    let self = this;
    return new Promise((resolve, reject) => {
      super
        .generatePatientListReport(indicators)
        .then((results) => {
          let result = results.result;
          results['results'] = {
            results: result
          };
          results['patientListCols'] = mlSummaryPatientListCols;
          delete results['result'];
          resolve(results);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}
