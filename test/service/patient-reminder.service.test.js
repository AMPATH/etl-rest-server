const patientReminderService = require('../../service/patient-reminder.service');
const {
  getProgramEnrollmentByPatientUuid
} = require('../../service/openmrs-rest/program.service');
const {
  getEncountersByEncounterType
} = require('../../service/openmrs-rest/encounter');

const mockGetPatientEncountersByEncounterType = getEncountersByEncounterType;
const mockGetProgramEnrollmentsByPatientUuid = getProgramEnrollmentByPatientUuid;

jest.mock('../../service/openmrs-rest/program.service', () => ({
  ...jest.requireActual(),
  getProgramEnrollmentByPatientUuid: jest.fn()
}));

jest.mock('../../service/openmrs-rest/encounter', () => ({
  ...jest.requireActual(),
  getEncountersByEncounterType: jest.fn()
}));

describe('PatientReminderService: ', () => {
  const testClinicalRemindersData = {
    last_vl_date: '2020-09-28T11:34:00',
    needs_vl_coded: 1,
    new_viral_load_present: 1,
    viral_load: 200
  };

  test('creates and returns a reminder when a new viral load is present', () => {
    const expectedVlReminder = [
      {
        display: {
          banner: true,
          toast: true
        },
        message: 'New viral load result: 200 (collected on 28-09-2020).',
        title: 'New Viral Load present',
        type: 'success'
      }
    ];
    const reminder = patientReminderService.newViralLoadPresent(
      testClinicalRemindersData
    );

    expect(reminder).toEqual(expectedVlReminder);
  });

  test('creates and returns a Due for VL reminder if the client qualifies for enhanced reminders', () => {
    // Case 1: Youth who hasn't had a VL done in 6 months or more
    testClinicalRemindersData.birth_date = '2011-12-31T21:00:00';
    testClinicalRemindersData.months_since_last_vl_date = 6;

    expect(
      patientReminderService.viralLoadReminders(testClinicalRemindersData)
    ).toMatchObject(
      expect.arrayContaining([
        expect.objectContaining({
          display: { banner: true, toast: true },
          message: expect.stringContaining(
            'Patients who are between 0-24 years old require a viral load test every 6 months.'
          ),
          title: 'Viral Load Reminder',
          type: 'danger'
        })
      ])
    );

    // Case 2: Adult newly on ART who hasn't had a VL done in 6 months or more
    testClinicalRemindersData.birth_date = new Date(
      Date.UTC('1982-12-31T21:00:00')
    );
    testClinicalRemindersData.months_since_last_vl_date = 8;
    testClinicalRemindersData.needs_vl_coded = 2;

    expect(
      patientReminderService.viralLoadReminders(testClinicalRemindersData)
    ).toMatchObject(
      expect.arrayContaining([
        expect.objectContaining({
          display: { banner: true, toast: true },
          message: expect.stringContaining(
            'Patients older than 25 years and newly on ART require a viral load test every 6 months.'
          ),
          title: 'Viral Load Reminder',
          type: 'danger'
        })
      ])
    );

    // Case 3: Adult on ART for over a year who hasn't had a VL done in over a year
    testClinicalRemindersData.birth_date = new Date(
      Date.UTC('1982-12-31T21:00:00')
    );
    testClinicalRemindersData.months_since_last_vl_date = 12;
    testClinicalRemindersData.needs_vl_coded = 3;

    expect(
      patientReminderService.viralLoadReminders(testClinicalRemindersData)
    ).toMatchObject(
      expect.arrayContaining([
        expect.objectContaining({
          display: { banner: true, toast: true },
          message: expect.stringContaining(
            'Patients older than 25 years and on ART > 1 year require a viral load test every year.'
          ),
          title: 'Viral Load Reminder',
          type: 'danger'
        })
      ])
    );

    // Case 4: Pregant or breastfeeding woman with VL > 400
    testClinicalRemindersData.birth_date = new Date(
      Date.UTC('1982-12-31T21:00:00')
    );
    testClinicalRemindersData.needs_vl_coded = 4;

    expect(
      patientReminderService.viralLoadReminders(testClinicalRemindersData)
    ).toMatchObject(
      expect.arrayContaining([
        expect.objectContaining({
          display: { banner: true, toast: true },
          message: expect.stringContaining(
            'A pregnant or breastfeeding patient  with vl > 400 requires a viral load test every 3 months'
          ),
          title: 'Viral Load Reminder',
          type: 'danger'
        })
      ])
    );

    // Case 5: Pregant or breastfeeding woman with VL <= 400
    testClinicalRemindersData.birth_date = new Date(
      Date.UTC('1982-12-31T21:00:00')
    );
    testClinicalRemindersData.needs_vl_coded = 5;

    expect(
      patientReminderService.viralLoadReminders(testClinicalRemindersData)
    ).toMatchObject(
      expect.arrayContaining([
        expect.objectContaining({
          display: { banner: true, toast: true },
          message: expect.stringContaining(
            'A pregnant or breastfeeding patient with vl<= 400 requires a viral load test every 6 months'
          ),
          title: 'Viral Load Reminder',
          type: 'danger'
        })
      ])
    );
  });

  test('creates and retuns Isoniazid TB treatment reminders if INH data is present', () => {
    // Case 1: On INH treatment with between 30 and 150 days of treatment remaining
    testClinicalRemindersData.is_on_inh_treatment = 1;
    testClinicalRemindersData.inh_treatment_days_remaining = 60;
    testClinicalRemindersData.ipt_start_date = '2021-04-14';
    testClinicalRemindersData.ipt_completion_date = '2021-06-13';

    expect(
      patientReminderService.inhReminders(testClinicalRemindersData)
    ).toMatchObject(
      expect.arrayContaining([
        expect.objectContaining({
          display: { banner: true, toast: true },
          message: expect.stringContaining(
            'Patient started INH treatment on (14-04-2021). Expected to end on (13-06-2021). 60 days remaining.'
          ),
          title: 'INH Treatment Reminder',
          type: 'danger'
        })
      ])
    );

    // Case 2: On INH treatment with less than a month of treatment remaining
    testClinicalRemindersData.is_on_inh_treatment = 1;
    testClinicalRemindersData.inh_treatment_days_remaining = 25;
    testClinicalRemindersData.ipt_completion_date = '2021-06-13';

    expect(
      patientReminderService.inhReminders(testClinicalRemindersData)
    ).toMatchObject(
      expect.arrayContaining([
        expect.objectContaining({
          display: { banner: true, toast: true },
          message: expect.stringContaining(
            'Patient has been on INH treatment for the last 5 months, expected to end on (13-06-2021)'
          ),
          title: 'INH Treatment Reminder',
          type: 'danger'
        })
      ])
    );
  });

  test('creates and returns a lab error reminder if there is a problem with the viral load order', () => {
    testClinicalRemindersData.ordered_vl_has_error = 1;
    testClinicalRemindersData.vl_error_order_date = '2021-06-13';

    expect(
      patientReminderService.viralLoadErrors(testClinicalRemindersData)
    ).toMatchObject(
      expect.arrayContaining([
        expect.objectContaining({
          display: { banner: true, toast: true },
          message: expect.stringContaining(
            'Viral load test that was ordered on: (13-06-2021) resulted to an error. Please re-order.'
          ),
          title: 'Lab Error Reminder',
          type: 'danger'
        })
      ])
    );
  });

  test('creates and returns a overdue VL reminder if the viral load order is overdue', () => {
    testClinicalRemindersData.overdue_vl_lab_order = 1;
    testClinicalRemindersData.vl_order_date = '2021-06-13';

    expect(
      patientReminderService.pendingViralOrder(testClinicalRemindersData)
    ).toMatchObject(
      expect.arrayContaining([
        expect.objectContaining({
          display: { banner: true, toast: true },
          message: expect.stringContaining(
            `No result reported for patient's viral load test drawn on (13-06-2021) days ago Please follow up with lab or redraw new specimen.`
          ),
          title: 'Overdue Viral Load Order',
          type: 'danger'
        })
      ])
    );
  });

  test(`aggregates and returns a collection of the patient's reminders`, async () => {
    const testEtlData = [
      {
        birth_date: '1982-12-31T21:00:00',
        dna_pcr_reminder: 0,
        has_dst_result: 0,
        has_gene_xpert_result: 0,
        inh_treatment_days_remaining: null,
        ipt_completion_date: null,
        ipt_start_date: null,
        is_infant: 0,
        is_on_inh_treatment: 0,
        is_postnatal: 0,
        is_pregnant: 0,
        last_vl_date: '2020-06-13T09:12:54',
        months_since_last_vl_date: 10,
        needs_vl_coded: 3,
        new_viral_load_present: 1,
        person_id: 123456789,
        person_uuid: 'test-patient-person-uuid',
        qualifies_differenciated_care: 0,
        qualifies_enhanced: 0,
        ordered_vl_has_error: 0,
        overdue_vl_lab_order: 0,
        viral_load: 0,
        vl_error_order_date: null,
        vl_order_date: null
      }
    ];

    const testEidData = [
      {
        id: 123456789,
        order_number: 'ORD-987654321',
        facility_code: 987654321,
        AMRs_location: 1,
        full_names: 'Yet Another Test Patient',
        date_collected: '2020-06-13',
        date_received: '2020-06-14',
        date_tested: '2020-06-15',
        interpretation: '< 20',
        result: '< LDL copies/ml',
        date_dispatched: '2020-06-20',
        sample_status: 'Complete',
        result_log: null,
        patient: '783378687-9'
      }
    ];

    mockGetProgramEnrollmentsByPatientUuid.mockResolvedValue({ results: [] });
    mockGetPatientEncountersByEncounterType.mockResolvedValue({ results: [] });

    await patientReminderService
      .generateReminders(testEtlData, testEidData)
      .then((aggregatedReminders) => {
        expect(aggregatedReminders).toBeDefined();
        expect(aggregatedReminders).toHaveProperty('reminders');
        expect(aggregatedReminders.reminders.length).toEqual(2);
        expect(aggregatedReminders.reminders).toMatchObject(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'New viral load result: LDL (collected on 13-06-2020).',
              title: 'New Viral Load present'
            })
          ])
        );
        expect(aggregatedReminders.reminders).toMatchObject(
          expect.arrayContaining([
            expect.objectContaining({
              message:
                'No contact tracing has been done for this index, please fill the  contact tracing form',
              title: 'Contact Tracing Reminder'
            })
          ])
        );
      });
  });
});
