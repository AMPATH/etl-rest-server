const KibanaService = require('../../service/kibana.service');

jest.mock(
  '../../conf/kibana-config.json',
  () => ({
    ...testKibanaConfig
  }),
  { virtual: true }
);

const testKibanaConfig = {
  dashboards: [
    {
      id: 123456789,
      title: 'Just another Kibana dashboard',
      department: 'HIV',
      width: '100%',
      height: '800',
      icon: 'fa fa-line-chart',
      description: 'Tis but a Kibana dashboard',
      url: 'test-dashboard-url',
      allowedDashboards: []
    }
  ]
};

describe('KibanaService: ', () => {
  test('fetches and returns Kibana dashboards', async () => {
    await KibanaService.getKibanaDashboards()
      .then((dashboards) => {
        expect(dashboards).toBeDefined();
        expect(dashboards).toEqual(testKibanaConfig.dashboards);
      })
      .catch((err) => {
        expect(err).not.toBeDefined();
      });
  });
});
