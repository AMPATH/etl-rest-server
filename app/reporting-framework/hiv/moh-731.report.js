import { MultiDatasetPatientlistReport } from '..//multi-dataset-patientlist.report';
import ReportProcessorHelpersService from '../report-processor-helpers.service';
import { Promise } from 'bluebird';
const Moment = require('moment');
const moh731GreenCarddefs = require('./moh-731-2017');
const moh731BlueCarddefs = require('./moh-731-legacy');
const cbhipIndicatorDefs = require('./cbhip-indicator-definitions.json');
const dao = require('../../../etl-dao');

export class Moh731Report extends MultiDatasetPatientlistReport {
  constructor(reportName, params) {
    if (params.isAggregated) {
      params.excludeParam = ['location_id', 'arv_first_regimen_location_id'];
      params.joinColumnParam = 'join_location';
    }
    params.hivMonthlyDatasetSource = 'etl.hiv_monthly_report_dataset_frozen'; // defaults to frozen
    params.hivVlDataSource =
      '(SELECT fli.person_id, fli.hiv_viral_load as vl_1, fli.test_datetime as vl_1_date FROM etl.flat_labs_and_imaging fli INNER JOIN (SELECT person_id, MAX(test_datetime) AS max_vl_1_date,max(encounter_id) as encounter_id FROM etl.flat_labs_and_imaging fli where fli.hiv_viral_load is not null GROUP BY person_id) max_dates ON fli.person_id = max_dates.person_id AND fli.test_datetime = max_dates.max_vl_1_date AND fli.encounter_id = max_dates.encounter_id)';
    params.hivSummaryDataSource =
      '(SELECT fhsvb.person_id, fhsvb.vl_1, fhsvb.vl_1_date, fhsvb.weight, fhsvb.height, fhsvb.cur_who_stage as stage FROM etl.flat_hiv_summary_v15b fhsvb where fhsvb.is_clinical_encounter = 1 and fhsvb.next_clinical_datetime_hiv is null)';
    console.log('creating new moh 731 report service');
    super(reportName, params);
  }

  generateReport(additionalParams) {
    const that = this;
    return new Promise((resolve, reject) => {
      that
        .determineMohReportSourceTables()
        .then((res) => {
          console.log('Params:::', that.params);
          super
            .generateReport(additionalParams)
            .then((results) => {
              if (
                additionalParams &&
                additionalParams.type === 'patient-list'
              ) {
                resolve(results);
              } else {
                let finalResult = [];
                const reportProcessorHelpersService = new ReportProcessorHelpersService();
                for (let result of results) {
                  if (
                    result.report &&
                    result.report.reportSchemas &&
                    result.report.reportSchemas.main &&
                    result.report.reportSchemas.main.transFormDirectives
                      .joinColumn
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
                  finalResult[0].location = 'Multiple Locations...';
                }

                let sectionDefs = null;

                if (that.params.exclude == 'moh731') {
                  sectionDefs = cbhipIndicatorDefs;
                } else {
                  sectionDefs =
                    that.reportName === 'MOH-731-greencard'
                      ? moh731GreenCarddefs
                      : moh731BlueCarddefs;
                }

                resolve({
                  queriesAndSchemas: results,
                  result: finalResult,
                  sectionDefinitions: sectionDefs,
                  indicatorDefinitions: [],
                  isReleased:
                    that.params.hivMonthlyDatasetSource ===
                    'etl.hiv_monthly_report_dataset_frozen'
                });
              }
            })
            .catch((error) => {
              console.error('MOH 731 generation error: ', error);
              reject(error);
            });
        })
        .catch((err) => {
          console.error('MOH 731 generation error: ', err);
          reject(error);
        });
    });
  }

  generatePatientListReport(indicators) {
    let self = this;
    let moh731defs =
      this.reportName === 'MOH-731-greencard'
        ? moh731GreenCarddefs
        : moh731BlueCarddefs;
    return new Promise((resolve, reject) => {
      self
        .determineMohReportSourceTables()
        .then((res) => {
          super
            .generatePatientListReport(indicators)
            .then((results) => {
              let indicatorLabels = self.getIndicatorSectionDefinitions(
                results.indicators,
                moh731defs
              );

              results.indicators = indicatorLabels;

              results.isReleased =
                self.params.hivMonthlyDatasetSource ===
                'etl.hiv_monthly_report_dataset_frozen';

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
              console.error('MOH patient list generation error', err);
              reject(err);
            });
        })
        .catch((err) => {
          console.error('MOH 731 generation error: ', err);
          reject(error);
        });
    });
  }

  getIndicatorSectionDefinitions(requestIndicators, sectionDefinitions) {
    let results = [];
    _.each(requestIndicators, function (requestIndicator) {
      _.each(sectionDefinitions, function (sectionDefinition) {
        _.each(sectionDefinition.indicators, function (indicator) {
          if (indicator.indicator === requestIndicator) {
            // console.log('Found indicator', requestIndicator);
            results.push(indicator);
          }
        });
      });
    });
    return results;
  }

  resolveLocationUuidsToName(uuids) {
    return new Promise((resolve, reject) => {
      // resolve location name
      dao.resolveLocationUuidsToName(uuids.split(','), (loc) => {
        resolve(loc);
      });
    });
  }

  determineMohReportSourceTables() {
    const self = this;
    return new Promise((resolve, reject) => {
      let query = 'select * from etl.moh_731_last_release_month';
      let runner = self.getSqlRunner();

      runner
        .executeQuery(query)
        .then((results) => {
          let lastReleasedMonth = results[0]['last_released_month'];
          console.log(
            'Last released MOH 731 month: ' +
              Moment(lastReleasedMonth).toLocaleString()
          );
          console.log(
            'MOH 731 Request Month: ' +
              Moment(self.params.endDate).toLocaleString()
          );
          if (
            Moment(lastReleasedMonth).isSameOrAfter(Moment(self.params.endDate))
          ) {
            self.params.hivMonthlyDatasetSource =
              'etl.hiv_monthly_report_dataset_frozen';
          } else {
            self.params.hivMonthlyDatasetSource =
              'etl.hiv_monthly_report_dataset_v1_2';
          }
          console.log(
            'Using Datasource::: ',
            self.params.hivMonthlyDatasetSource
          );
          resolve(self.params.hivMonthlyDatasetSource);
        })
        .catch((error) => {
          console.error('Error getting moh 731 released report month:', error);
          reject(error);
        });
    });
  }
}
