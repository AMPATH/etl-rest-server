import { BaseMysqlReport } from '../../app/reporting-framework/base-mysql.report';
import { PatientlistMysqlReport } from '../../app/reporting-framework/patientlist-mysql.report';
import { getPatientListCols } from '../../oncology-reports/oncology-reports-service';
import { BreastCancerMonthlySummaryService } from '../../service/breast-cancer-monthly-summary.service';

const mockGetPatientListCols = getPatientListCols;

jest.mock('../../oncology-reports/oncology-reports-service', () => ({
  getPatientListCols: jest.fn()
}));

describe('BreastCancerMonthlySummaryService: ', () => {
  const service = new BreastCancerMonthlySummaryService();
  const patientListCols = [
    'age',
    'encounter_datetime',
    'gender',
    'hiv_status',
    'location_name',
    'nipple_discharge_location',
    'nipple_retraction_location',
    'patient_uuid',
    'person_name',
    'phone_number',
    'type_of_abnormality'
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
            abnormal_findings: 0,
            encounter_datetime: '01-2021',
            female_patients: 11,
            gender: 11,
            location_name: 'Test Location A',
            location_uuid: 'test-location-a-uuid',
            male_patients: 0,
            normal_30_to_40yrs: 3,
            normal_41_to_50yrs: 6,
            normal_51_to_69yrs: 0,
            normal_above_70yrs: 0,
            normal_below_30yrs: 2,
            normal_findings: 0,
            total_breast_screened: 11
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
        indicators: 'total_breast_screened',
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
            nipple_discharge_location: null,
            nipple_retraction_location: null,
            patient_uuid: 'yet-another-test-patient-uuid',
            person_id: 123456789,
            person_name: 'Yet Another Test Patient',
            phone_number: '+1 234 567890',
            type_of_abnormality: 'Breast lump'
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
