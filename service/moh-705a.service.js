const Promise = require('bluebird');
import { MultiDatasetPatientlistReport } from '../app/reporting-framework/multi-dataset-patientlist.report.js';

const moh731PatientListCols = require('../app/reporting-framework/json-reports/moh-731-report/731-patient-list-columns.json');

export class MOH705AService extends MultiDatasetPatientlistReport {
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
          for (let result of results) {
            if (
              result.results &&
              result.results.results &&
              Array.isArray(result.results.results.results)
            ) {
              finalResult = finalResult.concat(result.results.results.results);
            }
          }

          resolve({ result: finalResult });
        }
      });
    }).catch((error) => {
      reject(error);
    });
  }

  generatePatientListReport(reportParams) {
    const indicators = reportParams.indicator.split(',') || [];
    let self = this;
    return new Promise((resolve, reject) => {
      super
        .generatePatientListReport(indicators)
        .then((results) => {
          let result = results.result;
          results['results'] = {
            results: result
          };
          results['patientListCols'] = moh731PatientListCols;
          delete results['result'];
          resolve(results);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}
