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
            // runMultipleReports drops rejected handlers, so an empty
            // results array means EVERY dataset failed (commonly: the JSON
            // references a flat-table column the table does not have yet -
            // e.g. the borrowed indicators before the DDL migration ran).
            // Fail loudly instead of resolving an empty result that is
            // indistinguishable from "no data in the period"; the underlying
            // cause is in the server log's "Report failed:" lines.
            if (!results || results.length === 0) {
              reject(
                new Error(
                  'every MOH 505 report handler failed - see the "Report failed: moh505AgeDisaggregation" lines in the server log for the underlying error (commonly a column the etl.flat_moh_505_weekly_v2 table does not have yet)'
                )
              );
              return;
            }
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
