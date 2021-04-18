import { BaseMysqlReport } from '../../app/reporting-framework/base-mysql.report';
import { PatientlistMysqlReport } from '../../app/reporting-framework/patientlist-mysql.report';
import { clinicalArtOverviewService } from '../../service/clinical-art-overview.service';

describe('clinicalArtOverviewService: ', () => {
  const service = new clinicalArtOverviewService();

  let testParams = {
    requestParams: {
      // endAge: 120,
      // endDate: '2021-01-07',
      // period: 'monthly',
      // startAge: 0,
      // startDate: '2021-01-01'
    }
  };

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

  test('fetches and returns a patient list', async () => {
    testParams = {
      indicator: '',
      requestParams: {
        // endDate: '2021-01-31',
        // startDate: '2021-01-01',
        // period: 'monthly',
        // startAge: 0,
        // endAge: 120,
        // locationUuids: 'test-location-a-uuid'
      }
    };

    const testPatientList = {
      schemas: {},
      sqlQuery: '',
      results: {
        results: [{}]
      }
    };

    const expected = { schemas: {}, sqlQuery: '', result: [{}] };

    jest
      .spyOn(PatientlistMysqlReport.prototype, 'generatePatientListReport')
      .mockImplementation(() => Promise.resolve(testPatientList));

    await service
      .getPatientListReport(testParams)
      .then((list) => {
        expect(list).toBeDefined();
        expect(list).toEqual(expected);
      })
      .catch((err) => expect(err).not.toBeDefined());
  });

  test('throws an error if there is a problem fetching the patient list', async () => {
    const error = new Error('Error establishing a database connection');

    jest
      .spyOn(PatientlistMysqlReport.prototype, 'generatePatientListReport')
      .mockImplementation(() => Promise.reject(error));

    await service
      .getPatientListReport(testParams)
      .then((list) => {
        expect(list).not.toBeDefined();
      })
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(
          /error establishing a database connection/i
        );
      });
  });
});
