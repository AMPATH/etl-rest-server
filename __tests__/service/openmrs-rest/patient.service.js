import requestConfig from '../../../request-config';
import * as PatientService from '../../../service/openmrs-rest/patient.service';

describe('PatientService: ', () => {
  const testPatient = {
    uuid: 'test-patient-a-uuid',
    display: 'T-123456789 - Test Patient A',
    identifiers: [
      {
        display: 'Test AMRS Medical Record Number = 12345test-6',
        uuid: 'test-amrs-number-uuid',
        identifier: '12345test-6',
        identifierType: {
          uuid: 'test-amrs-number-identifier-type-uuid',
          display: 'Test AMRS Medical Record Number'
        }
      }
    ]
  };

  test('fetches and returns the patient resource matching the provided patient uuid', async () => {
    const requestSpy = jest.spyOn(requestConfig, 'getRequestPromise');
    requestSpy.mockResolvedValueOnce(testPatient);

    await PatientService.getPatientByUuid('test-patient-uuid', {})
      .then((patient) => {
        expect(patient).toBeDefined();
        expect(patient).toEqual(testPatient);
      })
      .catch((err) => expect(err).not.toBeDefined());
  });

  test('throws an error if there is a problem fetching the patient resource matching the provided patient uuid', async () => {
    const error = new Error(`Object with the given uuid doesn't exist [null]`);

    const requestSpy = jest.spyOn(requestConfig, 'getRequestPromise');
    requestSpy.mockRejectedValueOnce(error);

    await PatientService.getPatientByUuid('test-patient-uuid', {})
      .then((patient) => {
        expect(patient).not.toBeDefined();
      })
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(
          /object with the given uuid doesn't exist/i
        );
      });
  });

  test('fetches and returns the patient resource matching the provided identifier', async () => {
    const testPatientScopedByIdentifier = {
      results: [
        {
          uuid: 'test-patient-a-uuid',
          display: 'Test AMRS Medical Record Number = 12345test-6'
        }
      ]
    };

    const requestSpy = jest.spyOn(requestConfig, 'getRequestPromise');
    requestSpy.mockResolvedValueOnce(testPatientScopedByIdentifier);

    await PatientService.getPatientByIdentifier('12345test-6', {})
      .then((patient) => {
        expect(patient).toBeDefined();
        expect(patient).toEqual(testPatientScopedByIdentifier.results);
      })
      .catch((err) => expect(err).not.toBeDefined());
  });

  test('throws an error if there is a problem fetching the patient resource matching the provided patient identifier', async () => {
    const error = new Error(`Object with the given uuid doesn't exist [null]`);

    const requestSpy = jest.spyOn(requestConfig, 'getRequestPromise');
    requestSpy.mockRejectedValueOnce(error);

    await PatientService.getPatientByIdentifier('bad-identifier', {})
      .then((patient) => {
        expect(patient).not.toBeDefined();
      })
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(
          /object with the given uuid doesn't exist/i
        );
      });
  });

  test('fetches and returns a list of patient UUIDs from the provided identifiers', async () => {
    const expected = [
      { identifier: '12345test-6', patientUuid: 'test-patient-a-uuid' },
      { identifier: '789test-10', patientUuid: 'test-patient-b-uuid' }
    ];

    const requestSpy = jest.spyOn(requestConfig, 'getRequestPromise');

    requestSpy.mockResolvedValueOnce({
      results: [
        {
          uuid: 'test-patient-a-uuid',
          display: 'Test AMRS Medical Record Number = 12345test-6'
        }
      ]
    });

    requestSpy.mockResolvedValueOnce({
      results: [
        {
          uuid: 'test-patient-b-uuid',
          display: 'Test AMRS Medical Record Number = 789test-10'
        }
      ]
    });

    await PatientService.getPatientUuidsByIdentifiers([
      '12345test-6',
      '789test-10'
    ])
      .then((patients) => {
        expect(patients).toBeDefined();
        expect(patients).toEqual(expected);
      })
      .catch((err) => expect(err).not.toBeDefined());
  });

  test('throws an error if there is a problem fetching the patient resources matching the provided patient identifiers', async () => {
    const error = new Error(`Object with the given uuid doesn't exist [null]`);

    const requestSpy = jest.spyOn(requestConfig, 'getRequestPromise');
    requestSpy.mockRejectedValueOnce(error);

    requestSpy.mockRejectedValueOnce(error);

    await PatientService.getPatientUuidsByIdentifiers([
      '12345test-6',
      '!@!another-bad 1dentifi3r'
    ])
      .then((patient) => {
        expect(patient).not.toBeFalsy();
      })
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(
          /object with the given uuid doesn't exist/i
        );
      });
  });
});
