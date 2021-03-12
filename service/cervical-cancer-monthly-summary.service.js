import * as _ from 'lodash';
import { Promise } from 'bluebird';

import { titleCase } from '../etl-helpers';
import { BaseMysqlReport } from '../app/reporting-framework/base-mysql.report';
import { PatientlistMysqlReport } from '../app/reporting-framework/patientlist-mysql.report';
import { getPatientListCols } from '../oncology-reports/oncology-reports-service';
const defaultColumnDefs = require('./cervical-cancer-screening-indicator-definitions.json');
const moh412ColumnDefs = require('./cervical-cancer-screening-moh-412-indicator-definitions.json');

export class CervicalCancerMonthlySummaryService {
  dailySummaryReport = 'cervicalCancerDailySummaryAggregate';
  monthlySummaryReport = 'cervicalCancerMonthlySummaryAggregate';
  moh412DailySummaryReport = 'cervicalCancerMoh412DailySummaryAggregate';
  moh412MonthlySummaryReport = 'cervicalCancerMoh412MonthlySummaryAggregate';
  monthlySummaryReportUuid = 'cad71628-692c-4d8f-8dac-b2e20bece27f';
  moh412ReportUuid = '265c3f09-17c9-49ed-9c78-77cdbd1fb9eb';

  getAggregateReport(reportParams) {
    return new Promise((resolve, reject) => {
      let report;

      const { period, reportName } = reportParams.requestParams;
      const isMoh412Report = /moh-412$/i.exec(reportName) ? true : false;

      if (period === 'daily') {
        report = new BaseMysqlReport(
          isMoh412Report
            ? this.moh412DailySummaryReport
            : this.dailySummaryReport,
          reportParams.requestParams
        );
      } else if (period === 'monthly') {
        report = new BaseMysqlReport(
          isMoh412Report
            ? this.moh412MonthlySummaryReport
            : this.monthlySummaryReport,
          reportParams.requestParams
        );
      }

      Promise.join(report.generateReport(), (queryResults) => {
        let reportData = queryResults.results.results;
        reportData.size = reportData ? reportData.length : 0;
        queryResults.result = reportData;
        queryResults.isMoh412Report = isMoh412Report;
        queryResults.columnDefinitions = isMoh412Report
          ? moh412ColumnDefs
          : defaultColumnDefs;
        delete queryResults['results'];
        resolve(queryResults);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  getPatientListReport(reportParams) {
    const { reportName } = reportParams;
    const isMoh412Report = /moh-412$/i.exec(reportName) ? true : false;

    const reportUuid = isMoh412Report
      ? this.moh412ReportUuid
      : this.monthlySummaryReportUuid;

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
      isMoh412Report
        ? this.moh412MonthlySummaryReport
        : this.monthlySummaryReport,
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

          getPatientListCols(reportParams.indicators, reportUuid)
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
