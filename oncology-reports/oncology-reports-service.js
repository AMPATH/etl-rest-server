'use strict';

import * as _ from 'lodash';
import * as oncologyPatientListCols from './oncology-patient-list-cols.json';
import * as oncologyReportsConfig from './oncology-reports-config.json';

var serviceDefinition = {
  getOncologyReports: getOncologyReports,
  getSpecificOncologyReport: getSpecificOncologyReport,
  getPatientListCols: getPatientListCols
};

module.exports = serviceDefinition;

function getOncologyReports() {
  return new Promise((resolve, reject) => {
    try {
      resolve(JSON.parse(JSON.stringify(oncologyReportsConfig['default'])));
    } catch (e) {
      reject('Error parsing oncology reports config: ', e);
    }
  });
}

function getSpecificOncologyReport(reportUuid) {
  let specificReport = [];

  return new Promise((resolve, reject) => {
    _.each(oncologyReportsConfig, (report) => {
      let programUuid = report.uuid;
      if (programUuid === reportUuid) {
        specificReport = report;
      }
    });

    resolve(specificReport);
  });
}

function getPatientListCols(indicatorToQueryBy, programUuid) {
  let programReports = oncologyPatientListCols['default'][programUuid];
  return new Promise((resolve, reject) => {
    _.each(programReports, (programReport) => {
      _.each(programReport, (report) => {
        if (report.indicator === indicatorToQueryBy) {
          resolve(report.patientListCols);
        }
      });
    });
  });
}
