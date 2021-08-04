import * as _ from 'lodash';
import { Promise } from 'bluebird';

import { titleCase } from '../etl-helpers';
import { BaseMysqlReport } from '../app/reporting-framework/base-mysql.report';
import { PatientlistMysqlReport } from '../app/reporting-framework/patientlist-mysql.report';
import { getPatientListCols } from '../oncology-reports/oncology-reports-service';

export class BreastCancerMonthlySummaryService {
  getAggregateReport(reportParams) {
    return new Promise((resolve, reject) => {
      let report;

      const { period } = reportParams.requestParams;
      if (period === 'daily') {
        report = new BaseMysqlReport(
          'breastCancerDailySummaryAggregate',
          reportParams.requestParams
        );
      } else if (period === 'monthly') {
        report = new BaseMysqlReport(
          'breastCancerMonthlySummaryAggregate',
          reportParams.requestParams
        );
      }

      Promise.join(report.generateReport(), (queryResults) => {
        let reportData = queryResults.results.results;
        reportData.size = reportData ? reportData.length : 0;
        queryResults.result = reportData;
        delete queryResults['results'];
        resolve(queryResults);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  getPatientListReport(reportParams) {
    const breastCancerScreeningReportUuid =
      '142939b0-28a9-4649-baf9-a9d012bf3b3d';

    let indicators = reportParams.indicators
      ? reportParams.indicators.split(',')
      : [];

    if (reportParams.genders) {
      reportParams.genders = reportParams.genders.split(',') || [];
    }

    if (reportParams.locationUuids) {
      reportParams.locationUuids = reportParams.locationUuids.split(',') || [];
    }

    let report = new PatientlistMysqlReport(
      'breastCancerMonthlySummaryAggregate',
      reportParams
    );

    return new Promise((resolve, reject) => {
      Promise.join(
        report.generatePatientListReport(indicators),
        (reportData) => {
          reportData.results.results.forEach((result) => {
            if (result.person_name) {
              result.person_name = titleCase(result.person_name);
            }
          });

          getPatientListCols(
            reportParams.indicators,
            breastCancerScreeningReportUuid
          )
            .then((patientListCols) => {
              reportData['patientListCols'] = patientListCols;
              resolve(reportData);
            })
            .catch((error) => {
              console.error('Error fetching patient list columns: ', error);
              reject(error);
            });
        }
      ).catch((error) => {
        console.error(
          'Error generating breast cancer screening patient list: ',
          error
        );
        reject(error);
      });
    });
  }
}
