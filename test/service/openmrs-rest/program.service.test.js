import requestConfig from '../../../request-config';
import * as ProgramService from '../../../service/openmrs-rest/program.service';

describe('ProgramService: ', () => {
  test('fetches an returns a list of program enrollments matching the provided enrollment UUID', async () => {
    const testProgramEnrollments = {
      uuid: 'test-program-enrollment-a-uuid',
      program: {
        uuid: 'test-program-enrollment-uuid',
        name: 'GENERAL ONCOLOGY'
      },
      display: 'GENERAL ONCOLOGY',
      dateEnrolled: '2021-04-12T00:00:00.000+0300',
      dateCompleted: null
    };

    const requestSpy = jest.spyOn(requestConfig, 'getRequestPromise');
    requestSpy.mockResolvedValueOnce(testProgramEnrollments);

    await ProgramService.getProgramEnrollmentByUuid('test-enrollment-uuid', {})
      .then((enrollments) => {
        expect(enrollments).toBeDefined();
        expect(enrollments).toEqual(testProgramEnrollments);
      })
      .catch((err) => expect(err).not.toBeDefined());
  });

  test('throws an error if there is a problem fetching program enrollments', async () => {
    const error = new Error(`Object with the given uuid doesn't exist [null]`);

    const requestSpy = jest.spyOn(requestConfig, 'getRequestPromise');
    requestSpy.mockRejectedValueOnce(error);

    await ProgramService.getProgramEnrollmentByUuid('test-enrollment-uuid', {})
      .then((enrollments) => {
        expect(enrollments).not.toBeDefined();
      })
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(
          /object with the given uuid doesn't exist/i
        );
      });
  });

  test('fetches an returns a list of program enrollments matching the provided patient UUID', async () => {
    const testScopedProgramEnrollments = {
      results: [
        {
          uuid: 'test-program-enrollment-a-uuid',
          program: {
            uuid: 'test-dc-program-enrollment-uuid',
            name: 'HIV DIFFERENTIATED CARE PROGRAM'
          },
          display: 'HIV DIFFERENTIATED CARE PROGRAM',
          dateEnrolled: '2019-02-19T00:00:00.000+0300',
          dateCompleted: '2019-02-26T11:15:50.000+0300'
        },
        {
          uuid: 'test-program-enrollment-b-uuid',
          program: {
            uuid: 'test-viremia-program-enrollment-uuid',
            name: 'VIREMIA PROGRAM'
          },
          display: 'VIREMIA PROGRAM',
          dateEnrolled: '2019-02-26T00:00:00.000+0300',
          dateCompleted: '2019-02-28T12:01:01.000+0300'
        }
      ]
    };

    const requestSpy = jest.spyOn(requestConfig, 'getRequestPromise');
    requestSpy.mockResolvedValueOnce(testScopedProgramEnrollments);

    await ProgramService.getProgramEnrollmentByPatientUuid(
      'test-patient-a-uuid',
      {}
    )
      .then((enrollments) => {
        expect(enrollments).toBeDefined();
        expect(enrollments).toEqual(testScopedProgramEnrollments);
      })
      .catch((err) => expect(err).not.toBeDefined());
  });

  test('throws an error if there is a problem fetching program enrollments', async () => {
    const error = new Error(`Object with the given uuid doesn't exist [null]`);

    const requestSpy = jest.spyOn(requestConfig, 'getRequestPromise');
    requestSpy.mockRejectedValueOnce(error);

    await ProgramService.getProgramEnrollmentByPatientUuid(
      'test-patient-a-uuid',
      {}
    )
      .then((enrollments) => {
        expect(enrollments).not.toBeDefined();
      })
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(
          /object with the given uuid doesn't exist/i
        );
      });
  });
});
