const PatientProgramBaseService = require('../../../programs/patient-program-base.service');
const {
  validateEnrollmentOptions
} = require('../../../programs/program-enrollment.service');
const {
  getPatientVisitTypes
} = require('../../../programs/program-visit-types.service');

const mockValidateEnrollmentOptions = validateEnrollmentOptions;
const mockGetPatientVisitTypes = getPatientVisitTypes;

jest.mock(
  '../../../programs/patient-program-config.json',
  () => ({
    ...testProgramsConfig
  }),
  { virtual: true }
);

jest.mock('../../../programs/program-enrollment.service', () => ({
  ...jest.requireActual,
  validateEnrollmentOptions: jest.fn()
}));

jest.mock('../../../programs/program-visit-types.service', () => ({
  ...jest.requireActual,
  getPatientVisitTypes: jest.fn()
}));

const testProgramsConfig = {
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

const validatedTestProgramsConfig = {
  'test-hiv-program-1-uuid': {
    name: 'A Test HIV Program for women',
    dataDependencies: ['patient', 'enrollment', 'hivLastTenClinicalEncounters'],
    enrollmentOptions: {
      requiredProgramQuestions: [],
      enrollIf: "gender === 'F'"
    },
    visitTypes: [
      {
        uuid: 'test-initial-visit-type',
        name: 'Test Initial Visit',
        allowedIf: 'age > 18'
      }
    ],
    enrollmentAllowed: true
  }
};

const testPatient = {
  uuid: 'test-patient-uuid',
  display: '012345 - Yet Another Test Patient',
  identifiers: [
    {
      display: 'Test Identifier - 987654321-0',
      uuid: 'test-identifier-uuid',
      identifier: '0123456789-0'
    }
  ],
  person: {
    uuid: 'person-uuid',
    display: 'Yet Another Test Patient',
    gender: 'M',
    age: '28'
  }
};

const testPatientVisitTypes = {
  name: 'Test Program A',
  dataDependencies: ['patient'],
  visitTypes: {
    allowed: [
      {
        uuid: 'visit-type-1-uuid',
        name: 'Visit Type 1',
        encounterTypes: []
      },
      {
        uuid: 'visit-type-2-uuid',
        name: 'Visit Type 2 for adults',
        encounterTypes: [],
        allowedIf: 'age > 18',
        ruleExplanation: 'Should be older than 18 years'
      }
    ],
    disallowed: [
      {
        uuid: 'visit-type-3-uuid',
        name: 'Visit Type 3 for youth',
        encounterTypes: [],
        allowedIf: 'age < 18',
        ruleExplanation: 'Should be younger than 18 years'
      }
    ]
  }
};

describe('PatientProgramBaseService: ', () => {
  test('returns the patient program config', () => {
    const programsConfig = PatientProgramBaseService.getAllProgramsConfig();
    expect(programsConfig).toEqual(testProgramsConfig);
  });

  test("validates a patient's enrollment options from the patient program config", async () => {
    mockValidateEnrollmentOptions.mockResolvedValue(
      validatedTestProgramsConfig
    );

    await PatientProgramBaseService.validateEnrollmentOptions(testPatient)
      .then((programConfig) => {
        expect(programConfig['test-hiv-program-1-uuid']).toHaveProperty(
          'enrollmentAllowed'
        );
        expect(
          programConfig['test-hiv-program-1-uuid'].enrollmentAllowed
        ).toBeTruthy();
      })
      .catch((err) => {
        expect(err).not.toBeDefined();
      });
  });

  test('returns the available visit types from the patient program config', async () => {
    mockGetPatientVisitTypes.mockResolvedValue(testPatientVisitTypes);

    await PatientProgramBaseService.getPatientProgramEnrollmentVisits()
      .then((visitTypes) => {
        expect(visitTypes).toBeDefined();
        expect(visitTypes).toEqual(testPatientVisitTypes);
      })
      .catch((err) => {
        expect(err).not.toBeDefined();
      });
  });

  test('returns the resolved program enrollment visit types', async () => {
    mockGetPatientVisitTypes.mockResolvedValue(testPatientVisitTypes);

    await PatientProgramBaseService.getPatientProgramVisits()
      .then((visitTypes) => {
        expect(visitTypes).toBeDefined();
        expect(visitTypes).toEqual(testPatientVisitTypes);
      })
      .catch((err) => {
        expect(err).not.toBeDefined();
      });
  });

  test('throws an error if there is a problem resolving program enrollment visit types', async () => {
    const error = new Error('Error establishing a database connection');

    mockGetPatientVisitTypes.mockRejectedValue(error);

    await PatientProgramBaseService.getPatientProgramVisits()
      .then((visitTypes) => {
        expect(visitTypes).not.toBeDefined();
      })
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(
          /error establishing a database connection/i
        );
      });
  });
});
