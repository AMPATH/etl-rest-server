var authorizer = require('../../authorization/etl-authorizer');
 import { PrepMonthlySummaryService } from '../../service/prep-monthly-summary.service';
import { PlhivNcdMonthlySummaryService } from '../../service/plhiv-ncd/plhiv-ncd-monthly-summary.service';
var etlHelpers = require('../../etl-helpers');
var privileges = authorizer.getAllPrivileges();
var preRequest = require('../../pre-request-processing');
const routes = [
//   {
//     method: 'GET',
//     path: '/etl/prep-monthly-summary',
//     config: {
//       plugins: {
//         hapiAuthorization: {
//           role: privileges.canViewClinicDashBoard
//         }
//       },
//       handler: function (request, reply) {
//         preRequest.resolveLocationIdsToLocationUuids(request, function () {
//           let requestParams = Object.assign({}, request.query, request.params);
//           let reportParams = etlHelpers.getReportParams(
//             'prep-monthly-summary',
//             ['endDate', 'locationUuids'],
//             requestParams
//           );
//           reportParams.requestParams.isAggregated = true;

//           let service = new PrepMonthlySummaryService(
//             'prepMonthlySummaryReport',
//             reportParams.requestParams
//           );
//           service
//             .getAggregateReport()
//             .then((result) => {
//               reply(result);
//             })
//             .catch((error) => {
//               reply(error);
//             });
//         });
//       },
//       description: 'prep monthly summary dataset',
//       notes: 'prep monthly summary dataset',
//       tags: ['api'],
//       validate: {
//         options: {
//           allowUnknown: true
//         },
//         params: {}
//       }
//     }
//   },
//   {
//     method: 'GET',
//     path: '/etl/prep-monthly-summary-patient-list',
//     config: {
//       plugins: {
//         hapiAuthorization: {
//           role: privileges.canViewClinicDashBoard
//         }
//       },
//       handler: function (request, reply) {
//         request.query.reportName = 'prep-summary-patient-list';
//         preRequest.resolveLocationIdsToLocationUuids(request, function () {
//           let requestParams = Object.assign({}, request.query, request.params);

//           let requestCopy = _.cloneDeep(requestParams);
//           let reportParams = etlHelpers.getReportParams(
//             request.query.reportName,
//             ['startDate', 'endDate', 'locationUuids', 'locations'],
//             requestParams
//           );
//           requestCopy.locationUuids = reportParams.requestParams.locationUuids;
//           const prepService = new PrepMonthlySummaryService(
//             'prepMonthlySummaryReport',
//             requestCopy
//           );

//           prepService
//             .generatePatientList(requestParams.indicators.split(','))
//             .then((results) => {
//               reply(results);
//             })
//             .catch((err) => {
//               reply(err);
//             });
//         });
//       },
//       description:
//         'Get patient list for prep monthly summary report of the location and month provided',
//       notes: 'Returns patient list of prep monthly summary indicators',
//       tags: ['api']
//     }
//   }
  {
    method: 'GET',
    path: '/etl/plhiv-ncd-monthly-summary',
    config: {
        plugins: {
            hapiAuthorization: {
              role: privileges.canViewClinicDashBoard
            }
          },
      handler: function (request, reply) {
        preRequest.resolveLocationIdsToLocationUuids(request, function () {
          let requestParams = Object.assign({}, request.query, request.params);
          let reportParams = etlHelpers.getReportParams(
            'plhiv-ncd-monthly-summary',
            ['endDate', 'locationUuids'],
            requestParams
          );
          reportParams.requestParams.isAggregated = true;
          console.log("reportParams: ", reportParams)
          let service = new PrepMonthlySummaryService(
            'plhivNcdMonthlySummaryReport',
            reportParams.requestParams
          );
          service
            .getAggregateReport()
            .then((result) => {
              console.log("prepres: ", result)
              reply({
                indicatorDefinitions: [],
                queriesAndSchemas: [],
                result: [{
                  plhiv_with_hypertensive: 1,
                  plhiv_with_diabetic: 2,
                  plhiv_with_hypertensive_and_diabetic: 3,
                  plhiv_with_mental_disorder: 2,
                  plhiv_with_other_ncd: 10
                }],
                sectionDefinitions: [
                  {
                    "sectionTitle": "",
                    "indicators": [
                        {
                            "label": "Location",
                            "indicator": "location"
                        }
                    ]
                },
                  {
                    sectionTitle: "PLHIV NCD",
                    indicators: [
                      {
                        label: "PLHIV having Hypertension",
                        indicator: "plhiv_with_hypertensive",
                      },
                      {
                        label: "PLHIV having Diabetes",
                        indicator: "plhiv_with_diabetic"
                      },
                      {
                        label: "PLHIV having Hypertension and Diabetes",
                        indicator: "plhiv_with_hypertensive_and_diabetic"
                      },
                      {
                        label: "PLHIV having Mental Disorder",
                        indicator: "plhiv_with_mental_disorder"
                      },
                      {
                        label: "PLHIV having Other NCD",
                        indicator: "plhiv_with_other_ncd"
                      }
                    ]
                  }
                ]
              })
            })
            .catch((error) => {
              reply(error);
            });
        });
      },
      description: 'Generates a monthly non-communicable disease (NCDs) report for People Living with HIV (PLHIV)',
      notes: ` The following indicators are shown:
                Number of active PLHIV and hypertensive
                Number of active PLHIV and diabetic
                Number of active PLHIV that are hypertensive and diabetic
                Number of active PLHIV with mental disorders
                Number of active PLHIV with Other
              The data is being collected on the clinical forms under additional medications and other commorbities`,
      tags: ['api']
    }
  },
  {
    method: 'GET',
    path: '/etl/plhiv-ncd-monthly-summary-patient-list',
    config: {
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      handler: function (request, reply) {
        // request.query.reportName = 'prep-summary-patient-list';
        // preRequest.resolveLocationIdsToLocationUuids(request, function () {
        //   let requestParams = Object.assign({}, request.query, request.params);

        //   let requestCopy = _.cloneDeep(requestParams);
        //   let reportParams = etlHelpers.getReportParams(
        //     request.query.reportName,
        //     ['startDate', 'endDate', 'locationUuids', 'locations'],
        //     requestParams
        //   );
        //   requestCopy.locationUuids = reportParams.requestParams.locationUuids;
        //   const prepService = new PrepMonthlySummaryService(
        //     'prepMonthlySummaryReport',
        //     requestCopy
        //   );
        // });
        reply({
          allResults: [],
          indicators: [],
          queriesAndSchemas: {
            report: '',
            results: ''
          },
          result: [
            {
              "location_uuid": "18c343eb-b353-462a-9139-b16606e6b6c2",
              "location_id": 195,
              "ccc_number": "No CCC",
              "ovcid_id": null,
              "upi_number": "No NUPI",
              "location": "Location Test",
              "active_on_prep_this_month": 1,
              "enrolled_in_prep_this_month": 1,
              "cumulative_prep_ltfu_this_month": 0,
              "prep_ltfu_this_month": 0,
              "prep_discontinued_this_month": 0,
              "cumulative_prep_discontinued_this_month": 0,
              "prev_on_prep_and_turned_positive": 0,
              "turned_positive_this_month": 0,
              "cumulative_turned_positive_this_month": 0,
              "status": "defaulter",
              "age": 101,
              "gender": "F",
              "days_since_rtc_date": "3",
              "latest_rtc_date": "2022-08-28",
              "last_appointment": "2022-08-14 PREPINITIAL",
              "prev_rtc_date": "2022-04-08",
              "general_pop_active": 0,
              "population_type": "priority",
              "is_breastfeeding": "unknown",
              "is_pregnant": "unknown",
              "newly_enrolled_pregnant": null,
              "newly_enrolled_breastfeeding": null,
              "has_hiv_rapid_test_this_month": 1,
              "patient_uuid": "1c8456f5-e380-4ef6-b9cc-38414d2191e3",
              "uuid": "1c8456f5-e380-4ef6-b9cc-38414d2191e3",
              "person_id": 1083932,
              "person_name": "Test Robs Test",
              "identifiers": "104320008-6",
              "phone_number": null,
              "cur_prep_meds": null,
              "cur_prep_meds_names": "",
              "inital_prep_start_date": null,
              "initiation_reason": null,
              "discontinue_reason": null,
              "population_type_category": "FISHER FOLK",
              "nearest_center": null,
              "enrollment_date": "2022-08-14",
              "days_since_rtc": 390,
              "death_date": null,
              "hiv_rapid_test": "Negative",
              "rapid_test_date": "2022-08-04",
              "turned_positive_date": null,
              "cur_arv_meds": ""
            }
          ]
        })
      },
      description:
        'Get patient list for PLHIV NCD monthly summary report of the location and month provided',
      notes: 'Returns patient list of PLHIV NCD monthly summary indicators',
      tags: ['api']
    }
  }
];
exports.routes = (server) => server.route(routes);
