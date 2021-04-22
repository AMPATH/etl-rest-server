const {
  default: MysqlConnectionService
} = require('../../../app/database-access/mysql-connection.service');

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

describe('MysqlConnectionService', () => {
  test('is a frozen object', () => {
    expect(Object.isFrozen(MysqlConnectionService)).toEqual(true);

    try {
      MysqlConnectionService.timeout = 10000;
    } catch (err) {
      expect(err.message).toMatch(
        /cannot add property timeout, object is not extensible/i
      );
    }
  });

  test('initializes a connection pool based on the config and returns it', () => {
    const connectionPool = MysqlConnectionService.getPool();
    expect(connectionPool.pool.config.connectionConfig.host).toMatch(
      /localhost/
    );
    expect(connectionPool.pool.config.connectionConfig.port).toEqual(3306);
    expect(connectionPool.pool.config.connectionConfig.user).toMatch(
      /fake_user/
    );
  });
});
