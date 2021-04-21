import { labOrdersService } from '../../service/lab-orders.service';
const dao = require('../../etl-dao');

const mockRunReport = dao.runReport;

jest.mock('../../etl-dao', () => ({
  runReport: jest.fn()
}));

describe('LabOrdersService: ', () => {
  const service = new labOrdersService();

  let testParams = {};

  test('fetches and returns an aggregate report', async () => {
    const testReport = {
      schemas: {},
      sqlQuery: '',
      results: {
        results: [{}]
      }
    };

    mockRunReport.mockResolvedValue(testReport);

    const expected = { schemas: {}, sqlQuery: '', result: [{}] };

    await service
      .getAggregateReport(testParams)
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
      .getAggregateReport(testParams)
      .then((report) => {
        expect(report).not.toBeDefined();
      })
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(
          /error establishing a database connection/i
        );
      });
  });
});
