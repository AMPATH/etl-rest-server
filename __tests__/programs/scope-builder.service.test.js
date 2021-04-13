const ScopeBuilderService = require('../../programs/scope-builder.service');

const dataDictionary = {
  patient: {
    person: {
      age: 20,
      gender: 'F'
    }
  },
  intendedVisitLocationUuid: 'location-uuid',
  enrollment: {
    uuid: 'some uuid',
    program: {
      uuid: 'some program'
    },
    location: {
      uuid: 'some location uuid'
    }
  },
  patientEnrollment: [
    {
      uuid: 'test-hiv-program-enrollment-uuid',
      display: 'YET ANOTHER TEST HIV PROGRAM',
      voided: false,
      dateEnrolled: '2021-04-13T00:00:00.000+0300',
      dateCompleted: null,
      location: {
        uuid: 'test-location-uuid',
        display: 'Test Location',
        name: 'Test Location'
      },
      program: {
        uuid: 'test-hiv-program-uuid'
      }
    }
  ]
};

describe('ScopeBuilderService: ', () => {
  test('builds and returns a scope object from the provided data dictionary', () => {
    const expectedScopeObject = {
      age: 20,
      gender: 'F',
      intendedVisitLocationUuid: 'location-uuid',
      isEnrolledInViremiaPMTCT: false,
      programLocation: 'some location uuid'
    };

    const builtScopeObj = ScopeBuilderService.buildScope(dataDictionary);
    expect(builtScopeObj).toEqual(expectedScopeObject);
  });

  test('adds HIV scope for clients with HIV encounters', () => {
    dataDictionary.hivLastTenClinicalEncounters = [];
    dataDictionary.patientEncounters = [];

    let builtScopeObj = ScopeBuilderService.buildScope(dataDictionary);
    expect(builtScopeObj.isFirstPrEPVisit).toBeTruthy();
    expect(builtScopeObj.isFirstPMTCTVisit).toBeTruthy();
    expect(builtScopeObj.isFirstPEPVisit).toBeTruthy();
    expect(builtScopeObj.isFirstAMPATHHIVVisit).toBeTruthy();

    dataDictionary.hivLastEncounter = {
      uuid: 'test-hiv-encounter-uuid',
      encounter_id: 12345678910,
      form_id: 1111,
      encounter_datetime: '2020-09-18 14:31:46',
      person_id: 1234567890,
      months_from_last_visit: 7,
      location_id: 195
    };

    dataDictionary.hivLastTenClinicalEncounters = [
      {
        uuid: 'initial-pep-encounter',
        encounterType: {
          uuid: 'c3a78744-f94a-4a25-ac9d-1c48df887895'
        },
        encounterDatetime: '2021-03-17T10:46:28.000+0300',
        location_uuid: 'Test Location'
      },
      {
        uuid: 'viremia-encounter',
        encounterType: {
          uuid: 'c4246ff0-b081-460c-bcc5-b0678012659e'
        },
        encounterDatetime: '2021-08-07T09:17:44.000+0300'
      }
    ];
    dataDictionary.patientEncounters = [
      {
        uuid: 'initial-pep-encounter',
        encounterType: {
          uuid: 'c3a78744-f94a-4a25-ac9d-1c48df887895'
        },
        encounterDatetime: '2021-03-17T10:46:28.000+0300',
        location_uuid: 'Test Location'
      }
    ];

    builtScopeObj = ScopeBuilderService.buildScope(dataDictionary);
    expect(builtScopeObj.isFirstPrEPVisit).toBeTruthy();
    expect(builtScopeObj.isFirstPMTCTVisit).toBeTruthy();
    expect(builtScopeObj.isFirstPEPVisit).toBeFalsy();
    expect(builtScopeObj.isFirstAMPATHHIVVisit).toBeFalsy();
    expect(builtScopeObj.previousHIVClinicallocation).toMatch(/test location/i);
    expect(builtScopeObj.isEnrolledInViremiaPMTCT).toBeFalsy();
    expect(builtScopeObj.qualifiesForStandardVisit).toBeTruthy();
  });

  test('adds Oncology scope for clients with Oncology encounters', () => {
    dataDictionary.programUuid = '88566621-828f-4569-9af5-c54f8237750a'; // Breast treatment program
    dataDictionary.patientEncounters = [
      {
        uuid: 'cervical-cancer-screening-encounter',
        encounterType: {
          uuid: '238625fc-8a25-44b2-aa5a-8bf48fa0e18d'
        },
        encounterDatetime: '2021-02-18T10:18:24.000+0300',
        location_uuid: 'Test Location A'
      }
    ];

    let builtScopeObj = ScopeBuilderService.buildScope(dataDictionary);
    expect(builtScopeObj.isFirstOncologyVisit).toBeTruthy();

    dataDictionary.patientEncounters = [
      {
        uuid: 'breast-cancer-initial-encounter',
        encounterType: {
          uuid: '9ad5292c-14c3-489b-9c14-5f816e839691'
        },
        encounterDatetime: '2021-10-08T08:20:03.000+0300',
        location_uuid: 'Test Location B'
      }
    ];

    builtScopeObj = ScopeBuilderService.buildScope(dataDictionary);
    expect(builtScopeObj.isFirstOncologyVisit).toBeFalsy();
  });
});
