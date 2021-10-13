import { BaseMysqlReport } from '../../app/reporting-framework/base-mysql.report';
import { PatientlistMysqlReport } from '../../app/reporting-framework/patientlist-mysql.report';
import { PatientReferralService } from '../../service/patient-referral.service';
const dao = require('../../etl-dao');

const mockRunReport = dao.runReport;

jest.mock('../../etl-dao', () => ({
  runReport: jest.fn()
}));

describe('PatientReferralService: ', () => {
  const service = new PatientReferralService();

  const testReportParams = {
    endDate: '2021-04-16',
    locationUuids: 'test-location-uuid',
    programUuid: 'test-program-uuid',
    notificationStatus: null
  };

  const testReferralPatientList = {
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

  const error = new Error('Error establishing a database connection');

  test('fetches and returns an aggregate report', async () => {
    const testReport = {
      size: 1,
      results: {
        results: [
          {
            enrollment_count: 3,
            program_name: 'Test Pilot Program',
            program_uuid: 'test-pilot-program-uuid'
          }
        ]
      }
    };

    jest
      .spyOn(BaseMysqlReport.prototype, 'generateReport')
      .mockImplementation(() => Promise.resolve(testReport));

    const service = new PatientReferralService();

    await service
      .getAggregateReport(testReportParams)
      .then((aggregateReport) => {
        expect(aggregateReport).toBeDefined();
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
      .then((aggregateReport) => {
        expect(aggregateReport).not.toBeDefined();
      })
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(
          /error establishing a database connection/i
        );
      });
  });

  test('fetches and returns a referral patient list', async () => {
    const testPatientList = {
      size: 2,
      results: {
        results: [
          {
            program_id: 1,
            program_name: 'Test Pilot Program',
            program_uuid: 'test-pilot-program-uuid',
            date_completed: null,
            date_enrolled: '2020-07-05T14:33:09.000Z',
            gender: 'F',
            age: 27,
            person_name: 'Test Patient Alpha'
          },
          {
            program_id: 1,
            program_name: 'Test Pilot Program',
            program_uuid: 'test-pilot-program-uuid',
            date_completed: null,
            date_enrolled: '2020-05-21T09:55:12.000Z',
            gender: 'F',
            age: 30,
            person_name: 'Test Patient Beta'
          }
        ]
      }
    };

    mockRunReport.mockResolvedValue(testPatientList);

    const service = new PatientReferralService();

    await service
      .getPatientListReport(testReportParams)
      .then((patientList) => {
        expect(patientList).toBeDefined();
      })
      .catch((err) => expect(err).not.toBeDefined());
  });

  test('throws an error if there is a problem fetching the referral patient list', async () => {
    mockRunReport.mockRejectedValue(error);

    await service
      .getPatientListReport(testReportParams)
      .then((patientList) => {
        expect(patientList).not.toBeDefined();
      })
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(
          /error establishing a database connection/i
        );
      });
  });

  test('fetches and returns a referral patient list report', async () => {
    jest
      .spyOn(PatientlistMysqlReport.prototype, 'generatePatientListReport')
      .mockImplementation(() => Promise.resolve(testReferralPatientList));

    const service = new PatientReferralService();

    await service
      .getReferralPatientListReport(testReportParams)
      .then((report) => {
        expect(report).toBeDefined();
      })
      .catch((err) => expect(err).not.toBeDefined());
  });

  test('throws an error if there is a problem fetching the referral patient list', async () => {
    jest
      .spyOn(PatientlistMysqlReport.prototype, 'generatePatientListReport')
      .mockImplementation(() => Promise.reject(error));

    const service = new PatientReferralService();

    await service
      .getPatientListReport(testReportParams)
      .then((patientList) => {
        expect(patientList).not.toBeDefined();
      })
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(
          /error establishing a database connection/i
        );
      });
  });

  test('fetches and returns the peer navigator patient list', async () => {
    jest
      .spyOn(PatientlistMysqlReport.prototype, 'generatePatientListReport')
      .mockImplementation(() => Promise.resolve(testReferralPatientList));

    const service = new PatientReferralService();

    await service
      .getPeerNavigatorReferralPatientList(testReportParams)
      .then((report) => {
        expect(report).toBeDefined();
      })
      .catch((err) => expect(err).not.toBeDefined());
  });

  test('throws an error if there is a problem fetching the referral patient list', async () => {
    jest
      .spyOn(PatientlistMysqlReport.prototype, 'generatePatientListReport')
      .mockImplementation(() => Promise.reject(error));

    const service = new PatientReferralService();

    await service
      .getPeerNavigatorReferralPatientList(testReportParams)
      .then((patientList) => {
        expect(patientList).not.toBeDefined();
      })
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(
          /error establishing a database connection/i
        );
      });
  });
});
