const Promise = require('bluebird');
const _ = require('lodash');
const Moment = require('moment');
import { MultiDatasetPatientlistReport } from '../app/reporting-framework/multi-dataset-patientlist.report.js';
import ReportProcessorHelpersService from '../app/reporting-framework/report-processor-helpers.service';
const indicatorDefinitions = require('./prep-indicator-definitions.json');
var etlHelpers = require('../etl-helpers');

const PREP_FROZEN_DATASET = 'etl.prep_monthly_report_dataset_frozen';
const PREP_LIVE_DATASET = 'etl.prep_monthly_report_dataset';

export class PrepMonthlySummaryService extends MultiDatasetPatientlistReport {
  constructor(reportName, params) {
    super(reportName, params);
    // The base schema reads <<prepMonthlyDatasetSource>>. json2sql leaves the
    // placeholder in the SQL verbatim when the param is missing, so it must
    // always hold a table name. Default to frozen; getSourceTable() refines it.
    params.prepMonthlyDatasetSource = PREP_FROZEN_DATASET;
  }

  /**
   * Months at or before the released month are served from the frozen table so
   * the numbers cannot move once reported. Later months come from the live
   * dataset and are flagged to the caller as a draft.
   */
  getSourceTable() {
    const self = this;
    return new Promise((resolve, reject) => {
      const runner = self.getSqlRunner();
      runner
        .executeQuery('select * from etl.prep_monthly_report_release_month')
        .then((results) => {
          const lastReleasedMonth =
            results && results[0] ? results[0]['last_released_month'] : null;

          self.params.prepMonthlyDatasetSource = Moment(
            lastReleasedMonth
          ).isSameOrAfter(Moment(self.params.endDate))
            ? PREP_FROZEN_DATASET
            : PREP_LIVE_DATASET;

          resolve(self.params.prepMonthlyDatasetSource);
        })
        .catch((error) => {
          console.error(
            'PrEP monthly summary: error reading released month',
            error
          );
          reject(error);
        });
    });
  }

  isReleased() {
    return this.params.prepMonthlyDatasetSource === PREP_FROZEN_DATASET;
  }

  /**
   * The patient list is built from the same base schema as the aggregate, so
   * it has to resolve the same source table or a drill-down would read frozen
   * while a draft aggregate read live.
   */
  generatePatientListReport(indicators) {
    return this.getSourceTable().then(() =>
      super.generatePatientListReport(indicators)
    );
  }

  getAggregateReport(reportParams) {
    const that = this;
    return new Promise((resolve, reject) => {
      that
        .getSourceTable()
        .then(() => super.generateReport(reportParams))
        .then((results) => {
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

            if (this.params && this.params.isAggregated === true) {
              finalResult = reportProcessorHelpersService.aggregateDataSets(
                finalResult
              );
              if (finalResult.length > 0) {
                finalResult[0].location = 'Multiple Locations...';
              }
            }

            resolve({
              queriesAndSchemas: results,
              result: finalResult,
              sectionDefinitions: indicatorDefinitions,
              indicatorDefinitions: [],
              isReleased: that.isReleased()
            });
          }
        })
        .catch((error) => {
          console.error('prep monthly report generation error: ', error);
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
              resolve(results);
            });
        })
        .catch((err) => {
          reject(results);
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
