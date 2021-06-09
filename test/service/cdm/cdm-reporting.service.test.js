import { BaseMysqlReport } from '../../../app/reporting-framework/base-mysql.report';
import {
  cdmMedicationChange,
  convertCdmConceptIdToName
} from '../../../etl-processors';
import { CDMReportingService } from '../../../service/cdm/cdm-reporting.service';

const mockCdmMedicationChange = cdmMedicationChange;
const mockConvertCdmConceptIdToName = convertCdmConceptIdToName;

jest.mock('../../../etl-processors', () => ({
  cdmMedicationChange: jest.fn(),
  convertCdmConceptIdToName: jest.fn()
}));

describe('CDMReportingService: ', () => {
  const service = new CDMReportingService();

  test('fetches and returns a CDM summary report', async () => {
    const testCdmReport = {
      results: {
        results: [
          {
            creatinine: null,
            creatinine_date: null,
            dbp: null,
            death_date: null,
            dm_meds: null,
            dm_meds_name: '',
            dm_status: null,
            dm_status_name: '',
            encounter_datetime: '2018-12-20T15:32:25.000Z',
            encounter_id: 8237143,
            encounter_type: 'CDMDispensary',
            encounter_type_description:
              'Chronic Disease Management (CDM) Dispensary Form',
            fbs: null,
            hb_a1c: null,
            hb_a1c_date: null,
            htn_meds: null,
            htn_meds_name: '',
            htn_status: 'NEW HYPERTENSIVE PATIENT',
            htn_status_name: '',
            is_clinical_encounter: 1,
            ldl: null,
            lipid_panel_date: null,
            lmp: null,
            person_id: 123456789,
            prescriptions: null,
            problems: null,
            problems_name: '',
            pulse: null,
            rbs: null,
            rtc_date: '2019-01-30T21:00:00.000Z',
            sbp: null,
            total_cholesterol: null,
            triglycerides: null
          }
        ]
      }
    };

    jest
      .spyOn(BaseMysqlReport.prototype, 'generateReport')
      .mockResolvedValueOnce(testCdmReport);

    mockConvertCdmConceptIdToName.mockResolvedValueOnce(testCdmReport);

    await service
      .getPatientSummaryReport()
      .then((report) => {
        expect(report).toBeDefined();
        expect(report).toEqual(testCdmReport);
      })
      .catch((err) => {
        expect(err).not.toBeDefined();
      });
  });

  test('throws an error if there is a problem fetching the CDM summary report', async () => {
    const error = new Error('401: Unauthorized');

    jest
      .spyOn(BaseMysqlReport.prototype, 'generateReport')
      .mockRejectedValueOnce(error);

    await service
      .getPatientSummaryReport({})
      .then((report) => expect(report).notToBeDefined())
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(/401: unauthorized/i);
      });
  });

  test('fetches and returns a medication history report', async () => {
    const testCdmMedicationHistoryReport = {
      results: {
        results: [
          {
            encounter_datetime: null,
            prescriptions: null
          }
        ]
      }
    };

    mockConvertCdmConceptIdToName.mockResolvedValueOnce(
      testCdmMedicationHistoryReport
    );
    mockCdmMedicationChange.mockResolvedValueOnce(
      testCdmMedicationHistoryReport
    );

    jest
      .spyOn(BaseMysqlReport.prototype, 'generateReport')
      .mockResolvedValueOnce(testCdmMedicationHistoryReport);

    await service
      .getPatientMedicationHistoryReport({})
      .then((report) => {
        expect(report).toBeDefined();
        expect(report).toEqual(testCdmMedicationHistoryReport);
      })
      .catch((err) => expect(err).not.toBeDefined());
  });

  test('throws and returns an error if there is a problem fetching the medication history report', async () => {
    const error = new Error('401: Unauthorized');

    jest
      .spyOn(BaseMysqlReport.prototype, 'generateReport')
      .mockRejectedValueOnce(error);

    await service
      .getPatientMedicationHistoryReport({})
      .then((report) => expect(report).not.toBeDefined())
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(/401: unauthorized/i);
      });
  });
});
