const {
  default: ConfigService
} = require('../../../app/config/config.service');

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
  }
};

describe('ConfigService: ', () => {
  test('is a frozen object', () => {
    expect(Object.isFrozen(ConfigService)).toEqual(true);

    try {
      ConfigService.length = 1;
    } catch (err) {
      expect(err.message).toMatch(
        /cannot add property length, object is not extensible/i
      );
    }
  });

  test('returns the app config', () => {
    const appConfig = ConfigService.getConfig();
    expect(appConfig).toBeDefined();
    expect(appConfig).toHaveProperty('openmrs');
    expect(appConfig).toHaveProperty('etl');
  });
});
