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
      // super
      // .generateReport(reportParams)
      // .then((results) => {
      //   if (reportParams && reportParams.type === 'patient-list') {
      //     resolve(results);
      //   } else {
      //     let finalResult = [];
      //     const reportProcessorHelpersService = new ReportProcessorHelpersService();
      //     for (let result of results) {
      //       if (
      //         result.report &&
      //         result.report.reportSchemas &&
      //         result.report.reportSchemas.main &&
      //         result.report.reportSchemas.main.transFormDirectives.joinColumn
      //       ) {
      //         // console.log("joinColumnParam: ",result.report.reportSchemas.main.transFormDirectives.joinColumnParam, "joinColumn: ", result.report.reportSchemas.main.transFormDirectives.joinColumn,
      //         // "finalResult: ", finalResult,
      //         // "results: ", result.results.results.results)
      //         finalResult = reportProcessorHelpersService.joinDataSets(
      //           that.params[
      //           result.report.reportSchemas.main.transFormDirectives
      //             .joinColumnParam
      //           ] ||
      //           result.report.reportSchemas.main.transFormDirectives
      //             .joinColumn,
      //           finalResult,
      //           result?.results?.results?.results
      //         );
      //       }
      //     }
      //     resolve({
      //       queriesAndSchemas: results,
      //       result: [{
      //         location_uuid: '18c343eb-b353-462a-9139-b16606e6b6c2',
      //         location_id: 195,
      //         location: 'Location Test',
      //         plhiv_hypertension: 1,
      //         plhiv_diabetes: 0,
      //         plhiv_hypertension_and_diabetes: 0,
      //         plhiv_mental_disorder: 0,
      //         plhiv_other_ncd: 0
      //       }],
      //       sectionDefinitions: indicatorDefinitions,
      //       indicatorDefinitions: []
      //     });
      //   }
      // })
      // .catch((error) => {
      //   console.error('PLHIV NCD monthly report generation error: ', error);
      //   reject(error);
      // });

      //--mock-- 

      this.params.locationUuids.length === 3 ?
      resolve({
        queriesAndSchemas: [],
        result: [{
          location_uuid: '18c343eb-b353-462a-9139-b16606e6b6c2',
          location_id: 195,
          location: 'Location Test',
          plhiv_hypertension: 1,
          plhiv_diabetes: 0,
          plhiv_hypertension_and_diabetes: 0,
          plhiv_mental_disorder: 0,
          plhiv_other_ncd: 0
        },{
          location_uuid: '18c343eb-b353-462a-9139-b16606e6b6c2',
          location_id: 195,
          location: 'Location Test B',
          plhiv_hypertension: 0,
          plhiv_diabetes: 1,
          plhiv_hypertension_and_diabetes: 0,
          plhiv_mental_disorder: 0,
          plhiv_other_ncd: 0
        },{
          location_uuid: '18c343eb-b353-462a-9139-b16606e6b6c2',
          location_id: 195,
          location: 'Location Test C',
          plhiv_hypertension: 0,
          plhiv_diabetes: 0,
          plhiv_hypertension_and_diabetes: 1,
          plhiv_mental_disorder: 0,
          plhiv_other_ncd: 0
        }],
        sectionDefinitions: indicatorDefinitions,
        indicatorDefinitions: []
      }) : this.params.locationUuids.length === 2 ? 
      resolve({
        queriesAndSchemas: [],
        result: [{
          location_uuid: '18c343eb-b353-462a-9139-b16606e6b6c2',
          location_id: 195,
          location: 'Location Test',
          plhiv_hypertension: 1,
          plhiv_diabetes: 0,
          plhiv_hypertension_and_diabetes: 0,
          plhiv_mental_disorder: 1,
          plhiv_other_ncd: 0
        },{
          location_uuid: '18c343eb-b353-462a-9139-b16606e6b6c2',
          location_id: 195,
          location: 'Location B',
          plhiv_hypertension: 1,
          plhiv_diabetes: 0,
          plhiv_hypertension_and_diabetes: 0,
          plhiv_mental_disorder: 1,
          plhiv_other_ncd: 0
        }],
        sectionDefinitions: indicatorDefinitions,
        indicatorDefinitions: []
      }) :  
      resolve({
        queriesAndSchemas: [],
        result: [{
          location_uuid: '18c343eb-b353-462a-9139-b16606e6b6c2',
          location_id: 195,
          location: 'Location Test',
          plhiv_hypertension: 1,
          plhiv_diabetes: 0,
          plhiv_hypertension_and_diabetes: 0,
          plhiv_mental_disorder: 0,
          plhiv_other_ncd: 0
        }],
        sectionDefinitions: indicatorDefinitions,
        indicatorDefinitions: []
      });
    });
  }

  generatePatientList(indicators) {
    let self = this;
    return new Promise((resolve, reject) => {
      // super
      //   .generatePatientListReport(indicators)
      //   .then((results) => {
      //     let indicatorLabels = self.getIndicatorSectionDefinitions(
      //       results.indicators,
      //       indicatorDefinitions
      //     );

      //     results.indicators = indicatorLabels;

      //     if (results.result.length > 0) {
      //       _.each(results.result, (item) => {
      //         item.cur_prep_meds_names = etlHelpers.getARVNames(
      //           item.cur_prep_meds_names
      //         );
      //       });
      //     }

      //     self
      //       .resolveLocationUuidsToName(self.params.locationUuids)
      //       .then((locations) => {
      //         results.locations = locations;
      //         console.log("patient-list->: ", results);
      //         resolve(results);
      //       })
      //       .catch((err) => {
      //         resolve(err);
      //       });
      //   })
      //   .catch((err) => {
      //     reject(err);
      //   });

      // mock-patientlist
      self
        .resolveLocationUuidsToName(self.params.locationUuids)
        .then((locations) => {
          console.log("locations--->: ", locations)
          resolve({
            result: [
              {
                location_uuid: "18c343eb-b353-462a-9139-b16606e6b6c2",
                location_id: 195,
                ccc_number: "No CCC",
                ovcid_id: "null",
                upi_number: "No NUPI",
                location: "Location Test",
                plhiv_hypertension: 0,
                plhiv_diabetes: 0,
                plhiv_hypertension_and_diabetes: 1,
                plhiv_mental_disorder: 0,
                plhiv_other_ncd: 0,
                "cumulative_prep_discontinued_this_month": 0,
                "prev_on_prep_and_turned_positive": 0,
                "turned_positive_this_month": 0,
                "cumulative_turned_positive_this_month": 1,
                "status": "ltfu",
                "age": 25,
                "gender": "F",
                "days_since_rtc_date": "1733",
                "latest_rtc_date": "2019-01-01",
                "last_appointment": "2018-12-04 PREPINITIAL",
                "prev_rtc_date": "2019-01-01",
                "general_pop_active": 0,
                "population_type": "discordant",
                "is_breastfeeding": "unknown",
                "is_pregnant": "unknown",
                "newly_enrolled_pregnant": "null",
                "newly_enrolled_breastfeeding": "null",
                "has_hiv_rapid_test_this_month": 0,
                "patient_uuid": "ed9d8f0c-1bea-4d51-adb8-504830358c18",
                "uuid": "ed9d8f0c-1bea-4d51-adb8-504830358c18",
                "person_id": 884044,
                "person_name": "test amrs identification",
                "identifiers": "043238402-2",
                "phone_number": "null",
                "cur_prep_meds": "null",
                "cur_prep_meds_names": "",
                "inital_prep_start_date": "null",
                "initiation_reason": "PARTNER CONFIRMED HIV+",
                "discontinue_reason": "null",
                "population_type_category": "null",
                "nearest_center": "null",
                "enrollment_date": "1900-01-01",
                "days_since_rtc": 1742,
                "death_date": "null",
                "hiv_rapid_test": "Positive",
                "rapid_test_date": "2018-11-26",
                "turned_positive_date": "2018-11-26",
                "cur_arv_meds": ""
              }
            ],
            queriesAndSchemas: {},
            indicators: [
              {
                  label: "Cumulative Turned Positive this month",
                  indicator: "cumulative_turned_positive_this_month"
              }
          ],
          allResults:[]
          });
        })
        .catch((err) => {
          resolve(err);
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
