const ProgramEnrollmentService = require('../../programs/program-enrollment.service');

const {
  getAllDataDependencies
} = require('../../programs/patient-data-resolver.service');

const mockGetAllDataDependencies = getAllDataDependencies;

jest.mock(
  '../../programs/patient-program-config.json',
  () => ({
    ...testProgramsConfig
  }),
  { virtual: true }
);

jest.mock('../../programs/patient-data-resolver.service', () => ({
  ...jest.requireActual,
  getAllDataDependencies: jest.fn()
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

const testDataDependencies = {
  patient: {
    uuid: 'test-patient-uuid',
    display: '10000000098765 - Yet Another Test Patient',
    identifiers: [],
    person: {
      uuid: 'test-patient',
      display: 'Yet Another Test Patient',
      gender: 'F',
      age: 51
    }
  },
  enrollment: {},
  hivLastTenClinicalEncounters: []
};

describe('ProgramEnrollmentService: ', () => {
  test('validates an enrollment from the provided program config', async () => {
    mockGetAllDataDependencies.mockResolvedValue(testDataDependencies);

    await ProgramEnrollmentService.validateEnrollmentOptions(
      'test-patient-uuid',
      testProgramsConfig
    )
      .then((validatedEnrollment) => {
        expect(validatedEnrollment['test-hiv-program-1-uuid']).toHaveProperty(
          'enrollmentAllowed'
        );
        expect(
          validatedEnrollment['test-hiv-program-1-uuid'].enrollmentAllowed
        ).toBeTruthy();
      })
      .catch((err) => {
        expect(err).not.toBeDefined();
      });
  });
});
