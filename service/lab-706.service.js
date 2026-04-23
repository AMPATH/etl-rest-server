import { BaseMysqlReport } from '../app/reporting-framework/base-mysql.report';
import { MultiDatasetPatientlistReport } from '../app/reporting-framework/multi-dataset-patientlist.report';
import ReportProcessorHelpersService from '../app/reporting-framework/report-processor-helpers.service';

export class Lab706Service extends MultiDatasetPatientlistReport {
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
            console.log({ results });
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
              queriesAndSchemas: results,
              result: finalResult
            });
          }
        })
        .catch((error) => {
          console.error('MOH 706 generation error: ', error);
          reject(error);
        });
    });
  }

  getPatientListReport(requestParams) {
    let indicators;
    if (!requestParams.indicators) {
      indicators = [];
    } else {
      indicators = requestParams.indicators.split(',');
    }

    console.log('indicators', indicators);
    return new Promise((resolve, reject) => {
      this.generatePatientListReport(indicators)
        .then((results) => {
          resolve(results);
        })
        .catch((err) => {
          resolve('Error', err);
        });
    });
  }

  getPatientListReport(reportParams) {
    let indicators = reportParams.indicators
      ? reportParams.indicators.split(',')
      : [];

    let report = new PatientlistMysqlReport('lab706Aggregate', reportParams);

    return new Promise(function (resolve, reject) {
      Promise.join(report.generatePatientListReport(indicators), (results) => {
        resolve(results);
      }).catch((errors) => {
        console.error('Error', errors);
        reject(errors);
      });
    });
  }
}
