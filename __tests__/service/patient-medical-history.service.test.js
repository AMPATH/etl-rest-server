import { BaseMysqlReport } from '../../app/reporting-framework/base-mysql.report';
import { PatientMedicalHistoryService } from '../../service/patient-medical-history.service';

describe('PatientMedicalHistoryService: ', () => {
  const service = new PatientMedicalHistoryService('test-report', {});

  test('fetches and returns a medical history report', async () => {
    const testReport = {
      size: 1,
      results: {
        results: [
          {
            current_regimen: 'LAMIVUDINE, TENOFOVIR, DOLUTEGRAVIR',
            encounter_datetime: '31-01-2018',
            previous_regimen: 'LAMIVUDINE, NEVIRAPINE, ZIDOVUDINE',
            previous_vl: 0,
            previous_vl_date: '26-04-2017'
          }
        ]
      }
    };

    jest
      .spyOn(BaseMysqlReport.prototype, 'generateReport')
      .mockImplementation(() => Promise.resolve(testReport));

    await service
      .generateReport({})
      .then((report) => {
        expect(report).toBeDefined();
        expect(report).toEqual(testReport);
      })
      .catch((err) => expect(err).not.toBeDefined());
  });

  test('throws an error if there is a problem fetching the medical history report', async () => {
    const error = new Error('Error establishing a database connection');

    jest
      .spyOn(BaseMysqlReport.prototype, 'generateReport')
      .mockImplementation(() => Promise.reject(error));

    await service
      .generateReport({})
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
