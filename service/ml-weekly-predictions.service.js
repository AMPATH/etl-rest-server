const Promise = require('bluebird');
const db = require('../etl-db');
import { BaseMysqlReport } from '../app/reporting-framework/base-mysql.report';
import { PatientlistMysqlReport } from '../app/reporting-framework/patientlist-mysql.report';

export default class MlWeeklyPredictionsService {
  getAggregateReport(reportParams) {
    return new Promise(function (resolve, reject) {
      const report = new BaseMysqlReport(
        'mlWeeklyPredictionsAggregate',
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
    const indicators = reportParams.indicators
      ? reportParams.indicators.split(',')
      : [];
    delete reportParams['gender'];

    const report = new PatientlistMysqlReport(
      'mlWeeklyPredictionsAggregate',
      reportParams
    );

    return new Promise(function (resolve, reject) {
      Promise.join(report.generatePatientListReport(indicators), (results) => {
        results['result'] = results.results.results;
        delete results['results'];
        resolve(results);
      }).catch((errors) => {
        console.log('Error: ', errors);
        reject(errors);
      });
    });
  }

  getPatientsWithPredictions(patientUuId) {
    return new Promise((resolve, reject) => {
      const week = this.getNextWeek();
      const predictedPatients = `SELECT 
    ml.person_id AS person_id,
    ml.predicted_risk AS predicted_risk,
    ml.week AS week
FROM
    predictions.ml_weekly_predictions ml
        LEFT JOIN
    etl.pre_appointment_summary pre ON (pre.person_id = ml.person_id)
        INNER JOIN
    amrs.person t1 ON (ml.person_id = t1.person_id)
WHERE
    t1.uuid = '${patientUuId}'
        AND (ml.week = '${week}' )
        AND (ml.predicted_risk IS NOT NULL)
GROUP BY t1.person_id
 `;
      const queryParts = {
        sql: predictedPatients
      };
      console.log('query', queryParts);
      db.queryServer(queryParts, function (result) {
        result.sql = predictedPatients;
        resolve(result.result);
      });
    });
  }
  getNextWeek() {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate()); // Add 7 days

    const year = currentDate.getFullYear();
    const weekNumber = this.getISOWeek(currentDate);

    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
  }

  // Helper function to get ISO week number
  getISOWeek(date) {
    const dayOfWeek = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayOfWeek);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
    return weekNumber;
  }
}
