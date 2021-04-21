import { LabClient } from '../../../app/lab-integration/utils/lab-client';
import * as EidLabReminderService from '../../../service/eid/eid-lab-reminder.service';
import { getPatientIdentifiers } from '../../../service/openmrs-rest/obs.service';
const config = require('../../../conf/config.json');

const mockGetPatientIdentifiers = getPatientIdentifiers;

jest.mock(
  '../../../conf/config.json',
  () => ({
    ...testConfig
  }),
  { virtual: true }
);

jest.mock('../../../service/openmrs-rest/obs.service', () => ({
  getPatientIdentifiers: jest.fn()
}));

jest.mock('../../../etl-db', () => ({}));

jest.mock('../../../service/eid/eid.service', () => ({}));

const testConfig = {
  hivLabSystem: {
    server1: {
      serverUrl: 'https://test-server1.lab-system.org',
      apiKey: 'test-server1-api-key'
    },
    server2: {
      serverUrl: 'https://test-server2.lab-system.org',
      apiKey: 'test-server2-api-key'
    }
  }
};

describe('EidLabReminderService: ', () => {
  const testIdentifiers = {
    identifiers: ['12345test-6', '12345 test-6']
  };

  const testPendingViralLoadResults = {
    current_page: 1,
    data: [
      {
        id: 12345678910,
        order_number: 'ORD-375350',
        provider_identifier: null,
        facility_code: 15204,
        AMRs_location: 1,
        full_names: null,
        date_collected: '2021-02-25',
        date_received: '2021-02-25',
        date_tested: '2021-03-01',
        interpretation: '<30 detected',
        result: '< LDL copies/ml',
        date_dispatched: '2021-03-01',
        sample_status: 'Complete',
        result_log: null,
        patient: '123456-test'
      },
      {
        id: 10987654321,
        order_number: 'ORD-290361',
        provider_identifier: null,
        facility_code: 15204,
        AMRs_location: 1,
        full_names: null,
        date_collected: '2020-03-23',
        date_received: '2020-03-23',
        date_tested: '2020-03-27',
        interpretation: 'Not detected',
        result: '< LDL copies/ml',
        date_dispatched: '2020-03-30',
        sample_status: 'Complete',
        result_log: null,
        patient: '123456-test'
      }
    ],
    from: 1,
    last_page: 1,
    to: 3,
    total: 3
  };

  const testRequestParams = {
    patientUuid: 'test-patient-a-uuid',
    referenceDate: '2021-04-20'
  };

  test('fetches and returns a list of pending EID lab reminders', async () => {
    mockGetPatientIdentifiers.mockResolvedValueOnce(testIdentifiers);

    jest
      .spyOn(LabClient.prototype, 'getFetchRequest')
      .mockImplementationOnce(() =>
        Promise.resolve(testPendingViralLoadResults)
      );

    jest
      .spyOn(LabClient.prototype, 'fetchPendingViralLoad')
      .mockImplementationOnce(() =>
        Promise.resolve(testPendingViralLoadResults)
      );

    await EidLabReminderService.pendingEIDReminders(
      testRequestParams,
      config.hivLabSystem
    )
      .then((reminders) => {
        expect(reminders).toBeDefined();

        reminders.map((reminder) =>
          expect(testPendingViralLoadResults.data).toContain(reminder)
        );
      })
      .catch((err) => expect(err).not.toBeDefined());
  });
});
