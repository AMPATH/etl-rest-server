import {
  checkStatusOfViralLoad,
  convertViralLoadPayloadToRestConsumableObs
} from '../../../eid-rest-formatter';
import * as ObsService from '../../../service/openmrs-rest/obs.service';
const config = require('../../../conf/config.json');
const requestConfig = require('../../../request-config');

const mockCheckStatusOfViralLoad = checkStatusOfViralLoad;
const mockConvertViralLoadPayloadToRestConsumableObs = convertViralLoadPayloadToRestConsumableObs;

jest.mock(
  '../../../conf/config.json',
  () => ({
    ...testConfig
  }),
  { virtual: true }
);

jest.mock('../../../etl-db', () => ({}));

jest.mock('../../../etl-factory', () => ({}));

jest.mock('../../../eid-rest-formatter', () => ({
  checkStatusOfViralLoad: jest.fn(),
  convertViralLoadPayloadToRestConsumableObs: jest.fn()
}));

const testConfig = {
  openmrs: {
    host: '192.1.168.0',
    applicationName: 'test-amrs',
    port: 8080,
    https: false
  }
};

describe('ObsService: ', () => {
  const testViralLoadObs = {
    results: [
      {
        uuid: 'test-viral-load-first-set-obs-uuid',
        display: 'HIV VIRAL LOAD, QUANTITATIVE: 0.0',
        concept: {
          uuid: 'test-viral-load-obs-uuid',
          display: 'HIV VIRAL LOAD, QUANTITATIVE',
          dataType: {
            display: 'numeric'
          }
        },
        obsDatetime: '2021-01-12T00:00:00.000+0300',
        value: 0.0,
        auditInfo: {
          creator: {
            uuid: 'test-provider-uuid',
            display: 'Test Provider'
          },
          dateCreated: '2021-01-18T20:20:17.000+0300',
          changedBy: null,
          dateChanged: null
        }
      },
      {
        uuid: 'test-viral-load-second-set-obs-uuid',
        display: 'HIV VIRAL LOAD, QUANTITATIVE: 0.0',
        concept: {
          uuid: 'test-viral-load-obs-uuid',
          display: 'HIV VIRAL LOAD, QUANTITATIVE',
          dataType: {
            display: 'numeric'
          }
        },
        obsDatetime: '2020-06-29T00:00:00.000+0300',
        value: 0.0,
        auditInfo: {
          creator: {
            uuid: 'test-other-provider-uuid',
            display: 'Test Other Provider'
          },
          dateCreated: '2020-08-09T22:17:31.000+0300',
          changedBy: null,
          dateChanged: null
        }
      }
    ]
  };

  const testObsPayload = {
    viralLoad: [
      {
        person: 'test-patient-a-uuid',
        concept: 'test-viral-load-obs-uuid',
        obsDatetime: '2021-02-12T20:20:17.000+0300',
        value: 0.0,
        FinalResult: 'POSITIVE'
      }
    ],
    cd4Panel: [],
    pcr: []
  };

  test('constructs and returns a URL to the OpenMRS REST resource from the given path', () => {
    const testPath =
      '/' +
      config.openmrs.applicationName +
      '/prefix/rest/v1/patient/' +
      'test-patient-uuid';

    const expectedUrl =
      'http://192.1.168.0:8080/test-amrs/prefix/rest/v1/patient/test-patient-uuid';

    const url = ObsService.getRestResource(testPath);
    expect(url).toEqual(expectedUrl);
  });

  test('fetches and returns a list of patient identifiers scoped by the given patient uuid', async () => {
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

    const requestSpy = jest.spyOn(requestConfig, 'getRequestPromise');
    requestSpy.mockResolvedValueOnce(testPatient);

    await ObsService.getPatientIdentifiers('test-patient-uuid')
      .then((identifiers) => {
        expect(identifiers.identifiers.length).toBeGreaterThan(0);
        expect(identifiers.identifiers).toContain('12345test-6');
        expect(identifiers.identifiers).toContain('12345 test-6');
        expect(requestSpy).toHaveBeenCalledTimes(1);
        expect(requestSpy).toHaveBeenCalledWith(
          { v: 'full' },
          'http://192.1.168.0:8080/test-amrs/ws/rest/v1/patient/test-patient-uuid'
        );
      })
      .catch((err) => expect(err).not.toBeDefined());
  });

  test('throws an error if there is a problem fetching patient identifiers', async () => {
    const error = new Error('403: Forbidden');

    const requestSpy = jest.spyOn(requestConfig, 'getRequestPromise');
    requestSpy.mockRejectedValueOnce(error);

    await ObsService.getPatientIdentifiers('test-patient-uuid')
      .then((identifiers) => expect(identifiers).not.toBeDefined())
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(/403: forbidden/i);
      });
  });

  test('fetches and returns a list of patient observations scoped by patient uuid', async () => {
    const requestSpy = jest.spyOn(requestConfig, 'getRequestPromise');
    requestSpy.mockResolvedValueOnce(testViralLoadObs);

    await ObsService.getPatientTestObsByConceptUuid(
      'test-viral-load-concept-uuid',
      'test-patient-a-uuid'
    )
      .then((obs) => {
        expect(obs).toBeDefined();
        expect(obs).toEqual(testViralLoadObs.results);
      })
      .catch((err) => expect(err).not.toBeDefined());
  });

  test('throws an error if there is a problem fetching patient observations', async () => {
    const error = new Error('403: Forbidden');
    const requestSpy = jest.spyOn(requestConfig, 'getRequestPromise');
    requestSpy.mockRejectedValueOnce(error);

    await ObsService.getPatientTestObsByConceptUuid(
      'test-viral-load-concept-uuid',
      'test-patient-a-uuid'
    )
      .then((obs) => {
        expect(obs).not.toBeDefined();
      })
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(/403: forbidden/i);
      });
  });

  test(`fetches and returns a list of the patient's lab test observations scoped by the given patient uuid`, async () => {
    const requestSpy = jest.spyOn(requestConfig, 'getRequestPromise');
    requestSpy.mockResolvedValue(testViralLoadObs);

    await ObsService.getPatientAllTestObsByPatientUuid('test-patient-a')
      .then((labTestObs) => {
        expect(labTestObs).toBeDefined();
        expect(labTestObs[0]).toMatchObject(
          expect.objectContaining(testViralLoadObs.results[0])
        );
      })
      .catch((err) => {
        expect(err).not.toBeDefined();
      });
  });

  test(`throws an error if there is a problem fetching the patient's lab test observations`, async () => {
    const error = new Error('403: Forbidden');
    const requestSpy = jest.spyOn(requestConfig, 'getRequestPromise');
    requestSpy.mockRejectedValue(error);

    await ObsService.getPatientAllTestObsByPatientUuid('test-patient-a')
      .then((labTestObs) => {
        expect(labTestObs).not.toBeDefined();
      })
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(/403: forbidden/i);
      });
  });

  test(`fetches and returns a list of the patient's observations that were recorded today`, async () => {
    const requestSpy = jest.spyOn(requestConfig, 'getRequestPromise');
    requestSpy.mockResolvedValueOnce(testViralLoadObs);

    await ObsService.getAmrsPatientObsByDate(
      'test-viral-load-concept-uuid',
      'test-patient-a-uuid'
    )
      .then((obs) => {
        expect(obs).toBeDefined();
        expect(obs.length).toEqual(0, 'no obs recorded today');
      })
      .catch((err) => expect(err).not.toBeDefined());
  });

  test(`throws an error if there is a problem fetching the patient observations that were recorded today`, async () => {
    const error = new Error('403: Forbidden');
    const requestSpy = jest.spyOn(requestConfig, 'getRequestPromise');
    requestSpy.mockRejectedValue(error);

    await ObsService.getAmrsPatientObsByDate('test-patient-a')
      .then((obs) => {
        expect(obs).not.toBeDefined();
      })
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(/403: forbidden/i);
      });
  });

  test(`fetches and returns a list of the patient's lab test observations that were recorded today`, async () => {
    const requestSpy = jest.spyOn(requestConfig, 'getRequestPromise');
    requestSpy.mockResolvedValue(testViralLoadObs);

    await ObsService.getPatientTodaysTestObsByPatientUuid(
      'test-viral-load-concept-uuid',
      'test-patient-a-uuid'
    )
      .then((obs) => {
        expect(obs).toBeDefined();
        expect(obs.length).toEqual(0, 'no obs recorded today');
      })
      .catch((err) => {
        expect(err).not.toBeDefined();
      });
  });

  test(`throws an error if there is a problem fetching the patient lab test observations that were recorded today`, async () => {
    const error = new Error('403: Forbidden');
    const requestSpy = jest.spyOn(requestConfig, 'getRequestPromise');
    requestSpy.mockRejectedValue(error);

    await ObsService.getPatientTodaysTestObsByPatientUuid('test-patient-a')
      .then((obs) => {
        expect(obs).not.toBeDefined();
      })
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(/403: forbidden/i);
      });
  });

  test('posts the recorded observations to the obs API endpoint', async () => {
    const testObsPayload = {
      person: 'test-patient-a-uuid',
      concept: 'test-viral-load-obs-uuid',
      obsDatetime: '2021-02-12T20:20:17.000+0300',
      value: 0.0
    };

    const expected = {
      uuid: 'test-new-viral-load-obs-uuid',
      display: 'HIV VIRAL LOAD, QUANTITATIVE: 0.0',
      concept: {
        uuid: 'test-viral-load-obs-uuid',
        display: 'HIV VIRAL LOAD, QUANTITATIVE',
        dataType: {
          display: 'numeric'
        }
      },
      obsDatetime: '2021-02-12T20:20:17.000+0300',
      value: 0.0,
      auditInfo: {
        creator: {
          uuid: 'test-provider-uuid',
          display: 'Test Provider'
        },
        dateCreated: '2021-02-12T20:20:17.000+0300',
        changedBy: null,
        dateChanged: null
      }
    };

    const requestSpy = jest.spyOn(requestConfig, 'postRequestPromise');
    requestSpy.mockResolvedValueOnce(expected);

    await ObsService.postObsToAMRS(testObsPayload)
      .then((response) => {
        expect(response).toBeDefined();
        expect(response).toEqual(expected);
        expect(requestSpy).toHaveBeenCalledTimes(1);
        expect(requestSpy).toHaveBeenCalledWith(
          testObsPayload,
          'http://192.1.168.0:8080/test-amrs/ws/rest/v1/obs'
        );
      })
      .catch((err) => expect(err).not.toBeDefined());
  });

  test('throws an error if there is a problem creating a new observation', async () => {
    const testObsPayload = {
      person: 'test-patient-a-uuid',
      concept: 'test-viral-load-obs-uuid',
      obsDatetime: '2021-02-12T20:20:17.000+0300',
      value: 0.0
    };

    const error = new Error('401: Unauthorized');

    const requestSpy = jest.spyOn(requestConfig, 'postRequestPromise');
    requestSpy.mockRejectedValueOnce(error);

    await ObsService.postObsToAMRS(testObsPayload)
      .then((response) => {
        expect(response).not.toBeDefined();
      })
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(/401: unauthorized/i);
      });
  });

  test('voids the observations matching the provided uuid', async () => {
    const obsToVoidUuid = 'test-viral-load-to-void-obs-uuid';

    const requestSpy = jest.spyOn(requestConfig, 'deleteRequestPromise');
    requestSpy.mockResolvedValue({});

    await ObsService.voidObs(obsToVoidUuid)
      .then((response) => {
        expect(response).toBeDefined();
        expect(response).toEqual({});
        expect(requestSpy).toHaveBeenCalledTimes(1);
        expect(requestSpy).toHaveBeenCalledWith(
          'http://192.1.168.0:8080/test-amrs/ws/rest/v1/obs/test-viral-load-to-void-obs-uuid'
        );
      })
      .catch((err) => {
        expect(err).not.toBeDefined();
      });
  });

  test('throws an error if there is a problem voiding an observations', async () => {
    const obsToVoidUuid = 'test-viral-load-to-void-obs-uuid';
    const error = new Error('401: Unauthorized');

    const requestSpy = jest.spyOn(requestConfig, 'deleteRequestPromise');
    requestSpy.mockRejectedValueOnce(error);

    await ObsService.voidObs(obsToVoidUuid)
      .then((response) => {
        expect(response).toBeDefined();
      })
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(/401: unauthorized/i);
      });
  });

  test('creates and returns a successful response when given a payload to post to the OpenMRS rest resource', async () => {
    const testConsumableObsPayload = {
      concept: 'a898fe80-1350-11df-a1f1-0026b9348838',
      person: 'test-patient-a-uuid',
      obsDatetime: '2021-02-12T20:20:17.000+0300',
      value: 'POSITIVE'
    };

    mockCheckStatusOfViralLoad.mockReturnValue(1);
    mockConvertViralLoadPayloadToRestConsumableObs.mockResolvedValue(
      testConsumableObsPayload
    );

    const expected = {
      uuid: 'test-new-viral-load-obs-uuid',
      display: 'HIV VIRAL LOAD, QUANTITATIVE: 0.0',
      concept: {
        uuid: 'test-viral-load-obs-uuid',
        display: 'HIV VIRAL LOAD, QUANTITATIVE',
        dataType: {
          display: 'numeric'
        }
      },
      obsDatetime: '2021-02-12T20:20:17.000+0300',
      value: 0.0,
      auditInfo: {
        creator: {
          uuid: 'test-provider-uuid',
          display: 'Test Provider'
        },
        dateCreated: '2021-02-12T20:20:17.000+0300',
        changedBy: null,
        dateChanged: null
      }
    };

    const requestSpy = jest.spyOn(requestConfig, 'postRequestPromise');
    requestSpy.mockResolvedValueOnce(expected);

    await ObsService.postAllObsToAMRS(testObsPayload, 'test-patient-a-uuid')
      .then((response) => {
        expect(response).toBeDefined();
        expect(response[0]).toEqual(expected);
        expect(requestSpy).toHaveBeenCalledWith(
          testConsumableObsPayload,
          'http://192.1.168.0:8080/test-amrs/ws/rest/v1/obs'
        );
      })
      .catch((err) => expect(err).not.toBeDefined());
  });

  test('throws an error if there is a problem creating observations from a given payload', async () => {
    const testConsumableObsPayload = {
      concept: 'a898fe80-1350-11df-a1f1-0026b9348838',
      person: 'test-patient-a-uuid',
      obsDatetime: '2021-02-12T20:20:17.000+0300',
      value: 'POSITIVE'
    };

    mockCheckStatusOfViralLoad.mockReturnValue(1);
    mockConvertViralLoadPayloadToRestConsumableObs.mockResolvedValue(
      testConsumableObsPayload
    );

    const error = new Error('401: Unauthorized');

    const requestSpy = jest.spyOn(requestConfig, 'postRequestPromise');
    requestSpy.mockRejectedValueOnce(error);

    await ObsService.postAllObsToAMRS(testObsPayload, 'test-patient-a-uuid')
      .then((response) => {
        expect(response).not.toBeDefined();
      })
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(/401: unauthorized/i);
      });
  });
});
