import { BaseMysqlReport } from '../../app/reporting-framework/base-mysql.report';
import { PatientlistMysqlReport } from '../../app/reporting-framework/patientlist-mysql.report';
import { getPatientListCols } from '../../oncology-reports/oncology-reports-service';
import { CervicalCancerMonthlySummaryService } from '../../service/cervical-cancer-monthly-summary.service';

const mockGetPatientListCols = getPatientListCols;

jest.mock('../../oncology-reports/oncology-reports-service', () => ({
  getPatientListCols: jest.fn()
}));

describe('CervicalCancerMonthlySummaryService: ', () => {
  const service = new CervicalCancerMonthlySummaryService();
  const patientListCols = [
    'age',
    'encounter_datetime',
    'gender',
    'hiv_status',
    'location_name',
    'patient_uuid',
    'person_name',
    'phone_number',
    'procedure_done',
    'type_of_abnormality',
    'via_management_plan',
    'via_procedure_done',
    'via_rtc_date',
    'visual_impression_cervix',
    'visual_impression_vagina',
    'visual_impression_vulva'
  ];

  let testParams = {
    requestParams: {
      endAge: 120,
      endDate: '2021-01-07',
      period: 'monthly',
      startAge: 0,
      startDate: '2021-01-01'
    }
  };

  test('fetches and returns an aggregate report', async () => {
    const testReport = {
      results: {
        results: [
          {
            abnormal_30_to_40yrs: 0,
            abnormal_41_to_50yrs: 0,
            abnormal_51_to_69yrs: 0,
            abnormal_above_70yrs: 0,
            abnormal_below_30yrs: 0,
            encounter_datetime: '01-2021',
            hiv_negative: 1,
            hiv_positive: 13,
            hiv_status: 14,
            location_name: 'Test Location A',
            location_uuid: 'test-location-a-uuid',
            normal_30_to_40yrs: 4,
            normal_41_to_50yrs: 6,
            normal_51_to_69yrs: 2,
            normal_above_70yrs: 0,
            normal_below_30yrs: 2,
            normal_findings: 14,
            procedures_done: 0,
            total_cervical_screened: 14
          }
        ]
      }
    };

    jest
      .spyOn(BaseMysqlReport.prototype, 'generateReport')
      .mockImplementation(() => Promise.resolve(testReport));

    await service
      .getAggregateReport(testParams)
      .then((report) => {
        expect(report).toBeDefined();
        expect(report).toEqual(testReport);
      })
      .catch((err) => {
        expect(err).not.toBeDefined();
      });
  });

  test('throws an error if there is a problem fetching the aggregate report', async () => {
    const error = new Error('Error establishing a database connection');

    jest
      .spyOn(BaseMysqlReport.prototype, 'generateReport')
      .mockImplementation(() => Promise.reject(error));

    await service
      .getAggregateReport(testParams)
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

  test('fetches and returns a patient list', async () => {
    testParams = {
      requestParams: {
        indicators: 'total_cervical_screened',
        endDate: '2021-01-31',
        startDate: '2021-01-01',
        period: 'monthly',
        startAge: 0,
        endAge: 120,
        locationUuids: 'test-location-a-uuid'
      }
    };

    const testPatientList = {
      results: {
        results: [
          {
            age: 23,
            birthdate: '1997-12-30T21:00:00.000Z',
            encounter_datetime: '2021-01-04',
            gender: 'F',
            hiv_status: 'HIV Negative',
            location_name: 'Test Location A',
            location_uuid: 'test-location-a-uuid',
            patient_uuid: 'yet-another-test-patient-uuid',
            person_id: 123456789,
            person_name: 'Yet Another Test Patient',
            phone_number: '+1 234 567890',
            type_of_abnormality: 'Normal',
            via_management_plan: 'Complete VIA in 3 years',
            via_procedure_done: 'None',
            via_rtc_date: '2024-01-03',
            visual_impression_cervix: 'Normal',
            visual_impression_vagina: 'Normal',
            visual_impression_vulva: 'Normal'
          }
        ]
      }
    };

    mockGetPatientListCols.mockResolvedValue(patientListCols);

    jest
      .spyOn(PatientlistMysqlReport.prototype, 'generatePatientListReport')
      .mockImplementation(() => Promise.resolve(testPatientList));

    await service
      .getPatientListReport(testParams)
      .then((list) => {
        expect(list).toBeDefined();
        expect(list).toEqual(testPatientList);
      })
      .catch((err) => expect(err).not.toBeDefined());
  });

  test('throws an error if there is a problem fetching the patient list', async () => {
    const error = new Error('Error establishing a database connection');

    mockGetPatientListCols.mockResolvedValue(patientListCols);

    jest
      .spyOn(PatientlistMysqlReport.prototype, 'generatePatientListReport')
      .mockImplementation(() => Promise.reject(error));

    await service
      .getPatientListReport(testParams)
      .then((list) => {
        expect(list).not.toBeDefined();
      })
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(
          /error establishing a database connection/i
        );
      });
  });
});
