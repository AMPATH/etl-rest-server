const {
  default: MysqlConnectionService
} = require('../../../app/database-access/mysql-connection.service');
const {
  default: QueryService
} = require('../../../app/database-access/query.service');

jest.mock('../../../app/config/config.service', () => ({
  getConfig: jest.fn().mockReturnValue(testConfig)
}));

jest.mock(
  '../../../conf/config.json',
  () => ({
    ...testConfig
  }),
  { virtual: true }
);

const testConfig = {
  openmrs: {
    host: '1.1.1.0',
    applicationName: 'test-amrs',
    port: 8080,
    https: false
  },
  etl: {
    host: '0.0.0.0',
    port: 8769,
    tls: false
  },
  mysql: {
    connectionLimit: 1,
    host: 'localhost',
    port: 3306,
    user: 'fake_user',
    password: 'terrible-password'
  }
};

describe('QueryService: ', () => {
  test('accepts a SQL query string and optional params and returns the results of their execution', () => {
    const service = new QueryService();
    expect(service).toBeDefined();

    const querySpy = jest.spyOn(MysqlConnectionService.getPool(), 'query');
    querySpy.mockReturnValue(['customers', 'employees', ' orders']);

    service.executeQuery('show tables;');

    expect(querySpy).toHaveBeenCalledTimes(1);
    expect(querySpy).toHaveBeenCalledWith('show tables;', undefined);
  });
});
