const requestConfig = require('../../../request-config');
const {
  getPatientEncounters,
  getEncountersByEncounterType
} = require('../../../service/openmrs-rest/encounter');

describe('EncounterService: ', () => {
  const testEncounters = {
    results: [
      {
        uuid: 'test-adult-initial-encounter-uuid',
        encounterDatetime: '2016-09-12T00:00:00.000+0300',
        form: {
          uuid: 'test-adult-initial-encounter-uuid',
          name: 'Adult Initial Visit form'
        },
        encounterType: {
          display: 'ADULTINITIAL'
        },
        obs: []
      },
      {
        uuid: 'test-adult-return-encounter-uuid',
        encounterDatetime: '2016-09-26T00:00:00.000+0300',
        form: {
          uuid: 'test-adult-return-encounter-uuid',
          name: 'Adult Return Visit form'
        },
        encounterType: {
          display: 'ADULTRETURN'
        },
        obs: []
      }
    ]
  };

  test('throws an error if getPatientEncounters is not called with sufficient arguments', () => {
    jest
      .spyOn(requestConfig, 'getRequestPromise')
      .mockResolvedValue(testEncounters);

    try {
      getPatientEncounters();
    } catch (err) {
      expect(err.message).toMatch(/at least one argument should be passed/i);
    }
  });

  test('throws an error if getPatientEncounters is not called with the either a uuid or a param map', () => {
    jest
      .spyOn(requestConfig, 'getRequestPromise')
      .mockResolvedValue(testEncounters);

    try {
      getPatientEncounters(['an invalid argument']);
    } catch (err) {
      expect(err.message).toMatch(
        /function requires a string uuid or a parameter map passed/i
      );
    }
  });

  test('fetches and returns a list of patient encounters', async () => {
    jest
      .spyOn(requestConfig, 'getRequestPromise')
      .mockResolvedValue(testEncounters);

    await getPatientEncounters('test-patient-a-uuid')
      .then((encounters) => {
        expect(encounters).toBeDefined();
        expect(encounters).toEqual(testEncounters.results);
      })
      .catch((err) => {
        expect(err).not.toBeDefined();
      });
  });

  test(`throws an error if there was a problem fetching the patient's encounters`, async () => {
    const error = new Error('Error 403: Forbidden');

    jest.spyOn(requestConfig, 'getRequestPromise').mockRejectedValue(error);

    await getPatientEncounters('test-patient-a-uuid')
      .then((encounters) => {
        expect(encounters).not.toBeDefined();
      })
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(/error 403: forbidden/i);
      });
  });

  test('fetches and returns a list of patient encounters scoped by encounter type', async () => {
    const testAdultReturnEncounters = {
      uuid: 'test-adult-initial-encounter-uuid',
      encounterDatetime: '2016-09-12T00:00:00.000+0300',
      display: 'ADULTRETURN 26/09/2016',
      patient: {
        uuid: 'test-patient-a-uuid',
        display: '123456789-Test - Test Patient A'
      },
      location: {
        uuid: 'test-location-a-uuid',
        display: 'Test Location A'
      },
      form: {
        uuid: 'test-adult-return-encounter-uuid',
        name: 'Adult Return Visit form'
      },
      encounterType: {
        display: 'ADULTRETURN'
      },
      obs: []
    };

    jest
      .spyOn(requestConfig, 'getRequestPromise')
      .mockResolvedValue(testAdultReturnEncounters);

    await getEncountersByEncounterType(
      'test-patient-a-uuid',
      'test-adult-return-encounter-type'
    )
      .then((scopedEncounters) => {
        expect(scopedEncounters).toBeDefined();
        expect(scopedEncounters).toEqual(testAdultReturnEncounters);
      })
      .catch((err) => {
        expect(err).not.toBeDefined();
      });
  });

  test(`throws an error if there was a problem fetching the patient's scoped encounters`, async () => {
    const error = new Error('Error 403: Forbidden');

    jest.spyOn(requestConfig, 'getRequestPromise').mockRejectedValue(error);

    await getEncountersByEncounterType(
      'test-patient-a-uuid',
      'test-adult-return-encounter-type'
    )
      .then((encounters) => {
        expect(encounters).not.toBeDefined();
      })
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(/error 403: forbidden/i);
      });
  });
});
