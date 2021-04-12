const PatientProgramBaseService = require('../../programs/patient-program-base.service');
const {
  validateEnrollmentOptions
} = require('../../programs/program-enrollment.service');

const mockValidateEnrollmentOptions = validateEnrollmentOptions;

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

const testValidatedEnrollments = {};

jest.mock('../../programs/program-enrollment.service', () => ({
  ...jest.requireActual,
  validateEnrollmentOptions: jest.fn()
}));

describe('PatientProgramBaseService: ', () => {
  test('returns the programs config', () => {
    const programsConfig = PatientProgramBaseService.getAllProgramsConfig();
    expect(programsConfig).toMatchObject({
      '781d85b0-1359-11df-a1f1-0026b9348838': {
        name: 'Standard HIV TREATMENT'
      }
    });
  });

  test("validates a patient's enrollment options", async () => {
    mockValidateEnrollmentOptions.mockResolvedValue({});

    const validatedEnrollments = await PatientProgramBaseService.validateEnrollmentOptions(
      testPatient
    );

    expect(validatedEnrollments).toEqual(testValidatedEnrollments);
  });
});
