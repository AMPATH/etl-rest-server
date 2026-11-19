const Promise = require('bluebird');
const _ = require('lodash');
import { MultiDatasetPatientlistReport } from '../app/reporting-framework/multi-dataset-patientlist.report.js';
import ReportProcessorHelpersService from '../app/reporting-framework/report-processor-helpers.service';
import QueryService from '../app/database-access/query.service';
const indicatorDefinitions = require('./prep-indicator-definitions.json');
var etlHelpers = require('../etl-helpers');
const LIVE_DATASET = 'etl.prep_monthly_report_dataset';
const FROZEN_DATASET = 'etl.prep_monthly_report_dataset_frozen';

export class PrepMonthlySummaryService extends MultiDatasetPatientlistReport {
  constructor(reportName, params) {
    super(reportName, params);
  }

  // Released months are reported from the frozen snapshot, so the figures and
  // line lists stay as they were submitted even after the live dataset is
  // rebuilt. Months after the last release still read the live dataset.
  generateReport(additionalParams) {
    return this.resolveDatasetTable().then(() =>
      super.generateReport(additionalParams)
    );
  }

  resolveDatasetTable() {
    this.datasetTable = LIVE_DATASET;
    const endDate = this.params && this.params.endDate;
    if (!endDate) {
      return Promise.resolve(this.datasetTable);
    }
    return new QueryService()
      .executeQuery(
        'SELECT MAX(last_released_month) AS last_released_month FROM etl.prep_monthly_report_release_month'
      )
      .then((rows) => {
        const released = rows && rows[0] && rows[0].last_released_month;
        if (
          released &&
          String(endDate).slice(0, 10) <= String(released).slice(0, 10)
        ) {
          this.datasetTable = FROZEN_DATASET;
        }
        return this.datasetTable;
      })
      .catch((err) => {
        console.error('PrEP release month lookup failed, using live data', err);
        return this.datasetTable;
      });
  }

  getReportHandler(reportName, params) {
    const handler = super.getReportHandler(reportName, params);
    const table = this.datasetTable;
    if (table && table !== LIVE_DATASET) {
      const fetchSchema = handler.fetchReportSchema.bind(handler);
      const swapTable = (node) => {
        if (Array.isArray(node)) {
          node.forEach(swapTable);
        } else if (node && typeof node === 'object') {
          if (node.table === LIVE_DATASET) {
            node.table = table;
          }
          Object.keys(node).forEach((key) => swapTable(node[key]));
        }
      };
      handler.fetchReportSchema = (...args) =>
        fetchSchema(...args).then((schemas) => {
          swapTable(schemas);
          return schemas;
        });
    }
    return handler;
  }
  getAggregateReport(reportParams) {
    const that = this;
    return new Promise((resolve, reject) => {
      this.generateReport(reportParams)
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
              indicatorDefinitions: []
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
