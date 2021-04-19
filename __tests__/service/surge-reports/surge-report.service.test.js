import { MultiDatasetReport } from '../../../app/reporting-framework/multi-dataset.report';
import { PatientlistMysqlReport } from '../../../app/reporting-framework/patientlist-mysql.report';
import ReportProcessorHelpersService from '../../../app/reporting-framework/report-processor-helpers.service';
import { SurgeService } from '../../../service/surge-reports/surge-report.service';

describe('SurgeService: ', () => {
  let testReportParams = {
    requestParams: {
      year_week: '202116',
      locationUuids: 'test-location-a-uuids'
    }
  };

  const service = new SurgeService('surge', testReportParams.requestParams);

  test('fetches and returns a report', async () => {
    const testReport = [
      {
        report: {
          reportName: 'surgeReport',
          params: {
            year_week: '202116',
            locationUuids: ['test-location-a-uuid'],
            locations: ['Test Location A'],
            startDate: '2021-04-19',
            endDate: '2021-04-19',
            referenceDate: '2021-04-19',
            surgeWeeklyDatasetSource: 'etl.surge_weekly_report_dataset'
          },
          queryResults: {
            results: [
              {
                active_in_care_this_week: null,
                active_on_dc: 2909,
                active_on_prep_this_week: 5,
                active_to_ltfu_count: 0,
                all_ltfus: 449,
                art_revisit_this_week: 0,
                cumulative_dead: 127,
                cur_prep_this_week: 0,
                enrolled_in_prep_this_week: 0,
                enrolled_this_week: 0,
                location: 'Test Location A',
                location_id: 1,
                location_uuid: 'test-location-a-uuid',
                transfer_in_this_week: 0,
                transfer_out_this_week: 0,
                tx2_scheduled_honored: 0,
                tx2_scheduled_this_week: 12,
                tx2_scheduled_this_week_but_came_early: 2,
                tx2_unscheduled_this_week: 0,
                tx2_visit_this_week: 0,
                unscheduled_this_week: 0,
                unscheduled_this_week_and_due_for_vl: 667,
                visit_this_week: 0
              }
            ]
          },
          reportSchemas: {
            main: {
              name: 'SurgeReportAggregate',
              transFormDirectives: {
                joinColumn: 'location_id',
                skipColumns: ['location_uuid', 'join_location']
              }
            }
          },
          reportQuery: ''
        },
        results: {
          results: {
            results: [
              {
                active_in_care_this_week: null,
                active_on_dc: 2909,
                active_on_prep_this_week: 5,
                active_to_ltfu_count: 0,
                all_ltfus: 449,
                art_revisit_this_week: 0,
                cumulative_dead: 127,
                cur_prep_this_week: 0,
                enrolled_in_prep_this_week: 0,
                enrolled_this_week: 0,
                location: 'Test Location A',
                location_id: 1,
                location_uuid: 'test-location-a-uuid',
                transfer_in_this_week: 0,
                transfer_out_this_week: 0,
                tx2_scheduled_honored: 0,
                tx2_scheduled_this_week: 12,
                tx2_scheduled_this_week_but_came_early: 2,
                tx2_unscheduled_this_week: 0,
                tx2_visit_this_week: 0,
                unscheduled_this_week: 0,
                unscheduled_this_week_and_due_for_vl: 667,
                visit_this_week: 0
              }
            ]
          }
        }
      }
    ];

    const testFinalDataset = [
      {
        active_in_care_this_week: null,
        active_on_dc: 2909,
        active_on_prep_this_week: 5,
        active_to_ltfu_count: 0,
        all_ltfus: 449,
        art_revisit_this_week: 0,
        cumulative_dead: 127,
        cur_prep_this_week: 0,
        enrolled_in_prep_this_week: 0,
        enrolled_this_week: 0,
        location: 'Test Location A',
        location_id: 1,
        location_uuid: 'test-location-a-uuid',
        transfer_in_this_week: 0,
        transfer_out_this_week: 0,
        tx2_scheduled_honored: 0,
        tx2_scheduled_this_week: 12,
        tx2_scheduled_this_week_but_came_early: 2,
        tx2_unscheduled_this_week: 0,
        tx2_visit_this_week: 0,
        unscheduled_this_week: 0,
        unscheduled_this_week_and_due_for_vl: 667,
        visit_this_week: 0
      }
    ];

    jest
      .spyOn(MultiDatasetReport.prototype, 'generateReport')
      .mockImplementation(() => Promise.resolve(testReport));

    jest
      .spyOn(ReportProcessorHelpersService.prototype, 'joinDataSets')
      .mockReturnValue(testFinalDataset);

    await service
      .generateReport(testReportParams)
      .then((report) => {
        expect(report).toBeDefined();
        expect(report).toHaveProperty('queriesAndSchemas');
        expect(report).toHaveProperty('sectionDefinitions');
        expect(report.result).toEqual(testFinalDataset);
      })
      .catch((err) => expect(err).not.toBeDefined());
  });

  test('throws an error if there is a problem fetching the aggregate report', async () => {
    const error = new Error('Error establishing a database connection');
    testReportParams.locationUuids = 'test-location-a-uuid';

    jest
      .spyOn(MultiDatasetReport.prototype, 'generateReport')
      .mockImplementation(() => Promise.reject(error));

    await service
      .generateReport(testReportParams)
      .then((report) => {
        expect(report).not.toBeDefined();
      })
      .catch((err) => {
        expect(err.message).toMatch(
          /error establishing a database connection/i
        );
      });
  });

  test('fetches and returns a patient list', async () => {
    const testPatientList = {
      results: {
        results: [
          {
            active_on_dc: 1,
            age: 49,
            clinical_visit_num: 6,
            cur_arv_adherence: 'GOOD',
            cur_arv_line: 1,
            cur_arv_meds: '628 ## 802 ## 9759',
            cur_meds: 'LAMIVUDINE, TENOFOVIR, DOLUTEGRAVIR',
            cur_status: 'transfer_out',
            days_since_last_vl: 235,
            days_since_rtc_date: 5,
            days_since_starting_arvs: 44308,
            end_date: null,
            gender: 'F',
            location: 'Test Location A',
            location_id: 123456789,
            location_uuid: 'test-location-a-uuid',
            patient_uuid: '5b6f3f12-1359-11df-a1f1-0026b9348838',
            person_name: 'Test Patient A',
            prev_clinical_rtc_date_hiv: '2021-01-25',
            prev_status: 'transfer_out',
            rtc_date: '2021-04-19',
            scheduled_this_week: 1,
            scheduled_this_week_and_due_for_vl: 0,
            start_date: '2021-04-17T21:00:00.000Z',
            started_art_this_week: 0,
            started_dc_this_week: 0,
            status: 'transfer_out',
            visit_this_week: 0,
            week_patient_became_active: null,
            year_week: '202116'
          }
        ]
      }
    };

    testReportParams = {
      indicators: 'scheduled_this_week',
      year_week: '202116',
      locationUuids: 'test-location-a-uuid'
    };

    jest
      .spyOn(PatientlistMysqlReport.prototype, 'generatePatientListReport')
      .mockImplementation(() => Promise.resolve(testPatientList));

    await service
      .getPatientListReport(testReportParams)
      .then((list) => {
        expect(list).toBeDefined();
        expect(list).toMatchObject(testPatientList);
      })
      .catch((err) => {
        expect(err).not.toBeDefined();
      });
  });

  test('throws an error if there is a problem fetching the patient list', async () => {
    const error = new Error('Error establishing a database connection');

    testReportParams.locationUuids = 'test-location-a-uuid';

    jest
      .spyOn(PatientlistMysqlReport.prototype, 'generatePatientListReport')
      .mockImplementation(() => Promise.reject(error));

    await service
      .getPatientListReport(testReportParams)
      .then((report) => {
        expect(report).not.toBeDefined();
      })
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(
          /error establishing a database connection/i
        );
      });
  });
});
