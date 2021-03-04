import * as _ from 'lodash';
import { Promise } from 'bluebird';

import { titleCase } from '../etl-helpers';
import { BaseMysqlReport } from '../app/reporting-framework/base-mysql.report';
import { PatientlistMysqlReport } from '../app/reporting-framework/patientlist-mysql.report';
import { getPatientListCols } from '../oncology-reports/oncology-reports-service';
const sectionDefs = require('./cervical-cancer-screening-indicator-definitions.json');

export class CervicalCancerMonthlySummaryService {
  getAggregateReport(reportParams) {
    return new Promise((resolve, reject) => {
      let report;

      const { period } = reportParams.requestParams;
      if (period === 'daily') {
        report = new BaseMysqlReport(
          'cervicalCancerDailySummaryAggregate',
          reportParams.requestParams
        );
      } else if (period === 'monthly') {
        report = new BaseMysqlReport(
          'cervicalCancerMonthlySummaryAggregate',
          reportParams.requestParams
        );
      }

      Promise.join(report.generateReport(), (queryResults) => {
        let reportData = queryResults.results.results;
        reportData.size = reportData ? reportData.length : 0;
        queryResults.result = reportData;
        queryResults.sectionDefinitions = sectionDefs;
        delete queryResults['results'];
        resolve(queryResults);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  getPatientListReport(reportParams) {
    const cervicalCancerScreeningReportUuid =
      'cad71628-692c-4d8f-8dac-b2e20bece27f';

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
      'cervicalCancerMonthlySummaryAggregate',
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
            cervicalCancerScreeningReportUuid
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
          'Error generating cervical cancer screening patient list: ',
          error
        );
        reject(error);
      });
    });
  }
}
