import { BaseMysqlReport } from '../../../app/reporting-framework/base-mysql.report';
import { PatientlistMysqlReport } from '../../../app/reporting-framework/patientlist-mysql.report';
import { SurgeDailyReportService } from '../../../service/surge-reports/surge-daily-report-service';

describe('SurgeDailyReportService: ', () => {
  const service = new SurgeDailyReportService();

  let testReportParams = {
    // requestParams: {
    //   startDate: '2021-04-01',
    //   endDate: '2021-05-01',
    //   locations: ['test-location-uuids']
    // },
    endDate: '2021-03-31T23:59:59 03:00',
    locationUuids: 'test-location-a-uuid',
    startDate: '2021-03-01T00:00:00 03:00'
  };

  test('fetches and returns an aggregate report', async () => {
    const testReport = {
      results: {
        results: [{}]
      }
    };

    jest
      .spyOn(BaseMysqlReport.prototype, 'generateReport')
      .mockImplementation(() => Promise.resolve(testReport));

    await service
      .getAggregateReport(testReportParams)
      .then((report) => {
        expect(report).toBeDefined();
        expect(report).toEqual(testReport);
      })
      .catch((err) => expect(err).not.toBeDefined());
  });

  test('throws an error if there is a problem fetching the aggregate report', async () => {
    const error = new Error('Error establishing a database connection');
    testReportParams.locationUuids = 'test-location-a-uuid';

    jest
      .spyOn(BaseMysqlReport.prototype, 'generateReport')
      .mockImplementation(() => Promise.reject(error));

    await service
      .getAggregateReport(testReportParams)
      .then((report) => {
        expect(report).not.toBeDefined();
      })
      .catch((err) => {
        expect(err.message).toMatch(
          /error establishing a database connection/i
        );
      });
  });

  test('fetches and returns a patient list', async () => {
    const testPatientList = {
      results: {
        results: [{}]
      }
    };

    testReportParams = {
      requestParams: {
        startDate: '2021-04-01',
        endDate: '2021-05-01',
        locations: ['test-location-uuids']
      },
      endDate: '2021-03-31T23:59:59 03:00',
      locationUuids: 'test-location-a-uuid',
      startDate: '2021-03-01T00:00:00 03:00'
    };

    jest
      .spyOn(PatientlistMysqlReport.prototype, 'generatePatientListReport')
      .mockImplementation(() => Promise.resolve(testPatientList));

    await service
      .getPatientListReport(testReportParams)
      .then((list) => {
        expect(list).toBeDefined();
        expect(list).toMatchObject(testPatientList);
      })
      .catch((err) => {
        expect(err).toBeDefined();
      });
  });

  test('throws an error if there is a problem fetching the patient list', async () => {
    const error = new Error('Error establishing a database connection');
    testReportParams.locationUuids = 'test-location-a-uuid';

    jest
      .spyOn(PatientlistMysqlReport.prototype, 'generatePatientListReport')
      .mockImplementation(() => Promise.reject(error));

    await service
      .getPatientListReport(testReportParams)
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
