const PatientDataResolverService = require('../../programs/patient-data-resolver.service');
const {
  getPatientEncounters
} = require('../../service/openmrs-rest/encounter');
const {
  getPatientByUuid
} = require('../../service/openmrs-rest/patient.service');
const {
  getProgramEnrollmentByUuid
} = require('../../service/openmrs-rest/program.service');
const {
  getPatientHivSummary
} = require('../../dao/patient/etl-patient-hiv-summary-dao');

const mockGetPatientByUuid = getPatientByUuid;
const mockGetProgramEnrollmentByUuid = getProgramEnrollmentByUuid;
const mockGetPatientEncounters = getPatientEncounters;
const mockGetPatientHivSummary = getPatientHivSummary;

const testPatient = {
  uuid: 'test-patient-uuid',
  display: '012345 - Yet Another Test Patient',
  identifiers: [
    {
      display: 'Test Identifier - 987654321-0',
      uuid: 'test-identifier-uuid',
      identifier: '0123456789-0'
    }
  ],
  person: {
    uuid: 'person-uuid',
    display: 'Yet Another Test Patient',
    gender: 'M',
    age: '28'
  }
};

const testProgramEnrollment = {
  uuid: 'test-program-enrollment-uuid',
  display: 'Test Program Enrollment',
  voided: false,
  dateEnrolled: '2021-04-12T00:00:00.000+0300',
  dateCompleted: null,
  location: {
    uuid: 'test-program-location',
    display: 'Test Location',
    name: 'Test Location'
  },
  program: {
    uuid: 'test-program-uuid'
  }
};

const testPatientEncounters = {
  results: {
    encounterDatetime: '2021-04-12T00:00:00.000+0300',
    encounterType: {
      uuid: 'test-encounter-uuid',
      display: 'Test Encounter'
    }
  }
};

const testHivSummary = {
  date_created: '2020-09-18T22:05:35.000Z',
  person_id: 123456789,
  uuid: 'b06c1ac6-8160-438b-bcee-0d202c35d756',
  visit_id: 123456789,
  visit_type: 16,
  encounter_id: 123456789,
  encounter_datetime: '2020-09-15T05:40:15.000Z',
  encounter_type: 218,
  is_transit: 0,
  is_clinical_encounter: null,
  location_id: 195,
  location_uuid: '18c343eb-b353-462a-9139-b16606e6b6c2',
  visit_num: 9,
  mdt_session_number: 1,
  enrollment_date: '2018-10-22T21:00:00.000Z',
  enrollment_location_id: 69,
  ovc_non_enrollment_reason: null,
  ovc_non_enrollment_date: null,
  hiv_start_date: '2018-10-23T21:00:00.000Z',
  death_date: null,
  scheduled_visit: 11233,
  transfer_in: null,
  transfer_in_location_id: null,
  transfer_in_date: null,
  transfer_out: null,
  transfer_out_location_id: null,
  transfer_out_date: null,
  patient_care_status: 6101,
  out_of_care: null,
  prev_rtc_date: '2020-09-29T21:00:00.000Z',
  rtc_date: '2020-09-29T21:00:00.000Z',
  med_pickup_rtc_date: null,
  arv_first_regimen: 'TENOFOVIR AND LAMIVUDINE AND EFAVIRENZ',
  arv_first_regimen_location_id: 9999,
  arv_first_regimen_start_date: '1899-12-31T21:32:44.000Z',
  arv_first_regimen_start_date_flex: null,
  prev_arv_meds: '628 ## 802 ## 9759',
  cur_arv_meds: 'LAMIVUDINE, TENOFOVIR, DOLUTEGRAVIR',
  cur_arv_meds_strict: null,
  cur_arv_drugs: '10268=597',
  prev_arv_drugs: null,
  arv_start_date: '2020-07-06T21:00:00.000Z',
  arv_start_location_id: 195,
  prev_arv_start_date: '2020-07-06T21:00:00.000Z',
  prev_arv_end_date: '2019-03-25T21:00:00.000Z',
  prev_arv_line: null,
  cur_arv_line: null,
  cur_arv_line_strict: null,
  cur_arv_line_reported: 1,
  prev_arv_adherence: null,
  cur_arv_adherence: null,
  hiv_status_disclosed: 1,
  is_pregnant: null,
  edd: null,
  tb_screen: null,
  tb_screening_result: null,
  tb_screening_datetime: '2020-06-22T05:30:10.000Z',
  on_ipt: 0,
  ipt_start_date: null,
  ipt_stop_date: null,
  ipt_completion_date: null,
  on_tb_tx: 0,
  tb_tx_start_date: null,
  tb_tx_end_date: null,
  pcp_prophylaxis_start_date: '2020-07-07T13:23:05.000Z',
  condoms_provided_date: '2018-10-23T09:53:26.000Z',
  modern_contraceptive_method_start_date: null,
  contraceptive_method: {
    concept: 1107,
    name: 'NONE',
    period: null
  },
  menstruation_status: null,
  is_mother_breastfeeding: null,
  cur_who_stage: 1,
  discordant_status: 4,
  cd4_resulted: null,
  cd4_resulted_date: null,
  cd4_1: null,
  cd4_1_date: null,
  cd4_2: null,
  cd4_2_date: null,
  cd4_percent_1: null,
  cd4_percent_1_date: null,
  cd4_percent_2: null,
  cd4_percent_2_date: null,
  vl_resulted: null,
  vl_resulted_date: null,
  vl_1: 129,
  vl_1_date: '2018-10-23T21:00:00.000Z',
  vl_2: null,
  vl_2_date: null,
  height: 160,
  weight: 60,
  expected_vl_date: 0,
  vl_order_date: '2020-07-06T21:00:00.000Z',
  cd4_order_date: null,
  hiv_dna_pcr_order_date: null,
  hiv_dna_pcr_resulted: null,
  hiv_dna_pcr_resulted_date: null,
  hiv_dna_pcr_1: null,
  hiv_dna_pcr_1_date: null,
  hiv_dna_pcr_2: null,
  hiv_dna_pcr_2_date: null,
  hiv_rapid_test_resulted: null,
  hiv_rapid_test_resulted_date: null,
  prev_encounter_datetime_hiv: '2020-09-15T05:39:38.000Z',
  next_encounter_datetime_hiv: null,
  prev_encounter_type_hiv: 186,
  next_encounter_type_hiv: null,
  prev_clinical_datetime_hiv: '2020-09-15T05:39:38.000Z',
  next_clinical_datetime_hiv: null,
  prev_clinical_location_id: 195,
  next_clinical_location_id: null,
  prev_clinical_rtc_date_hiv: '2020-09-29T21:00:00.000Z',
  next_clinical_rtc_date_hiv: null,
  outreach_date_bncd: null,
  outreach_death_date_bncd: null,
  outreach_patient_care_status_bncd: null,
  transfer_date_bncd: null,
  transfer_transfer_out_bncd: null,
  phone_outreach: null,
  home_outreach: null,
  outreach_attempts: null,
  outreach_missed_visit_reason: 0,
  travelled_outside_last_3_months: 1,
  travelled_outside_last_6_months: 0,
  travelled_outside_last_12_months: 0,
  last_cross_boarder_screening_datetime: '2020-09-15T05:40:15.000Z',
  is_cross_border_country: 1,
  cross_border_service_offered: 10739,
  cross_border_country_travelled: null,
  is_cross_border_county: null,
  is_cross_border: 1,
  tb_tx_stop_date: null,
  country_of_residence: null,
  ovc_exit_reason: null,
  ovc_exit_date: null,
  tb_tx_stop_reason: null,
  ca_cx_screen: null,
  ca_cx_screening_result: null,
  ca_cx_screening_result_datetime: null,
  ca_cx_screening_datetime: null,
  tb_modality_test: null,
  tb_test_result: null,
  tb_test_date: null,
  cur_arv_meds_id: '628 ## 802 ## 9759',
  arv_first_regimen_id: '628 ## 633 ## 802',
  encounter_type_name: 'MOBILITYSCREENING',
  prev_encounter_type_name: 'DRUGPICKUP'
};

jest.mock('../../service/openmrs-rest/patient.service', () => ({
  ...jest.requireActual,
  getPatientByUuid: jest.fn()
}));

jest.mock('../../service/openmrs-rest/program.service', () => ({
  ...jest.requireActual,
  getProgramEnrollmentByUuid: jest.fn()
}));

jest.mock('../../service/openmrs-rest/encounter', () => ({
  ...jest.requireActual,
  getPatientEncounters: jest.fn()
}));

jest.mock('../../dao/patient/etl-patient-hiv-summary-dao', () => ({
  ...jest.requireActual,
  getPatientHivSummary: jest.fn()
}));

describe('PatientDataResolverService: ', () => {
  test('fetches and returns a patient by their uuid', async () => {
    mockGetPatientByUuid.mockResolvedValue(testPatient);

    const patient = await PatientDataResolverService.getPatient(
      'test-patient-uuid',
      {}
    );

    expect(patient).toEqual(testPatient);
  });

  test("fetches and returns a patient's program enrollments", async () => {
    mockGetProgramEnrollmentByUuid.mockResolvedValue(testProgramEnrollment);

    const enrollment = await PatientDataResolverService.getProgramEnrollment(
      'test-patient-uuid',
      {}
    );

    expect(enrollment).toEqual(testProgramEnrollment);
  });

  test("fetches and returns the patients's encounters", async () => {
    mockGetPatientEncounters.mockResolvedValue(testPatientEncounters);

    const encounters = await PatientDataResolverService.getPatientEncounters(
      'test-patient-uuid',
      {}
    );

    expect(encounters).toEqual(testPatientEncounters);
  });

  test("fetches and returns the patient's last ten HIV clinical encounters", async () => {
    mockGetPatientHivSummary.mockResolvedValue({
      result: testHivSummary
    });

    const hivSummary = await PatientDataResolverService.gethivLastTenClinicalEncounters(
      'test-patient-uuid',
      {}
    );

    expect(hivSummary).toEqual(testHivSummary);
  });
});
