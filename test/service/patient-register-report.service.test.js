import { PatientRegisterReportService } from '../../service/patient-register-report.service';
const dao = require('../../etl-dao');

const mockRunReport = dao.runReport;

jest.mock('../../etl-dao', () => ({
  runReport: jest.fn()
}));

describe('PatientRegisterReportService', () => {
  const service = new PatientRegisterReportService();

  const testReportParams = {
    startDate: '2021-04-01',
    endDate: '2021-05-01',
    locationUuids: 'test-location-a-uuid'
  };

  const testReport = {
    size: 1,
    results: {
      results: [{}]
    }
  };

  test('fetches and returns an aggregate report', async () => {
    mockRunReport.mockResolvedValue(testReport);

    await service
      .getAggregateReport(testReportParams)
      .then((report) => {
        expect(report).toBeDefined();
        expect(report).toEqual(testReport);
      })
      .catch((err) => {
        expect(err).not.toBeDefined();
      });
  });

  test('throws an error if there is a problem fetching the aggregate report', async () => {
    const error = new Error('Error establishing a database connection');

    mockRunReport.mockRejectedValue(error);
    await service
      .getAggregateReport(testReportParams)
      .then((report) => {
        expect(report).not.toBeDefined();
      })
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(
          /Error establishing a database connection/i
        );
      });
  });
});
