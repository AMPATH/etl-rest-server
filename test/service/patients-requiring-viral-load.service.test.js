import { BaseMysqlReport } from '../../app/reporting-framework/base-mysql.report';
import { PatientlistMysqlReport } from '../../app/reporting-framework/patientlist-mysql.report';
import { patientsRequiringVLService } from '../../service/patients-requiring-viral-load.service';

describe('PatientsRequiringVLService: ', () => {
  let testReportParams;
  const service = new patientsRequiringVLService();

  const testReport = {
    schemas: {},
    sqlQuery: '',
    results: {
      results: [{}]
    }
  };

  const expectedReport = { schemas: {}, sqlQuery: '', result: [{}] };

  const testPatientList = {
    schemas: {},
    sqlQuery: '',
    results: {
      results: [{}]
    }
  };

  const expectedPatientList = { schemas: {}, sqlQuery: '', result: [{}] };

  beforeEach(() => {
    testReportParams = {
      locationUuids: 'test-location-A-uuid'
    };
  });

  test('fetches and returns an aggregate report', async () => {
    jest
      .spyOn(BaseMysqlReport.prototype, 'generateReport')
      .mockImplementation(() => Promise.resolve(testReport));

    await service
      .getAggregateReport(testReportParams)
      .then((report) => {
        expect(report).toEqual(expectedReport);
      })
      .catch((err) => expect(err).not.toBeDefined());
  });

  test('throws an error if there is a problem fetching the aggregate report', async () => {
    const error = new Error('Error establishing a database connection');

    jest
      .spyOn(BaseMysqlReport.prototype, 'generateReport')
      .mockImplementation(() => Promise.reject(error));

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

  test('fetches and returns a patient list', async () => {
    jest
      .spyOn(PatientlistMysqlReport.prototype, 'generatePatientListReport')
      .mockImplementation(() => Promise.resolve(testPatientList));

    await service
      .getPatientListReport(testReportParams)
      .then((patientList) => {
        expect(patientList).toEqual(expectedPatientList);
      })
      .catch((err) => expect(err).not.toBeDefined());
  });

  test('throws an error if there is a problem fetching the aggregate report', async () => {
    const error = new Error('Error establishing a database connection');
    jest
      .spyOn(PatientlistMysqlReport.prototype, 'generatePatientListReport')
      .mockImplementation(() => Promise.reject(error));

    await service
      .getPatientListReport(testReportParams)
      .then((patientList) => {
        expect(patientList).not.toBeDefined();
      })
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(
          /Error establishing a database connection/i
        );
      });
  });
});
