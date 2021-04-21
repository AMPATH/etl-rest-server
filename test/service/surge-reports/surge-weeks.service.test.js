const surgeWeeksDao = require('../../../service/surge-reports/surge-weeks.service');
const db = require('../../../etl-db');

const mockQueryServer = db.queryServer;

jest.mock('../../../etl-db', () => ({
  queryServer: jest.fn()
}));

describe('SurgeWeeksDao: ', () => {
  test('fetches and returns surge weeks from the database', async () => {
    const testQueryResult = {
      result: [
        {
          start_date: '2021-12-25T21:00:00.000Z',
          end_date: '2021-12-30T21:00:00.000Z',
          week: '202152',
          formatted_week: '2021-W52'
        },
        {
          start_date: '2021-12-18T21:00:00.000Z',
          end_date: '2021-12-24T21:00:00.000Z',
          week: '202151',
          formatted_week: '2021-W51'
        },
        {
          start_date: '2021-12-11T21:00:00.000Z',
          end_date: '2021-12-17T21:00:00.000Z',
          week: '202150',
          formatted_week: '2021-W50'
        }
      ]
    };

    mockQueryServer.mockImplementation((query, callback) =>
      callback(testQueryResult)
    );

    await surgeWeeksDao
      .getSurgeWeeks()
      .then((surgeWeeks) => {
        expect(surgeWeeks).toBeDefined();
        expect(surgeWeeks).toMatchObject(testQueryResult);
      })
      .catch((err) => expect(err).not.toBeDefined());
  });
});
