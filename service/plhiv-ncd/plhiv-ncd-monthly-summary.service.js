const Promise = require('bluebird');
const _ = require('lodash');
import { MultiDatasetPatientlistReport } from '../../app/reporting-framework/multi-dataset-patientlist.report.js';
import ReportProcessorHelpersService from '../../app/reporting-framework/report-processor-helpers.service';
const indicatorDefinitions = require('./plhiv-ncd-indicator-definitions.json');
var etlHelpers = require('../../etl-helpers');
export class PlhivNcdMonthlySummaryService extends MultiDatasetPatientlistReport {
  constructor(reportName, params) {
    if (params.isAggregated) {
      params.excludeParam = ['location_id'];
      params.joinColumnParam = 'join_location';
    }

    super(reportName, params);
  }
  getAggregateReport(reportParams) {
    const that = this;
    return new Promise((resolve, reject) => {
      super
        .generateReport(reportParams)
        .then((results) => {
          console.log("results: ", JSON.stringify(results))
          if (reportParams && reportParams.type === 'patient-list') {
            resolve(results);
          } else {
            let finalResult = [];
            const reportProcessorHelpersService = new ReportProcessorHelpersService();
            for (let result of results) {
              if (
                result.report &&
                result.report.reportSchemas &&
                result.report.reportSchemas.main &&
                result.report.reportSchemas.main.transFormDirectives.joinColumn
              ) {
                console.log("joinColumnParam: ",result.report.reportSchemas.main.transFormDirectives.joinColumnParam, "joinColumn: ", result.report.reportSchemas.main.transFormDirectives.joinColumn,
                "finalResult: ", finalResult,
                "results: ", result.results.results.results)
                finalResult = reportProcessorHelpersService.joinDataSets(
                  that.params[
                  result.report.reportSchemas.main.transFormDirectives
                    .joinColumnParam
                  ] ||
                  result.report.reportSchemas.main.transFormDirectives
                    .joinColumn,
                  finalResult,
                  result.results.results.results
                );
              }
            }
            resolve({
              queriesAndSchemas: results,
              result: [{
                location_uuid: '18c343eb-b353-462a-9139-b16606e6b6c2',
                location_id: 195,
                location: 'Location Test',
                plhiv_hypertension: 1,
                plhiv_diabetes: 0,
                plhiv_hypertension_and_diabetes: 4,
                plhiv_mental_disorder: 1,
                plhiv_other_ncd: 2
              }],
              sectionDefinitions: indicatorDefinitions,
              indicatorDefinitions: []
            });
          }
        })
        .catch((error) => {
          console.error('PLHIV NCD monthly report generation error: ', error);
          reject(error);
        });
    });
  }

  generatePatientList(indicators) {
    let self = this;
    return new Promise((resolve, reject) => {
      super
        .generatePatientListReport(indicators)
        .then((results) => {
          let indicatorLabels = self.getIndicatorSectionDefinitions(
            results.indicators,
            indicatorDefinitions
          );

          results.indicators = indicatorLabels;

          if (results.result.length > 0) {
            _.each(results.result, (item) => {
              item.cur_prep_meds_names = etlHelpers.getARVNames(
                item.cur_prep_meds_names
              );
            });
          }

          self
            .resolveLocationUuidsToName(self.params.locationUuids)
            .then((locations) => {
              results.locations = locations;
              resolve(results);
            })
            .catch((err) => {
              resolve(err);
            });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  getIndicatorSectionDefinitions(requestIndicators, sectionDefinitions) {
    let results = [];
    _.each(requestIndicators, function (requestIndicator) {
      _.each(sectionDefinitions, function (sectionDefinition) {
        _.each(sectionDefinition.indicators, function (indicator) {
          if (indicator.indicator === requestIndicator) {
            results.push(indicator);
          }
        });
      });
    });
    return results;
  }

  resolveLocationUuidsToName(uuids) {
    return new Promise((resolve, reject) => {
      dao.resolveLocationUuidsToName(uuids.split(','), (loc) => {
        resolve(loc);
      });
    });
  }
}
