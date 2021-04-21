import { BaseMysqlReport } from '../../app/reporting-framework/base-mysql.report';
import { PatientlistMysqlReport } from '../../app/reporting-framework/patientlist-mysql.report';
import { PatientGainLosesService } from '../../service/patient-gain-loses.service';

describe('PatientGainsAndLossesService: ', () => {
  const service = new PatientGainLosesService();

  const testReportParams = {
    startDate: '2021-04-01',
    endDate: '2021-05-01',
    locationUuids: 'test-location-a-uuid'
  };

  test('fetches and returns an aggregate report', async () => {
    const testReport = {
      results: {
        results: [
          {
            return_to_care: 12,
            transferred_in: 4,
            newly_enrolled: 8,
            gained_other: 1,
            transfer_out: 4,
            dead: 3,
            ltfu: 6
          }
        ]
      }
    };

    jest
      .spyOn(BaseMysqlReport.prototype, 'generateReport')
      .mockImplementation(() => Promise.resolve(testReport));

    await service
      .getAggregateReport(testReportParams)
      .then((report) => {
        expect(report).toBeDefined();
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
          /error establishing a database connection/i
        );
      });
  });

  test('fetches and returns a patient list', async () => {
    const testPatientList = {
      results: {
        results: [
          {
            age: 27,
            gender: 'M',
            location_uuid: 'test-location-a-uuid',
            person_name: 'Yet Another Test Patient'
          }
        ]
      }
    };

    jest
      .spyOn(PatientlistMysqlReport.prototype, 'generatePatientListReport')
      .mockImplementation(() => Promise.resolve(testPatientList));

    await service
      .getPatientListReport(testReportParams)
      .then((report) => {
        expect(report).toBeDefined();
      })
      .catch((err) => expect(err).not.toBeDefined());
  });

  test('throws an error if there is a problem fetching the patient list', async () => {
    const error = new Error('Error establishing a database connection');

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
