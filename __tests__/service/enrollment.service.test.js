const enrollmentService = require('../../service/enrollment.service');
import { BaseMysqlReport } from '../../app/reporting-framework/base-mysql.report';
import { PatientlistMysqlReport } from '../../app/reporting-framework/patientlist-mysql.report';

afterAll(() => {
  jest.restoreAllMocks();
});

describe('EnrollmentService: ', () => {
  const testRequestParams = {
    endDate: '2021-04-16',
    locations: [1],
    locationUuids: 'test-location-uuid',
    programType: 'test-program-uuid',
    programTypeIds: [1]
  };

  test('returns a summary of the active program enrollments', async () => {
    const testReport = {
      size: 1,
      results: {
        results: [
          {
            enrollment_count: 3,
            program_name: 'Test Pilot Program',
            program_uuid: 'test-pilot-program-uuid'
          }
        ]
      }
    };

    jest
      .spyOn(BaseMysqlReport.prototype, 'generateReport')
      .mockImplementation(() => Promise.resolve(testReport));

    await enrollmentService
      .getActiveProgramEnrollmentSummary(testRequestParams)
      .then((programEnrollmentSummary) => {
        expect(programEnrollmentSummary).toBeDefined();
        expect(programEnrollmentSummary).toEqual(testReport);
      })
      .catch((err) => {
        expect(err).not.toBeDefined();
      });
  });

  test('throws an error if there is a problem fetching the active program enrollment summary', async () => {
    const error = new Error('Error establishing a database connection');

    jest
      .spyOn(BaseMysqlReport.prototype, 'generateReport')
      .mockImplementation(() => Promise.reject(error));

    await enrollmentService
      .getActiveProgramEnrollmentSummary(testRequestParams)
      .then((summary) => {
        expect(summary).not.toBeDefined();
      })
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(
          /Error establishing a database connection/i
        );
      });
  });

  test('returns a patient list showing clients with active program enrollments', async () => {
    const testPatientList = {
      size: 2,
      results: {
        results: [
          {
            program_id: 1,
            program_name: 'Test Pilot Program',
            program_uuid: 'test-pilot-program-uuid',
            date_completed: null,
            date_enrolled: '2020-07-05T14:33:09.000Z',
            gender: 'F',
            age: 27,
            person_name: 'Test Patient Alpha'
          },
          {
            program_id: 1,
            program_name: 'Test Pilot Program',
            program_uuid: 'test-pilot-program-uuid',
            date_completed: null,
            date_enrolled: '2020-05-21T09:55:12.000Z',
            gender: 'F',
            age: 30,
            person_name: 'Test Patient Beta'
          }
        ]
      }
    };

    jest
      .spyOn(PatientlistMysqlReport.prototype, 'generatePatientListReport')
      .mockImplementation(() => Promise.resolve(testPatientList));

    await enrollmentService
      .getActiveProgramEnrollmentsPatientList(testRequestParams)
      .then((list) => {
        expect(list).toBeDefined();
        expect(list).toEqual(testPatientList);
      })
      .catch((err) => {
        expect(err).not.toBeDefined();
      });
  });

  test('throws an error if there was a problem fetching the active program enrollments patient list', async () => {
    const error = new Error('Error establishing a database connection');

    jest
      .spyOn(PatientlistMysqlReport.prototype, 'generatePatientListReport')
      .mockImplementation(() => Promise.reject(error));

    await enrollmentService
      .getActiveProgramEnrollmentsPatientList(testRequestParams)
      .then((list) => {
        expect(list).not.toBeDefined();
      })
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(
          /Error establishing a database connection/i
        );
      });
  });
});
