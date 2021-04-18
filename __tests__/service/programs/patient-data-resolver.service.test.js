const PatientDataResolverService = require('../../../programs/patient-data-resolver.service');
const {
  getPatientEncounters
} = require('../../../service/openmrs-rest/encounter');
const {
  getPatientByUuid
} = require('../../../service/openmrs-rest/patient.service');
const {
  getProgramEnrollmentByUuid
} = require('../../../service/openmrs-rest/program.service');
const {
  getPatientHivSummary,
  getPatientLastEncounter
} = require('../../../dao/patient/etl-patient-hiv-summary-dao');

const mockGetPatientByUuid = getPatientByUuid;
const mockGetPatientEncounters = getPatientEncounters;
const mockGetPatientHivSummary = getPatientHivSummary;
const mockGetPatientLastEncounter = getPatientLastEncounter;
const mockGetProgramEnrollmentByUuid = getProgramEnrollmentByUuid;

jest.mock('../../../service/openmrs-rest/patient.service', () => ({
  ...jest.requireActual,
  getPatientByUuid: jest.fn()
}));

jest.mock('../../../service/openmrs-rest/program.service', () => ({
  ...jest.requireActual,
  getProgramEnrollmentByUuid: jest.fn()
}));

jest.mock('../../../service/openmrs-rest/encounter', () => ({
  ...jest.requireActual,
  getPatientEncounters: jest.fn()
}));

jest.mock('../../../dao/patient/etl-patient-hiv-summary-dao', () => ({
  ...jest.requireActual,
  getPatientHivSummary: jest.fn(),
  getPatientLastEncounter: jest.fn()
}));

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

const testProgramEnrollment = {
  uuid: 'test-program-enrollment-uuid',
  display: 'Test Program Enrollment',
  voided: false,
  dateEnrolled: '2021-04-12T00:00:00.000+0300',
  dateCompleted: null,
  location: {
    uuid: 'test-program-location',
    display: 'Test Location',
    name: 'Test Location'
  },
  program: {
    uuid: 'test-program-uuid'
  }
};

const testPatientEncounters = {
  results: {
    encounterDatetime: '2021-04-12T00:00:00.000+0300',
    encounterType: {
      uuid: 'test-encounter-uuid',
      display: 'Test Encounter'
    }
  }
};

const testDataDependenciesKeys = [
  'patient',
  'enrollment',
  'hivLastTenClinicalEncounters'
];

const testHivSummary = [];

const testLatestEncounter = [
  {
    encounter_id: 123456789,
    encounter_type: 2,
    patient_id: 123456789,
    location_id: 195,
    form_id: 1106,
    encounter_datetime: '2019-01-24 14:31:46',
    date_created: '2019-01-24 14:33:16',
    uuid: 'test-latest-encounter-uuid',
    changed_by: null,
    date_changed: null,
    visit_id: 1147878,
    person_id: 834970,
    gender: 'F',
    birthdate: '2000-04-01',
    dead: 0,
    visit_type_id: 59,
    date_started: '2019-01-24 14:28:11',
    date_stopped: null,
    indication_concept_id: null,
    months_from_last_visit: 0
  }
];

describe('PatientDataResolverService: ', () => {
  const params = {};

  test("resolves and returns the program's data dependencies", async () => {
    mockGetPatientByUuid.mockResolvedValue(testPatient);
    mockGetProgramEnrollmentByUuid.mockResolvedValue(testProgramEnrollment);
    mockGetPatientHivSummary.mockResolvedValue({
      result: testHivSummary
    });

    await PatientDataResolverService.getAllDataDependencies(
      testDataDependenciesKeys,
      testPatient.uuid,
      {}
    )
      .then((dataDependencies) => {
        expect(dataDependencies).toMatchObject({
          patient: testPatient,
          enrollment: testProgramEnrollment,
          hivLastTenClinicalEncounters: testHivSummary
        });
      })
      .catch((err) => {
        expect(err).not.toBeDefined();
      });
  });

  test('fetches and returns a patient given their uuid', async () => {
    mockGetPatientByUuid.mockResolvedValue(testPatient);

    await PatientDataResolverService.getPatient(testPatient.uuid, params)
      .then((patient) => expect(patient).toEqual(testPatient))
      .catch((err) => expect(err).not.toBeDefined());
  });

  test('throws an error if there is a problem fetching a patient', async () => {
    const error = new Error('Error establishing a database connection');

    mockGetPatientByUuid.mockRejectedValue(error);

    await PatientDataResolverService.getPatient(testPatient.uuid, params)
      .then((patient) => expect(patient).not.toBeDefined())
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(
          /error establishing a database connection/i
        );
      });
  });

  test("fetches and returns a patient's program enrollments", async () => {
    mockGetProgramEnrollmentByUuid.mockResolvedValue(testProgramEnrollment);

    await PatientDataResolverService.getProgramEnrollment(
      testPatient.uuid,
      params
    )
      .then((enrollment) => expect(enrollment).toEqual(testProgramEnrollment))
      .catch((err) => {
        expect(err).not.toBeDefined();
      });
  });

  test('throws an error if there is a problem fetching program enrollments', async () => {
    const error = new Error('Error establishing a database connection');

    mockGetProgramEnrollmentByUuid.mockRejectedValue(error);

    await PatientDataResolverService.getProgramEnrollment(
      testPatient.uuid,
      params
    )
      .then((enrollment) => expect(enrollment).not.toBeDefined())
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(
          /error establishing a database connection/i
        );
      });
  });

  test('fetches and returns patient encounters', async () => {
    mockGetPatientEncounters.mockResolvedValue(testPatientEncounters);

    await PatientDataResolverService.getPatientEncounters(
      testPatient.uuid,
      params
    )
      .then((encounters) => expect(encounters).toEqual(testPatientEncounters))
      .catch((err) => {
        expect(err).not.toBeDefined();
      });
  });

  test('throws an error if there is a problem fetching patient encounters', async () => {
    const error = new Error('Error establishing a database connection');

    mockGetPatientEncounters.mockRejectedValue(error);

    await PatientDataResolverService.getPatientEncounters(
      testPatient.uuid,
      params
    )
      .then((encounters) => expect(encounters).not.toBeDefined())
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(
          /error establishing a database connection/i
        );
      });
  });

  test("fetches and returns the patient's last ten HIV clinical encounters", async () => {
    mockGetPatientHivSummary.mockResolvedValue({
      result: testHivSummary
    });

    await PatientDataResolverService.gethivLastTenClinicalEncounters(
      testPatient.uuid,
      {}
    )
      .then((hivSummary) => expect(hivSummary).toEqual(testHivSummary))
      .catch((err) => expect(err).not.toBeDefined());
  });

  test("throws an error if there is a problem fetching the patient's last ten HIV clinical encounters", async () => {
    const error = new Error('Error establishing a database connection');

    mockGetPatientHivSummary.mockRejectedValue(error);

    await PatientDataResolverService.gethivLastTenClinicalEncounters(
      testPatient.uuid,
      {}
    )
      .then((hivSummary) => expect(hivSummary).not.toBeDefined())
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(
          /error establishing a database connection/i
        );
      });
  });

  test("fetches and returns the patient's latest encounter", async () => {
    mockGetPatientLastEncounter.mockResolvedValue({
      result: [testLatestEncounter]
    });

    await PatientDataResolverService.getPatientLastEncounter(
      testPatient.uuid,
      params
    )
      .then((latestEncounter) => {
        expect(latestEncounter).toEqual(testLatestEncounter);
      })
      .catch((err) => expect(err).not.toBeDefined());
  });

  test("throws an error if there is a problem fetching the patient's latest encounter", async () => {
    const error = new Error('Error establishing a database connection');

    mockGetPatientLastEncounter.mockRejectedValue(error);

    await PatientDataResolverService.getPatientLastEncounter(
      testPatient.uuid,
      {}
    )
      .then((hivSummary) => expect(hivSummary).not.toBeDefined())
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(
          /error establishing a database connection/i
        );
      });
  });
});
