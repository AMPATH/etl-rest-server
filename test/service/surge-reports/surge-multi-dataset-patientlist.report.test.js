import { MultiDatasetReport } from '../../../app/reporting-framework/multi-dataset.report';
import { SurgeMultiDatasetPatientlistReport } from '../../../service/surge-reports/surge-multi-dataset-patientlist.report';

describe('SurgeMultiDatasetPatientlistReport', () => {
  const testParams = {
    indicators: 'scheduled_this_week',
    year_week: '202116',
    locationUuids: 'test-location-a-uuid',
    limit: 1
  };

  const service = new SurgeMultiDatasetPatientlistReport(
    'surgeReport',
    testParams
  );

  test('fetches and returns a patient list', async () => {
    const testReport = [
      {
        results: {
          results: {
            results: {
              active_in_care_this_week: null,
              active_on_dc: 1,
              age: 53,
              cd4_1: 397,
              cd4_1_date: '2013-05-07T21:00:00.000Z',
              encounter_date: '2021-02-23',
              encounter_yw: 202108,
              enrollment_date: '2003-04-14',
              gender: 'M',
              latest_rtc_date: '2021-04-22',
              latest_vl: 0,
              latest_vl_date: '2021-02-23',
              location: 'Test Location A',
              location_id: 1,
              location_uuid: 'test-location-a-uuid',
              new_prep_this_week: 0,
              newly_ltfu_this_week: 0,
              newly_med_ltfu_this_week: 0,
              non_ltfu_dead_this_week: 0,
              not_elligible_and_on_dc: 1,
              on_schedule: 0,
              on_schedule_this_week: 0,
              overdue_for_vl_active: 0,
              person_id: 123456789,
              person_name: 'Test Patient A',
              phone_number: '+1 234 567 8910',
              prev_status: 'active',
              previous_vl: 0,
              previous_vl_date: '2020-04-02',
              rtc_date: '2021-04-22',
              scheduled_this_week: 1,
              scheduled_this_week_and_due_for_vl: 0,
              start_date: '2021-04-17T21:00:00.000Z',
              status: 'missed',
              year_week: '202116'
            }
          }
        }
      }
    ];

    jest
      .spyOn(MultiDatasetReport.prototype, 'generateReport')
      .mockImplementation(() => Promise.resolve(testReport));

    await service
      .generatePatientListReport('scheduled_this_week')
      .then((list) => {
        expect(list).toBeDefined();
        expect(list.result).toEqual(testReport[0].results.results.results);
        expect(list.queriesAndSchemas).toEqual(testReport[0]);
        expect(list.size).toEqual(1);
      })
      .catch((err) => expect(err).not.toBeDefined());
  });

  test('throws an error if there is a problem fetching the patient list', async () => {
    const error = new Error('Error establishing a database connection');

    jest
      .spyOn(MultiDatasetReport.prototype, 'generateReport')
      .mockImplementation(() => Promise.reject(error));

    await service
      .generatePatientListReport('scheduled_this_week')
      .then((list) => {
        expect(list).not.toBeDefined();
      })
      .catch((err) => {
        expect(err).toBeDefined;
        expect(err.message).toMatch(
          /error establishing a database connection/i
        );
      });
  });
});
