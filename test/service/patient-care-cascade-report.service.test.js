import { patientCareCascadeService } from '../../service/patient-care-cascade-report.service';
const dao = require('../../etl-dao');

const mockRunReport = dao.runReport;
const mockGetPatientListReport = dao.getPatientListReport;

jest.mock('../../etl-dao', () => ({
  getPatientListReport: jest.fn(),
  runReport: jest.fn()
}));

describe('PatientCareCascadeService: ', () => {
  const service = new patientCareCascadeService();
  const testReportParams = {
    startDate: '2021-04-01',
    endDate: '2021-05-01',
    locations: ['test-location-uuids']
  };

  test('fetches and returns an aggregate report', async () => {
    const testReport = {
      results: {
        results: [
          {
            active_and_on_art: 13,
            currently_in_care_total: 15,
            has_vl_since_oct: 10,
            ltfu: 2,
            virally_suppressed_since_oct: 1
          }
        ]
      }
    };

    mockRunReport.mockResolvedValue(testReport);

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

    mockRunReport.mockRejectedValue(error);

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

    mockGetPatientListReport.mockResolvedValue(testPatientList);

    await service
      .getPatientListReport(testReportParams)
      .then((report) => {
        expect(report).toBeDefined();
      })
      .catch((err) => expect(err).not.toBeDefined());
  });

  test('throws an error if there is a problem fetching the patient list', async () => {
    const error = new Error('Error establishing a database connection');

    mockGetPatientListReport.mockRejectedValue(error);

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
