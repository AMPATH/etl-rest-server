import { clinicalPatientCareStatusOverviewService } from '../../service/clinical-patient-care-status-overview';
const dao = require('../../etl-dao');

const mockRunReport = dao.runReport;
const mockGetPatientListReport = dao.getPatientListReport;

jest.mock('../../etl-dao', () => ({
  getPatientListReport: jest.fn(),
  runReport: jest.fn()
}));

describe('ClinicalPatientCareStatusOverviewService: ', () => {
  const service = new clinicalPatientCareStatusOverviewService();
  const testReportParams = {
    startDate: '2021-04-01',
    endDate: '2021-05-01',
    locations: ['test-location-uuids']
  };

  test('fetches and returns an aggregate report', async () => {
    const testReport = {
      results: {
        results: [{}]
      }
    };

    mockRunReport.mockResolvedValue(testReport);

    await service
      .getAggregateReport(testReportParams)
      .then((report) => {
        expect(report).toBeDefined();
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
