import { BaseMysqlReport } from '../../../app/reporting-framework/base-mysql.report';
import { PatientlistMysqlReport } from '../../../app/reporting-framework/patientlist-mysql.report';

const _ = require('lodash');
const Promise = require('bluebird');

export class ServiceQueueDailyReportService {
  getAggregateReport(reportParams) {
    return new Promise((resolve, reject) => {
      let report = new BaseMysqlReport(
        'serviceQueueDailyAggregate',
        reportParams.requestParams
      );

      Promise.join(report.generateReport(), (results) => {
        let result = results.results.results;
        results.size = result ? result.length : 0;
        results.result = result;
        delete results['results'];
        resolve(results);
      }).catch((errors) => {
        reject(errors);
      });
    });
  }

  getPatientListReport(reportParams) {
    let indicators = reportParams.indicators
      ? reportParams.indicators.split(',')
      : [];

    let report = new PatientlistMysqlReport(
      'serviceQueueDailyAggregate',
      reportParams
    );

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
