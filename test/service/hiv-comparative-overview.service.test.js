import { BaseMysqlReport } from '../../app/reporting-framework/base-mysql.report';
import { hivComparativeOverviewService } from '../../service/hiv-comparative-overview.service';

describe('HivComparativeOverviewService: ', () => {
  const service = new hivComparativeOverviewService();

  let testParams = {};

  test('fetches and returns an aggregate report', async () => {
    const testReport = {
      schemas: {},
      sqlQuery: '',
      results: {
        results: [{}]
      }
    };

    const expected = { schemas: {}, sqlQuery: '', result: [{}] };

    jest
      .spyOn(BaseMysqlReport.prototype, 'generateReport')
      .mockImplementation(() => Promise.resolve(testReport));

    await service
      .getAggregateReport(testParams)
      .then((report) => {
        expect(report).toBeDefined();
        expect(report).toEqual(expected);
      })
      .catch((err) => {
        expect(err).not.toBeDefined();
      });
  });

  test('throws an error if there is a problem fetching the aggregate report', async () => {
    const error = new Error('Error establishing a database connection');

    jest
      .spyOn(BaseMysqlReport.prototype, 'generateReport')
      .mockImplementation(() => Promise.reject(error));

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
