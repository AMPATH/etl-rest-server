import { Moh731Service } from '../../../service/moh-731/moh-731.service';
const dao = require('../../../etl-dao');

const mockGetPatientListReport = dao.getPatientListReport;
const mockRunReport = dao.runReport;

jest.mock('../../../etl-dao', () => ({
  getPatientListReport: jest.fn(),
  runReport: jest.fn()
}));

describe('Moh731Service: ', () => {
  const service = new Moh731Service();
  let testReportParams = {
    requestParams: {
      startDate: '2021-04-01',
      endDate: '2021-05-01',
      locations: ['test-location-uuids']
    },
    endDate: '2021-03-31T23:59:59 03:00',
    isAggregated: false,
    locationUuids: 'test-location-a-uuid',
    reportName: 'MOH-731-report-2017',
    startDate: '2021-03-01T00:00:00 03:00'
  };

  test('fetches and returns an aggregate report', async () => {
    const testReport = {
      results: {
        results: [
          {
            active: 22,
            dead: 3,
            hiv_exposed_non_occupational: 12,
            hiv_exposed_occupational: 1,
            location_id: 1,
            location_uuid: 'test-location-a-uuid',
            location: 'Test Location A',
            ltfu: 4,
            net_cohort: 29,
            on_alternative_first_line: 3,
            on_original_first_line: 2,
            on_second_line: 0,
            on_tx: 22,
            perc_ltfu: 0.1379,
            screened_for_cervical_ca: 159,
            started_art: 58,
            started_PEP_non_occupational: 11,
            started_PEP_occupational: 1,
            suppressed: 20,
            total_hiv_exposed: 13,
            total_started_PEP: 12,
            total_with_vl: 21
          }
        ]
      },
      isReleased: true
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
            age: 32,
            age_range: 'older_than_24',
            arv_first_regimen_start_date: '29-03-2021',
            birthdate: '1989-03-22T21:00:00.000Z',
            cur_arv_meds: 'LAMIVUDINE, TENOFOVIR, DOLUTEGRAVIR',
            cur_meds: '628 ## 802 ## 9759',
            cur_regimen_arv_start_date: '29-03-2021',
            enrollment_date: '29-03-2021',
            gender: 'M',
            latest_rtc_date: '2021-05-13',
            location: 'Yet Another Test Patient',
            location_id: 1,
            location_uuid: 'test-location-a-uuid',
            person_name: 'Yet Another Test Patient',
            started_art: 1
          }
        ]
      },
      sectionDefinitions: [
        {
          sectionTitle: '1. Post Exposure Prophylaxis',
          indicators: [
            {
              label: 'Exposed Occupational',
              ref: 'HV05-01',
              indicator: 'hiv_exposed_occupational'
            },
            {
              label: 'Exposed Other',
              ref: 'HV05-02',
              indicator: 'hiv_exposed_non_occupational'
            },
            {
              label: 'Exposed Total (Sum HV05-01 and HV05-02)',
              ref: 'HV05-03',
              indicator: 'total_hiv_exposed'
            },
            {
              label: 'PEP Occupational',
              ref: 'HV05-04',
              indicator: 'started_PEP_occupational'
            },
            {
              label: 'PEP Other',
              ref: 'HV05-05',
              indicator: 'started_PEP_non_occupational'
            },
            {
              label: 'PEP Total (Sum HV05-04 and HV05-05)',
              ref: 'HV03-06',
              indicator: 'total_started_PEP'
            }
          ]
        }
      ]
    };

    testReportParams = {
      requestParams: {
        startDate: '2021-04-01',
        endDate: '2021-05-01',
        locations: ['test-location-uuids']
      },
      endDate: '2021-03-31T23:59:59 03:00',
      isAggregated: false,
      locationUuids: 'test-location-a-uuid',
      reportName: 'MOH-731-report-2017',
      startDate: '2021-03-01T00:00:00 03:00',
      indicator: 'total_hiv_exposed'
    };

    jest
      .spyOn(service, 'resolveLocationUuidsToName')
      .mockImplementation(() => ['Test Location A']);

    mockGetPatientListReport.mockResolvedValue(testPatientList);

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
