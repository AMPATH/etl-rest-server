import { BaseMysqlReport } from '../app/reporting-framework/base-mysql.report';

export class Lab706Service extends BaseMysqlReport {
  constructor(reportName, params) {
    super(reportName, params);
  }

  generateReport(additionalParams) {
    return super.generateReport(additionalParams).then((results) => {
      return {
        queriesAndSchemas: results,
        result: results.results.results,
        indicatorDefinitions: []
      };
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
