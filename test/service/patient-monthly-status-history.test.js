import { PatientMonthlyStatusHistory } from '../../service/patient-monthly-status-history';
const db = require('../../etl-db');

const mockQueryReportServer = db.queryReportServer;

jest.mock('../../etl-db', () => ({
  queryReportServer: jest.fn()
}));

describe('PatientMonthlyStatusHistory: ', () => {
  const service = new PatientMonthlyStatusHistory();

  const testQueryResult = {
    result: [
      {
        person_id: 123456789
      }
    ]
  };

  test(`resolves a patient's ID from their matching patient UUID`, async () => {
    mockQueryReportServer.mockImplementationOnce((query, callback) =>
      callback(testQueryResult)
    );

    await service
      .resolvePersonId('test-person-uuid')
      .then((result) => {
        expect(result).toBeDefined();
        expect(result).toEqual(testQueryResult);
      })
      .catch((err) => expect(err).not.toBeDefined());
  });

  test('fetches and returns the monthly status history report', async () => {
    const testStatusHistoryReport = {
      person_id: 123456789,
      location: 'Test Location A',
      initial_state: 'active_return',
      most_recent_clinical_encounter: '12-09-2020',
      next_state: 'active_return',
      status_source: 'Clinical',
      rtc_date: '13-10-2020'
    };

    jest
      .spyOn(service, 'resolvePersonId')
      .mockResolvedValueOnce(testQueryResult);

    mockQueryReportServer.mockImplementationOnce((query, callback) => {
      callback(testStatusHistoryReport);
    });

    await service
      .getPatientMonthlyStatusHistory(
        'test-person-uuid',
        '2020-09-01',
        '2021-01-01'
      )
      .then((report) => {
        expect(report).toBeDefined();
        expect(report).toEqual(testStatusHistoryReport);
      })
      .catch((err) => {
        expect(err).not.toBeDefined();
      });
  });

  test('throws an error if there is a problem fetching the monthly status history report', async () => {
    jest
      .spyOn(service, 'resolvePersonId')
      .mockResolvedValueOnce({ result: [] });

    mockQueryReportServer.mockImplementationOnce((query, callback) => {
      callback(testQueryResult);
    });

    await service
      .getPatientMonthlyStatusHistory(
        'test-person-uuid',
        '2020-09-01',
        '2021-01-01'
      )
      .then((result) => {
        expect(result).not.toBeDefined();
      })
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.error).toMatch(/could not resolve patient id/i);
      });
  });
});
