const ProgramVisitTypesService = require('../../programs/program-visit-types.service');
const {
  getAllDataDependencies
} = require('../../programs/patient-data-resolver.service');

const mockGetAllDataDependencies = getAllDataDependencies;

jest.mock('../../programs/patient-data-resolver.service', () => ({
  ...jest.requireActual,
  getAllDataDependencies: jest.fn()
}));

describe('ProgramVisitTypesService: ', () => {
  const programsConfig = {
    'test-hiv-program-1-uuid': {
      name: 'A Test HIV program for women',
      dataDependencies: ['patient'],
      enrollmentOptions: {
        requiredProgramQuestions: [],
        enrollIf: "gender === 'F'"
      },
      visitTypes: [
        {
          uuid: 'visit-type-1-uuid',
          name: 'Visit Type 1',
          encounterTypes: [] // no rules
        },
        {
          uuid: 'visit-type-2-uuid',
          name: 'Visit Type 2 for adults',
          encounterTypes: [], // has a rule
          allowedIf: 'age > 18',
          ruleExplanation: 'Should be older than 18 years'
        },
        {
          uuid: 'visit-type-3-uuid',
          name: 'Visit Type 3 for youth',
          encounterTypes: [], // has a rule
          allowedIf: 'age < 18',
          ruleExplanation: 'Should be younger than 18 years'
        }
      ]
    }
  };

  test('fetches and returns both allowed and disallowed visit types for a patient', async () => {
    const payload = {
      patientUuid: 'test-patient_uuid',
      programUuid: 'test-hiv-program-1-uuid',
      programEnrollmentUuid: 'test-enrollment-uuid',
      intendedVisitLocationUuid: 'test-location-a-uuid',
      allProgramsConfig: programsConfig
    };

    mockGetAllDataDependencies.mockResolvedValue({
      patient: {
        uuid: 'some uuid',
        person: {
          age: 20
        }
      }
    });

    await ProgramVisitTypesService.getPatientVisitTypes(
      payload.patientUuid,
      payload.programUuid,
      payload.programEnrollmentUuid,
      payload.intendedVisitLocationUuid,
      payload.allProgramsConfig
    )
      .then((patientVisitTypes) => {
        expect(patientVisitTypes.visitTypes).toHaveProperty('allowed');
        expect(patientVisitTypes.visitTypes).toHaveProperty('disallowed');
        expect(patientVisitTypes.name).toEqual('A Test HIV program for women');
        expect(patientVisitTypes.visitTypes.allowed).not.toContain({
          name: /visit type 3 for youth/i
        });
        expect(patientVisitTypes.visitTypes.disallowed).toMatchObject([
          {
            name: /visit type 3 for youth/i
          }
        ]);
      })
      .catch((err) => {
        expect(err).not.toBeDefined();
      });
  });

  test('throws an error if there is a problem getting visit types data', async () => {
    const message = 'TEST_ERROR_MESSAGE';
    const payload = {
      patientUuid: 'test-patient-uuid',
      programUuid: 'test-hiv-program-1-uuid',
      programEnrollmentUuid: 'test-enrollment-uuid',
      intendedVisitLocationUuid: 'test-location-a-uuid',
      allProgramsConfig: programsConfig
    };

    mockGetAllDataDependencies.mockRejectedValue({ message });

    await ProgramVisitTypesService.getPatientVisitTypes(
      payload.patientUuid,
      payload.programUuid,
      payload.programEnrollmentUuid,
      payload.intendedVisitLocationUuid,
      payload.allProgramsConfig
    )
      .then((patientVisitTypes) => {
        epxect(patientVisitTypes).not.toBeDefined();
      })
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(/error resolving data dependencies/i);
      });
  });

  test('determines whether a given visit type is allowed for a patient', () => {
    const scope = {
      enrollmentLocationUuid: 'test-location-a-uuid',
      intendedLocationOfVisitUuid: 'test-location-a-uuid'
    };

    const visitType = {
      uuid: 'visit-type-a-uuid',
      name: 'An A-Type test visit',
      encounterTypes: [],
      allowedIf: 'enrollmentLocationUuid === intendedLocationOfVisitUuid'
    };

    expect(
      ProgramVisitTypesService.isVisitTypeAllowed(scope, visitType)
    ).toBeTruthy();

    scope.intendedLocationOfVisitUuid = 'test-location-b-uuid';
    expect(
      ProgramVisitTypesService.isVisitTypeAllowed(scope, visitType)
    ).toBeFalsy();
  });

  test('separates allowed and disallowed visit types', () => {
    const scope = {
      enrollmentLocationUuid: 'some location uuid',
      intendedLocationOfVisitUuid: 'some location uuid'
    };

    const programsConfig = {
      visitTypes: [
        {
          uuid: 'visit-type-a-uuid',
          name: 'An A-Type test visit',
          encounterTypes: [],
          allowedIf: 'enrollmentLocationUuid === intendedLocationOfVisitUuid'
        },
        {
          uuid: 'visit-type-b-uuid',
          name: 'A B-Type test visit',
          encounterTypes: [],
          allowedIf: 'enrollmentLocationUuid !== intendedLocationOfVisitUuid'
        }
      ]
    };

    const expected = {
      allowed: [programsConfig.visitTypes[0]],
      disallowed: [programsConfig.visitTypes[1]]
    };

    const actual = ProgramVisitTypesService.separateAllowedDisallowedVisitTypes(
      scope,
      programsConfig.visitTypes
    );

    expect(actual).toEqual(expected);
  });
});
