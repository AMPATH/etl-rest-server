import { MultiDatasetPatientlistReport } from '../../app/reporting-framework/multi-dataset-patientlist.report';

export class Moh505Service extends MultiDatasetPatientlistReport {
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
            // One summary row per (location, age band) after the
            // disaggregation pivot; the app merges them into one object.
            let finalResult = [];
            for (let result of results) {
              if (
                result.results &&
                result.results.results &&
                Array.isArray(result.results.results.results)
              ) {
                finalResult = finalResult.concat(
                  result.results.results.results
                );
              }
            }

            resolve({ result: finalResult });
          }
        })
        .catch((error) => {
          console.error('MOH 505 generation error: ', error);
          reject(error);
        });
    });
  }

  getPatientListReport(requestParams) {
    const indicators =
      requestParams && requestParams.indicators
        ? requestParams.indicators.split(',')
        : [];

    return new Promise((resolve, reject) => {
      super
        .generatePatientListReport(indicators)
        .then((results) => {
          resolve({
            results: {
              results: results.result,
              totalCount: results.totalCount
            }
          });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}
