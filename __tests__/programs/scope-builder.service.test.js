const ScopeBuilder = require('../../programs/scope-builder.service');

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
  }
};

describe('ScopeBuilderService', () => {
  test('builds and returns a scope object from the provided data dictionary', () => {
    const expectedScopeObject = {
      age: 20,
      gender: 'F',
      intendedVisitLocationUuid: 'location-uuid',
      programLocation: 'some location uuid'
    };

    const builtScopeObj = ScopeBuilder.buildScope(dataDictionary);
    expect(builtScopeObj).toEqual(expectedScopeObject);
  });

  test('adds HIV scope for clients with HIV encounters', () => {
    dataDictionary.hivLastTenClinicalEncounters = [];
    dataDictionary.patientEncounters = [];

    let builtScopeObj = ScopeBuilder.buildScope(dataDictionary);
    expect(builtScopeObj.isFirstPrEPVisit).toBeTruthy();
    expect(builtScopeObj.isFirstPMTCTVisit).toBeTruthy();
    expect(builtScopeObj.isFirstPEPVisit).toBeTruthy();
    expect(builtScopeObj.isFirstAMPATHHIVVisit).toBeTruthy();

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

    builtScopeObj = ScopeBuilder.buildScope(dataDictionary);
    expect(builtScopeObj.isFirstPrEPVisit).toBeTruthy();
    expect(builtScopeObj.isFirstPMTCTVisit).toBeTruthy();
    expect(builtScopeObj.isFirstPEPVisit).toBeFalsy();
    expect(builtScopeObj.isFirstAMPATHHIVVisit).toBeFalsy();
    expect(builtScopeObj.previousHIVClinicallocation).toMatch(/test location/i);
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

    let builtScopeObj = ScopeBuilder.buildScope(dataDictionary);
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

    builtScopeObj = ScopeBuilder.buildScope(dataDictionary);
    expect(builtScopeObj.isFirstOncologyVisit).toBeFalsy();
  });
});
