import { Json2Sql } from 'ampath-json2sql';
import { Promise } from 'bluebird';
import QueryService from '../database-access/query.service';
import ReportProcessorHelpersService from './report-processor-helpers.service';

// TODO: Move to data store
import * as moh_731_greencard from './json-reports/moh-731-greencard.json';
import * as moh_731_bluecard from './json-reports/moh-731-bluecard.json';
import * as main_dataset_aggregate from './json-reports/main-dataset-aggregate.json';
import * as main_dataset_aggregate_blue_card from './json-reports/main-dataset-aggregate-bluecard.json';
import * as main_dataset_aggregate_age_disaggregation from './json-reports/main-dataset-aggregate-age-disaggregation';
import * as main_dataset_aggregate_no_disaggregation from './json-reports/main-dataset-aggregate-no-disaggregation';
import * as main_dataset_aggregate_age15_disaggregation from './json-reports/main-dataset-aggregate-age15-disaggregation';
import * as main_dataset_aggregate_age18_disaggregation from './json-reports/main-dataset-aggregate-age18-disaggregation';
import * as main_dataset_base from './json-reports/main-dataset-base.json';
import * as main_dataset_base_blue_card from './json-reports/main-dataset-base-blue-card.json';
import * as main_dataset_base_age15 from './json-reports/main-dataset-base-age15.json';
import * as main_dataset_base_age18 from './json-reports/main-dataset-base-age18.json';
import * as regimen_dataset_aggregate from './json-reports/regimen-dataset-aggregate.json';
import * as regimen_dataset_base from './json-reports/regimen-dataset-base.json';
import * as retention_dataset_aggregate from './json-reports/retention-dataset-aggregate.json';
import * as retention_dataset_base from './json-reports/retention-dataset-base.json';
import * as pep_dataset_aggregate from './json-reports/pep-dataset-aggregate.json';
import * as pep_dataset_base from './json-reports/pep-dataset-base.json';
import * as patient_list_template from './json-reports/patient-list-template.json';
import * as patient_list_schedules_template from './json-reports/patient-list-schedules-template.json';
import * as patient_list_frozen_template from './json-reports/patient-list-frozen-template.json';
import * as ever_on_art_aggregate from './json-reports/ever-on-art-aggregate.json';
import * as ever_on_art_disaggregation from './json-reports/ever-on-art-disaggregation.json';
import * as ever_on_art_base from './json-reports/ever-on-art-base.json';
import * as referral_patient_list_template from './json-reports/referral-patient-list-template.json';
import * as referral_dataset_base from './json-reports/referral-dataset-base.json';
import * as referral_aggregate from './json-reports/referral-aggregate.json';
import * as referral_peer_aggregate from './json-reports/referral-peer-aggregate.json';
import * as referral_patient_list_peer_base from './json-reports/referral-peer-base.json';
import * as cdm_dataset_base from './json-reports/cdm/cdm-dataset-base.json';
import * as starting_art_aggregation_age15 from './json-reports/starting-art-aggregation-age15.json';
import * as starting_art_base_age15 from './json-reports/starting-art-base-age15.json';
import * as starting_art_disaggregation_age15 from './json-reports/starting-art-disaggregation-age15.json';

//PMTC RRI
// import * as pmtc_rri_dataset_base from './json-reports/rri/pmtct-rri-dataset-base.json';
import * as pmtct_rri from './json-reports/rri/pmtct-rri.json';
import * as pmtct_rri_cal_hiv_aggregate from './json-reports/rri/pmtct-rri-cal-hiv-aggregate.json';
import * as pmtct_rri_pbfw_aggregate from './json-reports/rri/pmtct-rri-pbfw-aggregate.json';
import * as pmtct_rri_wra_aggregate from './json-reports/rri/pmtct-rri-wra-aggregate.json';
import * as pmtct_rri_hei_aggregate from './json-reports/rri/hei-infant-rri-testing-aggregate.json';
import * as pmtc_rri_hei_dataset_base from './json-reports/rri/hei-infant-rri-testing-base.json';
import * as pmtc_rri_calhiv_dataset_base from './json-reports/rri/pmtct-rri-calhiv-dataset-base.json';
import * as pmtc_rri__pbfw_dataset_base from './json-reports/rri/pmtct-rri-pbfw-dataset-base.json';
import * as pmtct_rri_patient_list_template from './json-reports/rri/pmtct_rri_patient_list_template.json';
import * as pmtc_rri_wra_dataset_base from './json-reports/rri/pmtct-rri-wra-dataset-base.json';

import * as starting_art_aggregation_age_green from './json-reports/starting-art-aggregation-age-green.json';
import * as starting_art_base_age_green from './json-reports/starting-art-base-age-green.json';
import * as starting_art_disaggregation_age_green from './json-reports/starting-art-disaggregation-age-green.json';
import * as starting_art_disaggregation_age_only_green from './json-reports/starting-art-disaggregation-age-only-green.json';
import * as medical_history_dataset_base from './json-reports/medical-history-dataset-base.json';
import * as patint_change_status_tracker_base from './json-reports/patint-change-status-tracker-base.json';
import * as hiv_monthly_summary_dataset_base from './json-reports/hiv-monthly-summary-dataset-base.json';
import * as hiv_monthly_summary_dataset_aggregation from './json-reports/hiv-monthly-summary-aggregate.json';

import * as clinic_comparator_aggregate from './json-reports/clinic-comparator-aggregate.json';
import * as clinic_comparator_base from './json-reports/clinic-comparator-base.json';

import * as dataentry_statistics_aggregate from './json-reports/dataentry-statistics-aggregate.json';
import * as dataentry_statistics_base from './json-reports/dataentry-statistics-base.json';

import * as hiv_summary_aggregate from './json-reports/hiv-summary-aggregate.json';
import * as hiv_summary_base from './json-reports/hiv-summary-base.json';
import * as patient_flow from './json-reports/patient-flow.json';
import * as clinical_art_overview_aggregate from './json-reports/clinical-art-overview-aggregate.json';
import * as clinical_art_overview_base from './json-reports/clinical-art-overview-base.json';
import * as clinical_hiv_comparative_overview_aggregate from './json-reports/clinical-hiv-comparative-overview-aggregate.json';
import * as clinical_hiv_comparative_overview_base from './json-reports/clinical-hiv-comparative-overview-base.json';
import * as daily_has_not_returned_aggregate from './json-reports/daily-has-not-returned-aggregate.json';
import * as daily_has_not_returned_base from './json-reports/daily-has-not-returned-base.json';
import * as daily_has_not_returned_cohort from './json-reports/daily-has-not-returned-cohort.json';
import * as next_drug_pickup_encounter_base from './json-reports/next-drug-pickup-encounter.base.json';
import * as daily_appointments_aggregate from './json-reports/daily-appointments-aggregate.json';
import * as daily_appointments_base from './json-reports/daily-appointments-base.json';
import * as daily_appointment_latest_rtc_cohort_base from './json-reports/daily-appointment-latest-rtc-cohort-base.json';
import * as daily_attendance_aggregate from './json-reports/daily-attendance-aggregate.json';
import * as daily_attendance_base from './json-reports/daily-attendance-base.json';
import * as patint_change_status_tracker_aggregate from './json-reports/patint-change-status-tracker-aggregate.json';
import * as labs_report_aggregate from './json-reports/labs-report-aggregate.json';
import * as labs_report_base from './json-reports/labs-report-base.json';
import * as labs_and_imaging_dataset_base from './json-reports/labs-and-imaging-dataset-base.json';
import * as patients_requiring_viral_load_template from './json-reports/patients-requiring-viral-load-template.json';
import * as clinic_lab_orders_report from './json-reports/clinic-lab-orders-report-base.json';
import * as clinical_reminders_report from './json-reports/clinical-reminder-report.json';

import * as breast_cancer_daily_screening_summary_aggregate from './json-reports/breast-cancer-daily-screening-summary-aggregate.json';
import * as breast_cancer_monthly_screening_summary_aggregate from './json-reports/breast-cancer-monthly-screening-summary-aggregate.json';
import * as breast_cancer_monthly_screening_summary_base from './json-reports/breast-cancer-monthly-screening-summary-base.json';
import * as breast_cancer_patient_list_template from './json-reports/breast-cancer-patient-list-template.json';

import * as lung_cancer_treatment_monthly_summary_aggregate from './json-reports/lung-cancer-treatment-monthly-summary-aggregate.json';
import * as lung_cancer_treatment_daily_summary_aggregate from './json-reports/lung-cancer-treatment-daily-summary-aggregate.json';
import * as lung_cancer_treatment_summary_base from './json-reports/lung-cancer-treatment-summary-base.json';
import * as lung_cancer_treatment_patient_list_template from './json-reports/lung-cancer-treatment-patient-list-template.json';
import * as lung_cancer_treatment_monthly_summary_base from './json-reports/lung-cancer-treatment-monthly-summary-base.json';

import * as cervical_cancer_daily_screening_summary_aggregate from './json-reports/cervical-cancer-daily-screening-summary-aggregate.json';
import * as cervical_cancer_monthly_screening_summary_aggregate from './json-reports/cervical-cancer-monthly-screening-summary-aggregate.json';
import * as cervical_cancer_monthly_screening_summary_base from './json-reports/cervical-cancer-monthly-screening-summary-base.json';

import * as patient_list_with_contacts_template from './json-reports/patient-list-with-contacts-template.json';
import * as enhanced_adherence_hiv_program_aggregate from './json-reports/enhanced-adherence-hiv-program-aggregate.json';
import * as enhanced_adherence_hiv_program_base from './json-reports/enhanced-adherence-hiv-program-base';
import * as patient_program_cohort from './json-reports/patient-program-cohort';
import * as enhanced_adherence_hiv_program_cohort from './json-reports/enhanced-adherence-hiv-program-cohort';

import * as currently_enrolled_patients_base from './json-reports/currently-enrolled-patients.base';
import * as currently_enrolled_patients_aggregate from './json-reports/currently-enrolled-patients-aggregate';
import * as combined_breast_cervical_cancer_daily_screening_summary_aggregate from './json-reports/combined-breast-cervical-cancer-daily-screening-summary-aggregate.json';
import * as combined_breast_cervical_cancer_monthly_screening_summary_aggregate from './json-reports/combined-breast-cervical-cancer-monthly-screening-summary-aggregate.json';
import * as combined_breast_cervical_cancer_monthly_screening_summary_base from './json-reports/combined-breast-cervical-cancer-monthly-screening-summary-base.json';
import * as combined_breast_cervical_cancer_daily_screening_summary_base from './json-reports/combined-breast-cervical-cancer-daily-screening-summary-base.json';
import * as combined_breast_cervical_cancer_patient_list_template from './json-reports/combined-breast-cervical-cancer-patient-list-template.json';

import * as lung_cancer_daily_screening_summary_aggregate from './json-reports/lung-cancer-daily-screening-summary-aggregate.json';
import * as lung_cancer_monthly_screening_summary_aggregate from './json-reports/lung-cancer-monthly-screening-summary-aggregate.json';
import * as lung_cancer_monthly_screening_summary_base from './json-reports/lung-cancer-monthly-screening-summary-base.json';
import * as lung_cancer_patient_list_template from './json-reports/lung-cancer-patient-list-template.json';

import * as differentiated_care_program_aggregate from './json-reports/differentiated-care-program-aggregate.json';
import * as differentiated_care_program_base from './json-reports/differentiated-care-program-base.json';
import * as differentiated_care_weight_dataset from './json-reports/differentiated-care-weight-dataset.json';

// appointment adherence
import * as appointment_adherence from './json-reports/retention-report/appointment-adherence.json';
import * as retention_appointment_adherence_aggregate from './json-reports/retention-appointment-adherence-aggregate';
import * as retention_appointment_adherence_base from './json-reports/retention-appointment-adherence-base.json';
import * as retention_report_patient_list_template from './json-reports/retention-report-patient-list-template.json';
// defaulter tracing
import * as retention_defaulter_tracing_base from './json-reports/retention-defaulter-tracing-base.json';
import * as retention_defaulter_tracing_aggregate from './json-reports/retention-defaulter-tracing-aggregate.json';
// retention visits
import * as retention_visits_base from './json-reports/retention-report-visits-base.json';
import * as retention_visits_aggregate from './json-reports/retention-report-visits-aggregate.json';
import * as retention_intervention_cohort from './json-reports/retention-intervention-cohort.json';
import * as retention_ltfu_base from './json-reports/retention-ltfu-base.json';
import * as retention_ltfu_aggregate from './json-reports/retention-ltfu-aggregate.json';

import * as surge_report_base from './json-reports/surge-report-base.json';
import * as surge_report_aggregate from './json-reports/surge-report-aggregate.json';

import * as surge_daily_report_base from './json-reports/surge-daily-report-base';
import * as surge_daily_report_aggregate from './json-reports/surge-daily-report-aggregate';
import * as surge from './json-reports/surge-report.json';
import * as prep_base_report from './json-reports/prep-base-report.json';
import * as prep_aggregate_report from './json-reports/prep-aggregate-report.json';
import * as prep_dataset_report from './json-reports/prep-dataset-report.json';
import * as ltfu_surge_baseline_report from './json-reports/ltfus-surge-baseline-base.json';
import * as ltfu_surge_baseline_aggregate_report from './json-reports/ltfus-surge-baseline-aggregate.json';
import * as prep_report_patient_list_template from './json-reports/prep-report-patient-list-template.json';
import * as pmtct_rri_report_patient_list_template from './json-reports/rri/pmtct_rri_patient_list_template.json';

import * as hiv_latest_clinical_encounter_date_base from './json-reports/hiv-latest-clinical-encounter-date-base.json';
import * as prep_monthly_summary from './json-reports/prep-monthly-summary.json';
import * as prep_monthly_summary_aggregate_report from './json-reports/prep-monthly-summary-aggregate.json';
import * as prep_monthly_summary_base_report from './json-reports/prep-monthly-summary-base.json';
import * as prep_monthly_populationtype_disaggregation from './json-reports/prep-monthly-population-type-disaggregation.json';
import * as prep_monthly_breastfeeding_disaggregation from './json-reports/prep-monthly-breastfeeding-disaggregation.json';
import * as prep_monthly_pregnancy_disaggregation from './json-reports/prep-monthly-pregnancy-disaggregation.json';
import * as prep_monthly_newly_enrolled_breastfeeding_disaggregation from './json-reports/prep-monthly-newly-enrolled-breastfeeding-disaggregation.json';
import * as prep_monthly_newly_enrolled_pregnancy_disaggregation from './json-reports/prep-monthly-newly-enrolled-pregnancy-disaggregation.json';
import * as prep_latest_clinical_encounter_date_base from './json-reports/prep_latest_clinical_encounter_date_base.json';
import * as prep_initial_encounter_date from './json-reports/prep-initial-encounter-date.json';
import * as prep_clinical_remainder from './json-reports/prep-clinical-reminder-report.json';
import * as moh_408 from './json-reports/moh-408.json';
import * as hei_infant_feeding_aggregate from './json-reports/hei-infant-feeding-aggregate.json';
import * as hei_infant_feeding_base from './json-reports/hei-infant-feeding-base.json';
import * as hei_infant_feeding_no_disaggregation_aggregate from './json-reports/hei-infant-feeding-no-disaggregation-aggregate.json';
import * as hei_infant_feeding_no_disaggregation_base from './json-reports/hei-infant-feeding-no-disaggregation-base.json';
import * as hei_infant_testing_base from './json-reports/hei-infant-testing-base.json';
import * as hei_infant_testing_aggregate from './json-reports/hei-infant-testing-aggregate.json';
import * as hei_retention_pairs_base from './json-reports/hei-retention-pairs-base.json';
import * as hei_retention_pairs_aggregate from './json-reports/hei-retention-pairs-aggregate.json';
import * as hei_mother_base from './json-reports/hei-mother-base.json';
import * as hei_mother_aggregate from './json-reports/hei-mother-aggregate.json';
import * as hei_program_outcome_base from './json-reports/hei-program-outcome-base.json';
import * as hei_program_outcome_aggregate from './json-reports/hei-program-outcome-aggregate.json';
import * as hei_original_cohort_base from './json-reports/hei-original-cohort-base.json';
import * as hei_original_cohort_aggregate from './json-reports/hei-original-cohort-aggregate.json';
import * as hei_unknown_program_outcome_aggregate from './json-reports/hei-unknown-program-outcome-aggregate.json';
import * as hei_unknown_program_outcome_base from './json-reports/hei-unknown-program-outcome-base.json';
import * as hei_report_patient_list_template from './json-reports/hei-report-patient-list-template.json';

import * as patient_gain_loses_base from './json-reports/patient-gain-loses-base.json';
import * as patient_gain_loses_aggregate from './json-reports/patient-gain-loses-aggregate.json';
import * as patient_gain_lose_dataset_1 from './json-reports/patient-gain-lose-dataset-1.json';
import * as patient_gain_lose_dataset_2 from './json-reports/patient-gain-lose-dataset-2.json';

import * as ovc_report from './json-reports/ovc-report.json';
import * as ovc_in_hiv_dataset_base from './json-reports/ovc-in-hiv-dataset-base.json';
import * as ovc_in_hiv_dataset_aggregate from './json-reports/ovc-in-hiv-dataset-aggregate.json';
import * as ovc_in_hei_dataset_base from './json-reports/ovc-in-hei-dataset-base.json';
import * as ovc_in_hei_dataset_aggregate from './json-reports/ovc-in-hei-dataset-aggregate.json';
import * as ovc_patient_list_template from './json-reports/ovc-patient-list-template.json';
import * as ovc_in_hei_patient_list_template from './json-reports/ovc-in-hei-patient-list-template.json';

import * as tb_preventive_ipt_monthly_summary_aggregate from './json-reports/tb-preventive-ipt-monthly-summary-aggregate.json';
import * as tb_preventive_monthly_summary_aggregate from './json-reports/tb-preventive-monthly-summary-aggregate.json';
import * as tb_preventive_dataSet_base from './json-reports/tb-preventive-dataset-base.json';
import * as tb_preventive_report from './json-reports/tb-preventive-report.json';

import * as monthly_gains_losses from './json-reports/gains-and-losses/monthly-gains-and-losses.json';
import * as hiv_monthly_loss_aggregate from './json-reports/hiv-monthly-losses-aggregate.json';
import * as hiv_monthly_loss_base from './json-reports/hiv-monthly-losses-base.json';
import * as hiv_monthly_gains_aggregate from './json-reports/hiv-monthly-gains-aggregate.json';
import * as hiv_monthly_gains_base from './json-reports/hiv-monthly-gains-base.json';
import * as patient_gains_and_losses_patient_list_template from './json-reports/patient-gains-and-losses-patient-list-template.json';

//MOH-412 HIV Cervical Cancer Screening
import * as hiv_cervical_cancer_screening_monthly_report from './json-reports/moh-412/cervical-cancer-screening-monthly-report.json';
import * as hiv_cervical_cancer_screening_monthly_pcf_report from './json-reports/moh-412/cervical-cancer-screening-monthly-pcf-report.json';
import * as hiv_cervical_cancer_screening_monthly_aggregate from './json-reports/hiv-cervical-cancer-screening-monthly-aggregate.json';
import * as hiv_cervical_cancer_screening_monthly_pcf_aggregate from './json-reports/hiv-cervical-cancer-screening-monthly-pcf-aggregate.json';
import * as hiv_cervical_cancer_screening_monthly_base from './json-reports/hiv-cervical-cancer-screening-monthly-base.json';
import * as hiv_cervical_cancer_positive_screening_monthly_aggregate from './json-reports/hiv-cervical-cancer-positive-screening-monthly-aggregate.json';
import * as hiv_cervical_cancer_positive_screening_monthly_pcf_aggregate from './json-reports/hiv-cervical-cancer-positive-screening-monthly-pcf-aggregate.json';
import * as hiv_cervical_cancer_positive_screening_monthly_base from './json-reports/hiv-cervical-cancer-positive-screening-monthly-base.json';
import * as hiv_cervical_cancer_treatment_monthly_aggregate from './json-reports/hiv-cervical-cancer-treatment-monthly-aggregate.json';
import * as hiv_cervical_cancer_treatment_monthly_pcf_aggregate from './json-reports/hiv-cervical-cancer-treatment-monthly-pcf-aggregate.json';
import * as hiv_cervical_cancer_treatment_monthly_base from './json-reports/hiv-cervical-cancer-treatment-monthly-base.json';
import * as hiv_positive_cervical_cancer_screening_monthly_aggregate from './json-reports/hiv-positive-cervical-cancer-screening-monthly-aggregate.json';
import * as hiv_positive_cervical_cancer_screening_monthly_pcf_aggregate from './json-reports/hiv-positive-cervical-cancer-screening-monthly-pcf-aggregate.json';
import * as hiv_positive_cervical_cancer_screening_monthly_base from './json-reports/hiv-positive-cervical-cancer-screening-monthly-base.json';
import * as hiv_cervical_cancer_screening_monthly_main_dataset_aggregate from './json-reports/hiv-cervical-cancer-screening-monthly-main-dataset-aggregate.json';
import * as hiv_cervical_cancer_screening_monthly_main_dataset_pcf_aggregate from './json-reports/hiv-cervical-cancer-screening-monthly-main-dataset-pcf-aggregate.json';
import * as hiv_cervical_cancer_screening_monthly_main_dataset_base from './json-reports/hiv-cervical-cancer-screening-monthly-main-dataset-base.json';
import * as hiv_cervical_cancer_monthly_summary_lesions_base from './json-reports/hiv-cervical-cancer-monthly-summary-lesions-base.json';
import * as hiv_cervical_cancer_monthly_summary_lesions_aggregate from './json-reports/hiv-cervical-cancer-monthly-summary-lesions-aggregate.json';
import * as hiv_cervical_cancer_monthly_summary_lesions_pcf_aggregate from './json-reports/hiv-cervical-cancer-monthly-summary-lesions-pcf-aggregate.json';

import * as defaulter_list_aggregate from './json-reports/defaulter-list-aggregate.json';
import * as defaulter_list_base from './json-reports/defaulter-list-base.json';

// ML Weekly Predictions
import * as ml_weekly_predictions_aggregate from './json-reports/ml-predictions/ml-weekly-predictions-aggregate.json';
import * as ml_weekly_predictions_base from './json-reports/ml-predictions/ml-weekly-predictions-base.json';

//clinic clow report
import * as clinic_flow_provider_statistics_aggregate from './json-reports/clinic-flow-provider-statistics-aggregate.json';
import * as clinic_flow_provider_statistics_base from './json-reports/clinic-flow-provider-statistics-base.json';

// (New) Prep monthly report
import * as eligible_for_prep_aggregate from './json-reports/prep-monthly/disaggregations/eligibility/eligible-for-prep-aggregate.json';
import * as eligible_for_prep_base from './json-reports/prep-monthly/disaggregations/eligibility/eligible-for-prep-base.json';
import * as reasons_for_initiation_prep_aggregate from './json-reports/prep-monthly/disaggregations/reasons_for_initiation/prep-reasons-for-initiation-aggregate.json';
import * as reasons_for_initiation_prep_base from './json-reports/prep-monthly/disaggregations/reasons_for_initiation/prep-reasons-for-initiation-base.json';

import * as new_for_prep_aggregate from './json-reports/prep-monthly/disaggregations/new/new-for-prep-aggregate.json';
import * as new_for_prep_base from './json-reports/prep-monthly/disaggregations/new/new-for-prep-base.json';

import * as prep_event_driven_aggregate from './json-reports/prep-monthly/disaggregations/event-driven/prep-event-driven-aggregate.json';
import * as prep_event_driven_base from './json-reports/prep-monthly/disaggregations/event-driven/prep-event-driven-base.json';

import * as restarting_prep_aggregate from './json-reports/prep-monthly/disaggregations/restarting/restarting-prep-aggregate.json';
import * as restarting_prep_base from './json-reports/prep-monthly/disaggregations/restarting/restarting-prep-base.json';

import * as while_on_prep_aggregate from './json-reports/prep-monthly/disaggregations/while-on-prep/while-on-prep-aggregate.json';
import * as while_on_prep_base from './json-reports/prep-monthly/disaggregations/while-on-prep/while-on-prep-base.json';

import * as discounted_prep_aggregate from './json-reports/prep-monthly/disaggregations/discontinued/discontinued-prep-aggregate.json';
import * as discounted_prep_base from './json-reports/prep-monthly/disaggregations/discontinued/discontinued-prep-base.json';

import * as gbv_prep_aggregate from './json-reports/prep-monthly/disaggregations/reasons_for_initiation/gbv-aggregate.json';
import * as gbv_prep_base from './json-reports/prep-monthly/disaggregations/reasons_for_initiation/gbv-base.json';

import * as transactional_sex_prep_aggregate from './json-reports/prep-monthly/disaggregations/reasons_for_initiation/transactional-sex-aggregate.json';
import * as transactional_sex_prep_base from './json-reports/prep-monthly/disaggregations/reasons_for_initiation/transactional-sex-base.json';

import * as recent_sti_prep_aggregate from './json-reports/prep-monthly/disaggregations/reasons_for_initiation/recent-sti-aggregate.json';
import * as recent_sti_prep_base from './json-reports/prep-monthly/disaggregations/reasons_for_initiation/recent-sti-base.json';

import * as recurrent_use_of_pep_prep_aggregate from './json-reports/prep-monthly/disaggregations/reasons_for_initiation/recurrent-use-of-pep-aggregate.json';
import * as recurrent_use_of_pep_prep_base from './json-reports/prep-monthly/disaggregations/reasons_for_initiation/recurrent-use-of-pep-base.json';

import * as inconsistent_or_no_condom_use_prep_aggregate from './json-reports/prep-monthly/disaggregations/reasons_for_initiation/inconsistent-or-no-condom-use-aggregate.json';
import * as inconsistent_or_no_condom_use_prep_base from './json-reports/prep-monthly/disaggregations/reasons_for_initiation/inconsistent-or-no-condom-use-base.json';

import * as other_reasons_prep_aggregate from './json-reports/prep-monthly/disaggregations/reasons_for_initiation/other-reasons-aggregate.json';
import * as other_reasons_prep_base from './json-reports/prep-monthly/disaggregations/reasons_for_initiation/other-reasons-base.json';

import * as shared_needles_prep_aggregate from './json-reports/prep-monthly/disaggregations/reasons_for_initiation/shared-needles-aggregate.json';
import * as shared_needles_prep_base from './json-reports/prep-monthly/disaggregations/reasons_for_initiation/shared-needles-base.json';

import * as tested_hiv_positive_prep_aggregate from './json-reports/prep-monthly/disaggregations/discontinued/tested-positive-aggregate.json';
import * as tested_hiv_positive_prep_base from './json-reports/prep-monthly/disaggregations/discontinued/tested-positive-base.json';

import * as low_risk_for_hiv_prep_aggregate from './json-reports/prep-monthly/disaggregations/discontinued/low-risk-for-hiv-aggregate.json';
import * as low_risk_for_hiv_prep_base from './json-reports/prep-monthly/disaggregations/discontinued/low-risk-for-hiv-base.json';

import * as prep_side_effects_prep_aggregate from './json-reports/prep-monthly/disaggregations/discontinued/prep-side-effects-aggregate.json';
import * as prep_side_effects_prep_base from './json-reports/prep-monthly/disaggregations/discontinued/prep-side-effects-base.json';

import * as non_adherence_prep_aggregate from './json-reports/prep-monthly/disaggregations/discontinued/non-adherence-aggregate.json';
import * as non_adherence_prep_base from './json-reports/prep-monthly/disaggregations/discontinued/non-adherence-base.json';

import * as viral_suppression_of_hiv_positive_partner_prep_aggregate from './json-reports/prep-monthly/disaggregations/discontinued/viral-suppression-of-hiv-positive-partner-aggregate.json';
import * as viral_suppression_of_hiv_positive_partner_prep_base from './json-reports/prep-monthly/disaggregations/discontinued/viral-suppression-of-hiv-positive-partner-base.json';

import * as too_many_hiv_tests_prep_aggregate from './json-reports/prep-monthly/disaggregations/discontinued/too-many-hiv-tests-aggregate.json';
import * as too_many_hiv_tests_prep_base from './json-reports/prep-monthly/disaggregations/discontinued/too-many-hiv-tests-base.json';

import * as partner_refusal_prep_aggregate from './json-reports/prep-monthly/disaggregations/discontinued/partner-refusal-aggregate.json';
import * as partner_refusal_prep_base from './json-reports/prep-monthly/disaggregations/discontinued/partner-refusal-base.json';

import * as partner_violence_prep_aggregate from './json-reports/prep-monthly/disaggregations/discontinued/partner-violence-aggregate.json';
import * as partner_violence_prep_base from './json-reports/prep-monthly/disaggregations/discontinued/partner-violence-base.json';

import * as died_prep_aggregate from './json-reports/prep-monthly/disaggregations/discontinued/died-aggregate.json';
import * as died_prep_base from './json-reports/prep-monthly/disaggregations/discontinued/died-base.json';

import * as transfer_outs_prep_aggregate from './json-reports/prep-monthly/disaggregations/discontinued/transfer-outs-aggregate.json';
import * as transfer_outs_prep_base from './json-reports/prep-monthly/disaggregations/discontinued/transfer-outs-base.json';

import * as missed_drug_pickups_prep_aggregate from './json-reports/prep-monthly/disaggregations/discontinued/missed-drug-pickups-aggregate.json';
import * as missed_drug_pickups_prep_base from './json-reports/prep-monthly/disaggregations/discontinued/missed-drug-pickups-base.json';

import * as any_other_reason_prep_aggregate from './json-reports/prep-monthly/disaggregations/discontinued/any-other-reason-aggregate.json';
import * as any_other_reason_prep_base from './json-reports/prep-monthly/disaggregations/discontinued/any-other-reason-base.json';

import * as prep_monthly_report from './json-reports/prep-monthly/prep-report.json';

//covid 19 report
import * as patient_list_covid_template from './json-reports/patient-list-covid-template.json';
import * as covid_19_summary_aggregate from './json-reports/covid-19-summary-report-aggregate.json';
import * as covid_19_summary_base from './json-reports/covid-19-summary-report-base.json';
import * as covid_19_cumulative_summary_aggregate from './json-reports/covid19-cumulative-summary-report-aggregate.json';
import * as covid_19_cumulative_summary_base from './json-reports/covid19-cumulative-summary-report-base.json';
import * as on_art_15_and_above_aggregate from './json-reports/hiv-monthly-on-art-15-and-above-report-aggregate.json';
import * as on_art_15_and_above_base from './json-reports/hiv-monthly-on-art-15-and-above-report-base.json';
import * as covid_19_monthly_report from './json-reports/covid-19/covid-19-monthly-report.json';
import * as hiv_monthly_not_screened_for_covid_aggregate from './json-reports/hiv-monthly-not-screened-for-covid-aggregate.json';
import * as hiv_monthly_not_screened_for_covid_base from './json-reports/hiv-monthly-not-screened-for-covid-base.json';

//tx-ml report
import * as txml_aggregate_report from './json-reports/tx-reports/tx-ml/tx-ml-report-aggregate.json';
import * as txml_rst_report_aggregate from './json-reports/tx-reports/tx-ml/tx-ml-rst-report-aggregate.json';
import * as txml_to_report_aggregate from './json-reports/tx-reports/tx-ml/tx-ml-to-report-aggregate.json';
import * as txml_iitabove6_report_aggregate from './json-reports/tx-reports/tx-ml/tx-ml-iitabove6-report-aggregate.json';
import * as txml_iit35_report_aggregate from './json-reports/tx-reports/tx-ml/tx-ml-iit35-report-aggregate.json';
import * as txml_iitless3_report_aggregate from './json-reports/tx-reports/tx-ml/tx-ml-iitless3-report-aggregate.json';
import * as txml_base_report from './json-reports/tx-reports/tx-ml/tx-ml-report-base.json';
import * as txml_rst_report_base from './json-reports/tx-reports/tx-ml/tx-ml-rst-report-base.json';
import * as txml_to_report_base from './json-reports/tx-reports/tx-ml/tx-ml-to-report-base.json';
import * as txml_iitabove6_report_base from './json-reports/tx-reports/tx-ml/tx-ml-iitabove6-report-base.json';
import * as txml_iit35_report_base from './json-reports/tx-reports/tx-ml/tx-ml-iit35-report-base.json';
import * as txml_iitless3_report_base from './json-reports/tx-reports/tx-ml/tx-ml-iitless3-report-base.json';
import * as patient_list_txml_template from './json-reports/tx-reports/tx-ml/patient-list-txml-template.json';
import * as txml_summary from './json-reports/txml-summary.json';

//tx-new report
import * as txnew_aggregate_report from './json-reports/tx-reports/tx-new/tx-new-report-aggregate.json';
import * as txnew_base_report from './json-reports/tx-reports/tx-new/tx-new-report-base.json';
import * as txnew_summary from './json-reports/txnew-summary.json';

//tx-curr report
import * as txcurr_aggregate_report from './json-reports/tx-reports/tx-curr/tx-curr-report-aggregate.json';
import * as txcurr_base_report from './json-reports/tx-reports/tx-curr/tx-curr-report-base.json';
import * as txcurr_summary from './json-reports/txcurr-summary.json';

//tx-mmd report
import * as tx1mms_aggregate_report from './json-reports/tx-reports/tx-mmd/tx-1mms-report-aggregate.json';
import * as tx1mms_base_report from './json-reports/tx-reports/tx-mmd/tx-1mms-report-base.json';
import * as tx2mms_aggregate_report from './json-reports/tx-reports/tx-mmd/tx-2mms-report-aggregate.json';
import * as tx2mms_base_report from './json-reports/tx-reports/tx-mmd/tx-2mms-report-base.json';
import * as tx3mmd_aggregate_report from './json-reports/tx-reports/tx-mmd/tx-3mmd-report-aggregate.json';
import * as tx3mmd_base_report from './json-reports/tx-reports/tx-mmd/tx-3mmd-report-base.json';
import * as tx4mmd_aggregate_report from './json-reports/tx-reports/tx-mmd/tx-4mmd-report-aggregate.json';
import * as tx4mmd_base_report from './json-reports/tx-reports/tx-mmd/tx-4mmd-report-base.json';
import * as tx5mmd_aggregate_report from './json-reports/tx-reports/tx-mmd/tx-5mmd-report-aggregate.json';
import * as tx5mmd_base_report from './json-reports/tx-reports/tx-mmd/tx-5mmd-report-base.json';
import * as tx6mmd_aggregate_report from './json-reports/tx-reports/tx-mmd/tx-6mmd-report-aggregate.json';
import * as tx6mmd_base_report from './json-reports/tx-reports/tx-mmd/tx-6mmd-report-base.json';
import * as txmmd_summary from './json-reports/txmmd-summary.json';

//tx-rtt report
import * as txrtt_aggregate_report from './json-reports/tx-reports/tx-rtt/tx-rtt-report-aggregate.json';
import * as txrtt_base_report from './json-reports/tx-reports/tx-rtt/tx-rtt-report-base.json';
import * as txrtt_summary from './json-reports/txrtt-summary.json';

//plhiv-ncd report
import * as plhiv_ncd_v2_monthly_report from './json-reports/plhiv-ncd-v2-reports/plhiv-ncd-v2-report.json';

import * as htn_plhiv_base from './json-reports/plhiv-ncd-v2-reports/disaggregations/hypertensive/htn-base.json';
import * as htn_plhiv_aggregate from './json-reports/plhiv-ncd-v2-reports/disaggregations/hypertensive/htn-aggregate.json';

import * as dm_plhiv_base from './json-reports/plhiv-ncd-v2-reports/disaggregations/diabetic/dm-base.json';
import * as dm_plhiv_aggregate from './json-reports/plhiv-ncd-v2-reports/disaggregations/diabetic/dm-aggregate.json';

import * as mh_plhiv_base from './json-reports/plhiv-ncd-v2-reports/disaggregations/mental-health-disorder/mh-base.json';
import * as mh_plhiv_aggregate from './json-reports/plhiv-ncd-v2-reports/disaggregations/mental-health-disorder/mh-aggregate.json';

import * as dep_plhiv_base from './json-reports/plhiv-ncd-v2-reports/disaggregations/mental-health-disorder/depressive-base.json';
import * as dep_plhiv_aggregate from './json-reports/plhiv-ncd-v2-reports/disaggregations/mental-health-disorder/depressive-aggregate.json';

import * as anx_plhiv_base from './json-reports/plhiv-ncd-v2-reports/disaggregations/mental-health-disorder/anxiety-base.json';
import * as anx_plhiv_aggregate from './json-reports/plhiv-ncd-v2-reports/disaggregations/mental-health-disorder/anxiety-aggregate.json';

import * as bip_plhiv_base from './json-reports/plhiv-ncd-v2-reports/disaggregations/mental-health-disorder/bipolar-and-related-mh-base.json';
import * as bip_plhiv_aggregate from './json-reports/plhiv-ncd-v2-reports/disaggregations/mental-health-disorder/bipolar-and-related-mh-aggregate.json';

import * as per_plhiv_base from './json-reports/plhiv-ncd-v2-reports/disaggregations/mental-health-disorder/personality-mh-base.json';
import * as per_plhiv_aggregate from './json-reports/plhiv-ncd-v2-reports/disaggregations/mental-health-disorder/personality-mh-aggregate.json';

import * as fed_plhiv_base from './json-reports/plhiv-ncd-v2-reports/disaggregations/mental-health-disorder/feeding-and-eating-mh-base.json';
import * as fed_plhiv_aggregate from './json-reports/plhiv-ncd-v2-reports/disaggregations/mental-health-disorder/feeding-and-eating-mh-aggregate.json';

import * as ocd_plhiv_base from './json-reports/plhiv-ncd-v2-reports/disaggregations/mental-health-disorder/ocd-base.json';
import * as ocd_plhiv_aggregate from './json-reports/plhiv-ncd-v2-reports/disaggregations/mental-health-disorder/ocd-aggregate.json';

import * as genMD_plhiv_base from './json-reports/plhiv-ncd-v2-reports/disaggregations/mental-health-disorder/general-mental-disorder-base.json';
import * as genMD_plhiv_aggregate from './json-reports/plhiv-ncd-v2-reports/disaggregations/mental-health-disorder/general-mental-disorder-aggregate.json';

import * as stMD_plhiv_base from './json-reports/plhiv-ncd-v2-reports/disaggregations/mental-health-disorder/status-sub-total-base.json';
import * as stMD_plhiv_aggregate from './json-reports/plhiv-ncd-v2-reports/disaggregations/mental-health-disorder/status-sub-total-aggregate.json';

import * as totMD_plhiv_base from './json-reports/plhiv-ncd-v2-reports/disaggregations/mental-health-disorder/total-mh-base.json';
import * as totMD_plhiv_aggregate from './json-reports/plhiv-ncd-v2-reports/disaggregations/mental-health-disorder/total-mh-aggregate.json';

import * as cvd_plhiv_base from './json-reports/plhiv-ncd-v2-reports/disaggregations/cardiovascular-disease/cvd-base.json';
import * as cvd_plhiv_aggregate from './json-reports/plhiv-ncd-v2-reports/disaggregations/cardiovascular-disease/cvd-aggregate.json';

import * as neu_plhiv_base from './json-reports/plhiv-ncd-v2-reports/disaggregations/neurological-disease/neuro-base.json';
import * as neu_plhiv_aggregate from './json-reports/plhiv-ncd-v2-reports/disaggregations/neurological-disease/neuro-aggregate.json';

import * as rhe_plhiv_base from './json-reports/plhiv-ncd-v2-reports/disaggregations/rheumatologic-disease/rheu-base.json';
import * as rhe_plhiv_aggregate from './json-reports/plhiv-ncd-v2-reports/disaggregations/rheumatologic-disease/rheu-aggregate.json';

import * as kd_plhiv_base from './json-reports/plhiv-ncd-v2-reports/disaggregations/kidney-disease/kd-base.json';
import * as kd_plhiv_aggregate from './json-reports/plhiv-ncd-v2-reports/disaggregations/kidney-disease/kd-aggregate.json';
//ahd report
import * as ahd_monthly_summary from './json-reports/ahd_reports/ahd-monthly.json';
import * as ahd_monthly_aggregate from './json-reports/ahd_reports/ahd-monthly-aggregate.json';
import * as ahd_cohort_monthly_aggregate from './json-reports/ahd_reports/ahd-cohort-monthly-aggregate.json';
import * as ahd_monthly_dataset_base from './json-reports/ahd_reports/ahd-monthly-dataset-base.json';
import * as ahd_cohort_monthly_dataset_base from './json-reports/ahd_reports/ahd-cohort-monthly-dataset-base.json';
import * as ahd_monthly_patient_list_template from './json-reports/ahd_reports/ahd_monthly_patient_list_template_post.json';
export class BaseMysqlReport {
  constructor(reportName, params) {
    this.reportName = reportName;
    this.params = params;
  }

  generateReport() {
    // 1. Fetch report schema
    // 2. Generate report sql using json2sql
    // 3. Execute sql statement using sql generator
    const that = this;
    return new Promise((resolve, error) => {
      // fetch reports
      that
        .fetchReportSchema(that.reportName)
        .then((reportSchemas) => {
          that.reportSchemas = reportSchemas;
          // generate query
          that
            .generateReportQuery(that.reportSchemas, that.params)
            .then((sqlQuery) => {
              // allow user to use 'null' as parameter values
              sqlQuery = sqlQuery.replace(/\'null\'/g, 'null');

              that.reportQuery = sqlQuery;
              // run query
              console.log('Query', sqlQuery);
              that
                .executeReportQuery(that.reportQuery)
                .then((result) => {
                  return that.transFormResults(that.reportSchemas, result);
                })
                .then((results) => {
                  that.queryResults = results;

                  resolve({
                    schemas: that.reportSchemas,
                    sqlQuery: that.reportQuery,
                    results: that.queryResults
                  });
                })
                .catch((err) => {
                  error(err);
                });
            })
            .catch((err) => {
              error(err);
            });
        })
        .catch((err) => {
          error(err);
        });
    });
  }

  fetchReportSchema(reportName, version) {
    return new Promise((resolve, reject) => {
      switch (reportName) {
        case 'MOH-731-greencard':
          resolve({
            main: this.cloneJsonSchema(moh_731_greencard)
          });
          break;
        case 'MOH-731-bluecard':
          resolve({
            main: this.cloneJsonSchema(moh_731_bluecard)
          });
          break;
        case 'patient-list-template':
          resolve({
            main: this.cloneJsonSchema(patient_list_template) //patient_list_frozen_template
          });
          break;
        case 'patient-list-frozen-template':
          resolve({
            main: this.cloneJsonSchema(patient_list_frozen_template) //patient_list_frozen_template
          });
          break;
        case 'patient-list-schedules-template':
          resolve({
            main: this.cloneJsonSchema(patient_list_schedules_template)
          });
          break;
        case 'patient-list-with-contacts-template':
          resolve({
            main: this.cloneJsonSchema(patient_list_with_contacts_template)
          });
          break;
        case 'patient-list-covid-template':
          resolve({
            main: this.cloneJsonSchema(patient_list_covid_template)
          });
          break;
        case 'prep-report-patient-list-template':
          resolve({
            main: this.cloneJsonSchema(prep_report_patient_list_template)
          });
          break;
        case 'pmtct-rri-report-patient-list-template':
          resolve({
            main: this.cloneJsonSchema(pmtct_rri_report_patient_list_template)
          });
          break;
        case 'mainDatasetAggregate':
          resolve({
            main: this.cloneJsonSchema(main_dataset_aggregate),
            mainDataSetBase: this.cloneJsonSchema(main_dataset_base)
          });
          break;
        case 'mainDatasetAggregateBlueCard':
          resolve({
            main: this.cloneJsonSchema(main_dataset_aggregate_blue_card),
            mainDataSetBaseBlueCard: this.cloneJsonSchema(
              main_dataset_base_blue_card
            )
          });
          break;
        case 'regimenDataSetAggregate':
          resolve({
            main: this.cloneJsonSchema(regimen_dataset_aggregate),
            regimenDataSetbase: this.cloneJsonSchema(regimen_dataset_base)
          });
          break;
        case 'retentionDataSetAggregate':
          resolve({
            main: this.cloneJsonSchema(retention_dataset_aggregate),
            retentionDataSetbase: this.cloneJsonSchema(retention_dataset_base)
          });
          break;
        case 'mainDatasetAggregateAgeDisaggregation':
          resolve({
            main: this.cloneJsonSchema(
              main_dataset_aggregate_age_disaggregation
            ),
            mainDataSetBase: this.cloneJsonSchema(main_dataset_base)
          });
          break;
        case 'mainDatasetAggregateNoDisaggregation':
          resolve({
            main: this.cloneJsonSchema(
              main_dataset_aggregate_no_disaggregation
            ),
            mainDataSetBase: this.cloneJsonSchema(main_dataset_base)
          });
          break;
        case 'mainDatasetAggregateAge15Disaggregation':
          resolve({
            main: this.cloneJsonSchema(
              main_dataset_aggregate_age15_disaggregation
            ),
            mainDataSetBaseAge15: this.cloneJsonSchema(main_dataset_base_age15)
          });
          break;
        case 'mainDatasetAggregateAge18Disaggregation':
          resolve({
            main: this.cloneJsonSchema(
              main_dataset_aggregate_age18_disaggregation
            ),
            mainDataSetBaseAge18: this.cloneJsonSchema(main_dataset_base_age18)
          });
          break;
        case 'pepDatasetAggregate':
          resolve({
            main: this.cloneJsonSchema(pep_dataset_aggregate),
            pepDataSetbase: this.cloneJsonSchema(pep_dataset_base)
          });
          break;
        case 'hivMonthlySummaryReportAggregate':
          resolve({
            main: this.cloneJsonSchema(hiv_monthly_summary_dataset_aggregation),
            hivMonthlySummaryDataSetBase: this.cloneJsonSchema(
              hiv_monthly_summary_dataset_base
            )
          });
          break;
        case 'clinicComparatorAggregate':
          resolve({
            main: this.cloneJsonSchema(clinic_comparator_aggregate),
            clinicComparatorBase: this.cloneJsonSchema(clinic_comparator_base)
          });
          break;
        case 'dataEntryStatisticsAggregate':
          resolve({
            main: this.cloneJsonSchema(dataentry_statistics_aggregate),
            dataEntryStatistics: this.cloneJsonSchema(dataentry_statistics_base)
          });
          break;
        case 'hivSummaryBaseAggregate':
          resolve({
            main: this.cloneJsonSchema(hiv_summary_aggregate),
            hivSummaryBase: this.cloneJsonSchema(hiv_summary_base)
          });
          break;
        case 'patientFlow':
          resolve({
            main: this.cloneJsonSchema(patient_flow)
          });
          break;
        case 'clinicHivComparativeOverviewAggregate':
          resolve({
            main: this.cloneJsonSchema(
              clinical_hiv_comparative_overview_aggregate
            ),
            clinicHivComparativeOverviewBase: this.cloneJsonSchema(
              clinical_hiv_comparative_overview_base
            )
          });
          break;
        case 'clinicalArtOverviewAggregeate':
          resolve({
            main: this.cloneJsonSchema(clinical_art_overview_aggregate),
            clinicalArtOverviewBase: this.cloneJsonSchema(
              clinical_art_overview_base
            )
          });
          break;
        case 'dailyAppointmentsAggregate':
          resolve({
            main: this.cloneJsonSchema(daily_appointments_aggregate),
            dailyAppointmentsBase: this.cloneJsonSchema(
              daily_appointments_base
            ),
            dailyAppointmentlatestRtcCohortBase: this.cloneJsonSchema(
              daily_appointment_latest_rtc_cohort_base
            )
          });
          break;
        case 'dailyAttendanceAggregate':
          resolve({
            main: this.cloneJsonSchema(daily_attendance_aggregate),
            dailyAttendanceBase: this.cloneJsonSchema(daily_attendance_base)
          });
          break;
        case 'dailyHasNotReturnedAggregate':
          resolve({
            main: this.cloneJsonSchema(daily_has_not_returned_aggregate),
            dailyHasNotReturnedBase: this.cloneJsonSchema(
              daily_has_not_returned_base
            ),
            dailyHasNotReturnedCohort: this.cloneJsonSchema(
              daily_has_not_returned_cohort
            ),
            nextDrugPickupEncounterBase: this.cloneJsonSchema(
              next_drug_pickup_encounter_base
            )
          });
          break;
        case 'dailyHasNotReturnedCohort':
          resolve({
            main: this.cloneJsonSchema(daily_has_not_returned_cohort)
          });
          break;
        case 'patintChangeStatusTrackerAggregate':
          resolve({
            main: this.cloneJsonSchema(patint_change_status_tracker_aggregate),
            patintChangeStatusTrackerDataSetbase: this.cloneJsonSchema(
              patint_change_status_tracker_base
            )
          });
          break;
        case 'everOnARTAggregate':
          resolve({
            main: this.cloneJsonSchema(ever_on_art_aggregate),
            everOnARTBase: this.cloneJsonSchema(ever_on_art_base)
          });
          break;
        case 'everOnARTDisaggregation':
          resolve({
            main: this.cloneJsonSchema(ever_on_art_disaggregation),
            everOnARTBase: this.cloneJsonSchema(ever_on_art_base)
          });
          break;
        case 'referral-patient-list-template':
          resolve({
            main: this.cloneJsonSchema(referral_patient_list_template)
          });
          break;
        case 'patients-requiring-viral-load-template':
          resolve({
            main: this.cloneJsonSchema(patients_requiring_viral_load_template)
          });
          break;
        case 'referralAggregate':
          resolve({
            main: this.cloneJsonSchema(referral_aggregate),
            referralDatasetbase: this.cloneJsonSchema(referral_dataset_base)
          });
          break;
        case 'referral-patient-peer-navigator-list':
          resolve({
            main: this.cloneJsonSchema(referral_peer_aggregate),
            referralDatasetbase: this.cloneJsonSchema(
              referral_patient_list_peer_base
            )
          });
          break;
        case 'StartingARTAggregationAge15':
          resolve({
            main: this.cloneJsonSchema(starting_art_aggregation_age15),
            StartingARTSetBaseAge15: this.cloneJsonSchema(
              starting_art_base_age15
            )
          });
          break;
        case 'StartingARTDisaggregationAge15':
          resolve({
            main: this.cloneJsonSchema(starting_art_disaggregation_age15),
            StartingARTSetBaseAge15: this.cloneJsonSchema(
              starting_art_base_age15
            )
          });
          break;
        case 'StartingARTAggregationAgeGreen':
          resolve({
            main: this.cloneJsonSchema(starting_art_aggregation_age_green),
            StartingARTSetBaseAgeGreen: this.cloneJsonSchema(
              starting_art_base_age_green
            )
          });
          break;
        case 'StartingARTDisaggregationAgeGreen':
          resolve({
            main: this.cloneJsonSchema(starting_art_disaggregation_age_green),
            StartingARTSetBaseAgeGreen: this.cloneJsonSchema(
              starting_art_base_age_green
            )
          });
          break;
        case 'StartingARTDisaggregationAgeOnlyGreen':
          resolve({
            main: this.cloneJsonSchema(
              starting_art_disaggregation_age_only_green
            ),
            StartingARTSetBaseAgeGreen: this.cloneJsonSchema(
              starting_art_base_age_green
            )
          });
        case 'medicalHistoryReport':
          resolve({
            main: this.cloneJsonSchema(medical_history_dataset_base)
          });
          break;
        case 'breastCancerDailySummaryAggregate':
          resolve({
            main: this.cloneJsonSchema(
              breast_cancer_daily_screening_summary_aggregate
            ),
            breastCancerMonthlySummaryBase: this.cloneJsonSchema(
              breast_cancer_monthly_screening_summary_base
            )
          });
        case 'breastCancerMonthlySummaryAggregate':
          resolve({
            main: this.cloneJsonSchema(
              breast_cancer_monthly_screening_summary_aggregate
            ),
            breastCancerMonthlySummaryBase: this.cloneJsonSchema(
              breast_cancer_monthly_screening_summary_base
            )
          });
          break;
        case 'lungCancerTreatmentMonthlySummaryAggregate':
          resolve({
            main: this.cloneJsonSchema(
              lung_cancer_treatment_monthly_summary_aggregate
            ),
            lungCancerTreatmentMonthlySummaryBase: this.cloneJsonSchema(
              lung_cancer_treatment_monthly_summary_base
            )
          });
          break;
        case 'lungCancerTreatmentDailySummaryAggregate':
          resolve({
            main: this.cloneJsonSchema(
              lung_cancer_treatment_daily_summary_aggregate
            ),
            lungCancerTreatmentSummaryBase: this.cloneJsonSchema(
              lung_cancer_treatment_summary_base
            )
          });
          break;
        case 'lung_cancer_treatment_patient_list_template':
          resolve({
            main: this.cloneJsonSchema(
              lung_cancer_treatment_patient_list_template
            )
          });
          break;
        case 'combinedBreastCervicalCancerDailySummaryAggregate':
          resolve({
            main: this.cloneJsonSchema(
              combined_breast_cervical_cancer_daily_screening_summary_aggregate
            ),
            combinedBreastCervicalCancerDailySummaryBase: this.cloneJsonSchema(
              combined_breast_cervical_cancer_daily_screening_summary_base
            )
          });
        case 'combinedBreastCervicalCancerMonthlySummaryAggregate':
          resolve({
            main: this.cloneJsonSchema(
              combined_breast_cervical_cancer_monthly_screening_summary_aggregate
            ),
            combinedBreastCervicalCancerMonthlySummaryBase: this.cloneJsonSchema(
              combined_breast_cervical_cancer_monthly_screening_summary_base
            )
          });
          break;
        case 'breast_cancer_patient_list_template':
          resolve({
            main: this.cloneJsonSchema(breast_cancer_patient_list_template)
          });
          break;
        case 'combined_breast_cervical_cancer_patient_list_template':
          resolve({
            main: this.cloneJsonSchema(
              combined_breast_cervical_cancer_patient_list_template
            )
          });
          break;
        case 'cervicalCancerDailySummaryAggregate':
          resolve({
            main: this.cloneJsonSchema(
              cervical_cancer_daily_screening_summary_aggregate
            ),
            cervicalCancerMonthlyReportBase: this.cloneJsonSchema(
              cervical_cancer_monthly_screening_summary_base
            )
          });
        case 'cervicalCancerMonthlySummaryAggregate':
          resolve({
            main: this.cloneJsonSchema(
              cervical_cancer_monthly_screening_summary_aggregate
            ),
            cervicalCancerMonthlyReportBase: this.cloneJsonSchema(
              cervical_cancer_monthly_screening_summary_base
            )
          });
          break;

        case 'lungCancerDailySummaryAggregate':
          resolve({
            main: this.cloneJsonSchema(
              lung_cancer_daily_screening_summary_aggregate
            ),
            lungCancerMonthlySummaryBase: this.cloneJsonSchema(
              lung_cancer_monthly_screening_summary_base
            )
          });
        case 'lungCancerMonthlySummaryAggregate':
          resolve({
            main: this.cloneJsonSchema(
              lung_cancer_monthly_screening_summary_aggregate
            ),
            lungCancerMonthlySummaryBase: this.cloneJsonSchema(
              lung_cancer_monthly_screening_summary_base
            )
          });
          break;
        case 'lung_cancer_patient_list_template':
          resolve({
            main: this.cloneJsonSchema(lung_cancer_patient_list_template)
          });
          break;

        case 'labsReportAggregate':
          resolve({
            main: this.cloneJsonSchema(labs_report_aggregate),
            labsReportBase: this.cloneJsonSchema(labs_report_base)
          });
          break;
        case 'patients-requiring-viral-load-template':
          resolve({
            main: this.cloneJsonSchema(patients_requiring_viral_load_template)
          });
          break;
        case 'clinicLabOrdersReport':
          resolve({
            main: this.cloneJsonSchema(clinic_lab_orders_report)
          });
          break;
        case 'cdmPatientSummary':
          resolve({
            main: this.cloneJsonSchema(cdm_dataset_base)
          });
          break;
        // PMTCT-RRI
        case 'pmtct_rri_aggregate_summary':
          resolve({
            main: this.cloneJsonSchema(pmtct_rri)
          });
          break;
        case 'pmtctrripatientlisttemplate':
          resolve({
            main: this.cloneJsonSchema(pmtct_rri_patient_list_template)
          });
          break;
        case 'pmtctRriCalhivAggregate':
          resolve({
            main: this.cloneJsonSchema(pmtct_rri_cal_hiv_aggregate),
            pmtctRriCalhivDataSetBase: this.cloneJsonSchema(
              pmtc_rri_calhiv_dataset_base
            )
          });
          break;

        case 'pmtctRriPbfwAggregate':
          resolve({
            main: this.cloneJsonSchema(pmtct_rri_pbfw_aggregate),
            pmtctRriPbfwDataSetBase: this.cloneJsonSchema(
              pmtc_rri__pbfw_dataset_base
            )
          });
          break;

        case 'pmtctRriWraAggregate':
          resolve({
            main: this.cloneJsonSchema(pmtct_rri_wra_aggregate),
            pmtctRriWraDataSetBase: this.cloneJsonSchema(
              pmtc_rri_wra_dataset_base
            )
          });
          break;
        case 'pmtctRriHeiAggregate':
          resolve({
            main: this.cloneJsonSchema(pmtct_rri_hei_aggregate),
            heiInfantRriTestingBase: this.cloneJsonSchema(
              pmtc_rri_hei_dataset_base
            )
          });
          break;
        case 'clinicalReminderReport':
          resolve({
            main: this.cloneJsonSchema(clinical_reminders_report),
            flatLabsAndImagingDataSetbase: this.cloneJsonSchema(
              labs_and_imaging_dataset_base
            )
          });
          break;
        case 'enhancedAdherenceHIVProgramAggregate':
          resolve({
            main: this.cloneJsonSchema(
              enhanced_adherence_hiv_program_aggregate
            ),
            enhancedAdherenceHIVProgramBase: this.cloneJsonSchema(
              enhanced_adherence_hiv_program_base
            ),
            patientProgramCohort: this.cloneJsonSchema(patient_program_cohort),
            enhancedAdherenceHIVProgramCohort: this.cloneJsonSchema(
              enhanced_adherence_hiv_program_cohort
            ),
            hivLatestClinicalEncounterDateBase: this.cloneJsonSchema(
              hiv_latest_clinical_encounter_date_base
            )
          });
          break;
        case 'currentlyEnrolledPatientsAggregate':
          resolve({
            main: this.cloneJsonSchema(currently_enrolled_patients_aggregate),
            currentlyEnrolledPatientsBase: this.cloneJsonSchema(
              currently_enrolled_patients_base
            )
          });
          break;
        case 'differentiatedCareProgramAggregate':
          resolve({
            main: this.cloneJsonSchema(differentiated_care_program_aggregate),
            differentiatedCareProgramBase: this.cloneJsonSchema(
              differentiated_care_program_base
            ),
            hivLatestClinicalEncounterDateBase: this.cloneJsonSchema(
              hiv_latest_clinical_encounter_date_base
            )
          });
          break;
        case 'surgeReport':
          resolve({
            main: this.cloneJsonSchema(surge_report_aggregate),
            surgeReport: this.cloneJsonSchema(surge_report_base)
          });
          break;
        case 'surgeDailyReport':
          resolve({
            main: this.cloneJsonSchema(surge_daily_report_aggregate),
            surgeDailyReport: this.cloneJsonSchema(surge_daily_report_base)
          });
          break;
        case 'prepReport':
          resolve({
            main: this.cloneJsonSchema(prep_aggregate_report),
            prepBaseReport: this.cloneJsonSchema(prep_base_report),
            prepDatasetReport: this.cloneJsonSchema(prep_dataset_report)
          });
          break;
        case 'ahd-monthly-summary':
          resolve({
            main: this.cloneJsonSchema(ahd_monthly_summary)
          });
          break;
        case 'ahdMonthlySummaryReport':
          resolve({
            main: this.cloneJsonSchema(ahd_monthly_summary),
            ahdMonthlyDataSetBase: this.cloneJsonSchema(
              ahd_monthly_dataset_base
            )
          });
          break;
        case 'ahd-monthly-report-patient-list-template':
          resolve({
            main: this.cloneJsonSchema(ahd_monthly_patient_list_template)
          });
          break;
        case 'ahdMonthlyAggregate':
          resolve({
            main: this.cloneJsonSchema(ahd_monthly_aggregate),
            ahdMonthlyDataSetBase: this.cloneJsonSchema(
              ahd_monthly_dataset_base
            )
          });
          break;
        case 'ahdCohortMonthlyAggregate':
          resolve({
            main: this.cloneJsonSchema(ahd_cohort_monthly_aggregate),
            ahdCohortMonthlyDataSetBase: this.cloneJsonSchema(
              ahd_cohort_monthly_dataset_base
            )
          });
          break;
        case 'surgeBaselineReport':
          resolve({
            main: this.cloneJsonSchema(ltfu_surge_baseline_aggregate_report),
            surgeBaselineReport: this.cloneJsonSchema(
              ltfu_surge_baseline_report
            )
          });
          break;
        case 'surge':
          resolve({
            main: this.cloneJsonSchema(surge)
          });
          break;
        case 'retention-report':
          resolve({
            main: this.cloneJsonSchema(appointment_adherence)
          });
          break;
        case 'retentionAppointmentAdherenceAggregate':
          resolve({
            main: this.cloneJsonSchema(
              retention_appointment_adherence_aggregate
            ),
            retentionAppointmentAdherenceBase: this.cloneJsonSchema(
              retention_appointment_adherence_base
            )
          });
          break;
        case 'retentionDefaulterTracingAggregate':
          resolve({
            main: this.cloneJsonSchema(retention_defaulter_tracing_aggregate),
            retentionDefaulterTracingBase: this.cloneJsonSchema(
              retention_defaulter_tracing_base
            )
          });
          break;
        case 'retentionVisitsAggregate':
          resolve({
            main: this.cloneJsonSchema(retention_visits_aggregate),
            retentionVisitsBase: this.cloneJsonSchema(retention_visits_base),
            retentionInterventionCohort: this.cloneJsonSchema(
              retention_intervention_cohort
            )
          });
          break;
        case 'retentionLtfuAggregate':
          resolve({
            main: this.cloneJsonSchema(retention_ltfu_aggregate),
            retentionLtfuBase: this.cloneJsonSchema(retention_ltfu_base)
          });
          break;
        case 'retention-report-patient-list-template':
          resolve({
            main: this.cloneJsonSchema(retention_report_patient_list_template)
          });
          break;
        case 'prepMonthlySummaryReport':
          resolve({
            main: this.cloneJsonSchema(prep_monthly_summary),
            prepLatestClinicalEncounterDate: this.cloneJsonSchema(
              prep_latest_clinical_encounter_date_base
            )
          });
          break;
        case 'prepMonthlySummaryNoDisaggregation':
          resolve({
            main: this.cloneJsonSchema(prep_monthly_summary_aggregate_report),
            prepMonthlySummaryBaseReport: this.cloneJsonSchema(
              prep_monthly_summary_base_report
            ),
            prepLatestClinicalEncounterDate: this.cloneJsonSchema(
              prep_latest_clinical_encounter_date_base
            )
          });
          break;
        case 'prepMonthlySummaryPopulationTypeDisaggregation':
          resolve({
            main: this.cloneJsonSchema(
              prep_monthly_populationtype_disaggregation
            ),
            prepMonthlySummaryBaseReport: this.cloneJsonSchema(
              prep_monthly_summary_base_report
            ),
            prepLatestClinicalEncounterDate: this.cloneJsonSchema(
              prep_latest_clinical_encounter_date_base
            )
          });
          break;
        case 'prepMonthlySummaryBreastFeedingDisaggregation':
          resolve({
            main: this.cloneJsonSchema(
              prep_monthly_breastfeeding_disaggregation
            ),
            prepMonthlySummaryBaseReport: this.cloneJsonSchema(
              prep_monthly_summary_base_report
            ),
            prepLatestClinicalEncounterDate: this.cloneJsonSchema(
              prep_latest_clinical_encounter_date_base
            )
          });
          break;
        case 'prepMonthlyNewlyEnrolledBreastFeedingDisaggregation':
          resolve({
            main: this.cloneJsonSchema(
              prep_monthly_newly_enrolled_breastfeeding_disaggregation
            ),
            prepMonthlySummaryBaseReport: this.cloneJsonSchema(
              prep_monthly_summary_base_report
            ),
            prepLatestClinicalEncounterDate: this.cloneJsonSchema(
              prep_latest_clinical_encounter_date_base
            )
          });
          break;
        case 'prepMonthlyNewlyEnrolledPregnancyDisaggregation':
          resolve({
            main: this.cloneJsonSchema(
              prep_monthly_newly_enrolled_pregnancy_disaggregation
            ),
            prepMonthlySummaryBaseReport: this.cloneJsonSchema(
              prep_monthly_summary_base_report
            ),
            prepLatestClinicalEncounterDate: this.cloneJsonSchema(
              prep_latest_clinical_encounter_date_base
            )
          });
          break;
        case 'prepMonthlySummaryPregnancyDisaggregation':
          resolve({
            main: this.cloneJsonSchema(prep_monthly_pregnancy_disaggregation),
            prepMonthlySummaryBaseReport: this.cloneJsonSchema(
              prep_monthly_summary_base_report
            ),
            prepLatestClinicalEncounterDate: this.cloneJsonSchema(
              prep_latest_clinical_encounter_date_base
            )
          });
          break;
        case 'MOH-408':
          resolve({
            main: this.cloneJsonSchema(moh_408)
          });
          break;
        case 'heiInfantFeedingAggregate':
          resolve({
            main: this.cloneJsonSchema(hei_infant_feeding_aggregate),
            heiInfantFeedingBase: this.cloneJsonSchema(hei_infant_feeding_base)
          });
          break;
        case 'heiInfantFeedingNoDisaggregationAggregate':
          resolve({
            main: this.cloneJsonSchema(
              hei_infant_feeding_no_disaggregation_aggregate
            ),
            heiInfantFeedingNoDisaggregationBase: this.cloneJsonSchema(
              hei_infant_feeding_no_disaggregation_base
            )
          });
          break;
        case 'heiInfantTestingAggregate':
          resolve({
            main: this.cloneJsonSchema(hei_infant_testing_aggregate),
            heiInfantTestingBase: this.cloneJsonSchema(hei_infant_testing_base)
          });
          break;
        case 'heiRetentionPairsAggregate':
          resolve({
            main: this.cloneJsonSchema(hei_retention_pairs_aggregate),
            heiRetentionPairsBase: this.cloneJsonSchema(
              hei_retention_pairs_base
            )
          });
          break;
        case 'heiMotherAggregate':
          resolve({
            main: this.cloneJsonSchema(hei_mother_aggregate),
            heiMotherBase: this.cloneJsonSchema(hei_mother_base)
          });
          break;
        case 'heiProgramOutcomeAggregate':
          resolve({
            main: this.cloneJsonSchema(hei_program_outcome_aggregate),
            heiProgramOutcomeBase: this.cloneJsonSchema(
              hei_program_outcome_base
            )
          });
          break;
        case 'heiUknownProgramOutcomeAggregate':
          resolve({
            main: this.cloneJsonSchema(hei_unknown_program_outcome_aggregate),
            heiUknownProgramOutcomeBase: this.cloneJsonSchema(
              hei_unknown_program_outcome_base
            )
          });
          break;
        case 'heiOriginalCohortAggregate':
          resolve({
            main: this.cloneJsonSchema(hei_original_cohort_aggregate),
            heiOriginalCohortBase: this.cloneJsonSchema(
              hei_original_cohort_base
            )
          });
          break;
        case 'hei-report-patient-list-template':
          resolve({
            main: this.cloneJsonSchema(hei_report_patient_list_template)
          });
          break;
        case 'patientGainLoseAggregate':
          resolve({
            main: this.cloneJsonSchema(patient_gain_loses_aggregate),
            patientGainLosesBaseReport: this.cloneJsonSchema(
              patient_gain_loses_base
            ),
            patientGainLoseDatasetOne: this.cloneJsonSchema(
              patient_gain_lose_dataset_1
            ),
            patientGainLoseDatasetTwo: this.cloneJsonSchema(
              patient_gain_lose_dataset_2
            )
          });
          break;
        case 'ovcReport':
          resolve({
            main: this.cloneJsonSchema(ovc_report)
          });
        case 'ovcInHivDatasetAggregate':
          resolve({
            main: this.cloneJsonSchema(ovc_in_hiv_dataset_aggregate),
            ovcInHivDatasetBase: this.cloneJsonSchema(ovc_in_hiv_dataset_base)
          });
        case 'ovcInHeiDatasetAggregate':
          resolve({
            main: this.cloneJsonSchema(ovc_in_hei_dataset_aggregate),
            ovcInHeiDatasetBase: this.cloneJsonSchema(ovc_in_hei_dataset_base)
          });
        case 'ovc-patient-list-template':
          resolve({
            main: this.cloneJsonSchema(ovc_patient_list_template)
          });
          break;
        case 'ovc-in-hei-patient-list-template':
          resolve({
            main: this.cloneJsonSchema(ovc_in_hei_patient_list_template)
          });
          break;
        case 'prepClinicalReminderReport':
          resolve({
            main: this.cloneJsonSchema(prep_clinical_remainder),
            prepLatestClinicalEncounterDate: this.cloneJsonSchema(
              prep_latest_clinical_encounter_date_base
            ),
            prepInitialClinicalEncounterDate: this.cloneJsonSchema(
              prep_initial_encounter_date
            )
          });
          break;
        case 'TbPreventiveReport':
          resolve({
            main: this.cloneJsonSchema(tb_preventive_report)
          });
          break;
        case 'TbPreventiveIptMonthlySummaryAggregate':
          resolve({
            main: this.cloneJsonSchema(
              tb_preventive_ipt_monthly_summary_aggregate
            ),
            TbPreventiveDataSetBase: this.cloneJsonSchema(
              tb_preventive_dataSet_base
            )
          });
          break;
        case 'TbPreventiveMonthlySummaryAggregate':
          resolve({
            main: this.cloneJsonSchema(tb_preventive_monthly_summary_aggregate),
            TbPreventiveDataSetBase: this.cloneJsonSchema(
              tb_preventive_dataSet_base
            )
          });
          break;
        case 'monthly-gains-and-losses':
          resolve({
            main: this.cloneJsonSchema(monthly_gains_losses)
          });
          break;
        case 'hivMonthlyLossesAggregate':
          resolve({
            main: this.cloneJsonSchema(hiv_monthly_loss_aggregate),
            hivMonthlyLossesBase: this.cloneJsonSchema(hiv_monthly_loss_base)
          });
        case 'hivMonthlyGainsAggregate':
          resolve({
            main: this.cloneJsonSchema(hiv_monthly_gains_aggregate),
            hivMonthlyGainsBase: this.cloneJsonSchema(hiv_monthly_gains_base)
          });
        case 'patient-gains-and-losses-patient-list-template':
          resolve({
            main: this.cloneJsonSchema(
              patient_gains_and_losses_patient_list_template
            )
          });
          break;
        case 'MOH-412-report':
          resolve({
            main: this.cloneJsonSchema(
              hiv_cervical_cancer_screening_monthly_report
            )
          });
          break;
        case 'MOH-412-PCF-report':
          resolve({
            main: this.cloneJsonSchema(
              hiv_cervical_cancer_screening_monthly_pcf_report
            )
          });
          break;
        case 'hivCervicalCancerScreeningMonthlyAggregate':
          resolve({
            main: this.cloneJsonSchema(
              hiv_cervical_cancer_screening_monthly_aggregate
            ),
            hivCervicalCancerScreeningMonthlyBase: this.cloneJsonSchema(
              hiv_cervical_cancer_screening_monthly_base
            )
          });
          break;
        case 'hivCervicalCancerScreeningMonthlyPcfAggregate':
          resolve({
            main: this.cloneJsonSchema(
              hiv_cervical_cancer_screening_monthly_pcf_aggregate
            ),
            hivCervicalCancerScreeningMonthlyBase: this.cloneJsonSchema(
              hiv_cervical_cancer_screening_monthly_base
            )
          });
          break;
        case 'hivCervicalCancerPositiveScreeningMonthlyAggregate':
          resolve({
            main: this.cloneJsonSchema(
              hiv_cervical_cancer_positive_screening_monthly_aggregate
            ),
            hivCervicalCancerPositiveScreeningMonthlyBase: this.cloneJsonSchema(
              hiv_cervical_cancer_positive_screening_monthly_base
            )
          });
          break;
        case 'hivCervicalCancerPositiveScreeningMonthlyPcfAggregate':
          resolve({
            main: this.cloneJsonSchema(
              hiv_cervical_cancer_positive_screening_monthly_pcf_aggregate
            ),
            hivCervicalCancerPositiveScreeningMonthlyBase: this.cloneJsonSchema(
              hiv_cervical_cancer_positive_screening_monthly_base
            )
          });
          break;
        case 'hivCervicalCancerTreatmentMonthlyAggregate':
          resolve({
            main: this.cloneJsonSchema(
              hiv_cervical_cancer_treatment_monthly_aggregate
            ),
            hivCervicalCancerTreatmentMonthlyBase: this.cloneJsonSchema(
              hiv_cervical_cancer_treatment_monthly_base
            )
          });
          break;
        case 'hivCervicalCancerTreatmentMonthlyPcfAggregate':
          resolve({
            main: this.cloneJsonSchema(
              hiv_cervical_cancer_treatment_monthly_pcf_aggregate
            ),
            hivCervicalCancerTreatmentMonthlyBase: this.cloneJsonSchema(
              hiv_cervical_cancer_treatment_monthly_base
            )
          });
          break;
        case 'hivPositiveCervicalCancerScreeningMonthlyAggregate':
          resolve({
            main: this.cloneJsonSchema(
              hiv_positive_cervical_cancer_screening_monthly_aggregate
            ),
            hivPositiveCervicalCancerScreeningMonthlyBase: this.cloneJsonSchema(
              hiv_positive_cervical_cancer_screening_monthly_base
            )
          });
          break;
        case 'hivPositiveCervicalCancerScreeningMonthlyPcfAggregate':
          resolve({
            main: this.cloneJsonSchema(
              hiv_positive_cervical_cancer_screening_monthly_pcf_aggregate
            ),
            hivPositiveCervicalCancerScreeningMonthlyBase: this.cloneJsonSchema(
              hiv_positive_cervical_cancer_screening_monthly_base
            )
          });
          break;
        case 'hivCervicalCancerScreeningMonthlyMainDatasetAggregate':
          resolve({
            main: this.cloneJsonSchema(
              hiv_cervical_cancer_screening_monthly_main_dataset_aggregate
            ),
            hivCervicalCancerScreeningMonthlyMainDatasetBase: this.cloneJsonSchema(
              hiv_cervical_cancer_screening_monthly_main_dataset_base
            )
          });
          break;
        case 'hivCervicalCancerScreeningMonthlyMainDatasetPcfAggregate':
          resolve({
            main: this.cloneJsonSchema(
              hiv_cervical_cancer_screening_monthly_main_dataset_pcf_aggregate
            ),
            hivCervicalCancerScreeningMonthlyMainDatasetBase: this.cloneJsonSchema(
              hiv_cervical_cancer_screening_monthly_main_dataset_base
            )
          });
          break;
        case 'hivCervicalCancerMonthlySummaryLesionsAggregate':
          resolve({
            main: this.cloneJsonSchema(
              hiv_cervical_cancer_monthly_summary_lesions_aggregate
            ),
            hivCervicalCancerMonthlySummaryLesionsBase: this.cloneJsonSchema(
              hiv_cervical_cancer_monthly_summary_lesions_base
            )
          });
          break;
        case 'hivCervicalCancerMonthlySummaryLesionsPcfAggregate':
          resolve({
            main: this.cloneJsonSchema(
              hiv_cervical_cancer_monthly_summary_lesions_pcf_aggregate
            ),
            hivCervicalCancerMonthlySummaryLesionsBase: this.cloneJsonSchema(
              hiv_cervical_cancer_monthly_summary_lesions_base
            )
          });
          break;
        case 'defaulterListAggregate':
          resolve({
            main: this.cloneJsonSchema(defaulter_list_aggregate),
            defaulterListBase: this.cloneJsonSchema(defaulter_list_base)
          });
          break;
        case 'mlWeeklyPredictionsAggregate':
          resolve({
            main: this.cloneJsonSchema(ml_weekly_predictions_aggregate),
            mlWeeklyPredictionsBase: this.cloneJsonSchema(
              ml_weekly_predictions_base
            )
          });
          break;
        case 'clinicFlowProviderStatisticsAggregate':
          resolve({
            main: this.cloneJsonSchema(
              clinic_flow_provider_statistics_aggregate
            ),
            clinicFlowProviderStatisticsBase: this.cloneJsonSchema(
              clinic_flow_provider_statistics_base
            )
          });
          break;
        case 'covid19SummaryReportAggregate':
          resolve({
            main: this.cloneJsonSchema(covid_19_summary_aggregate),
            covid19SummaryReportBase: this.cloneJsonSchema(
              covid_19_summary_base
            )
          });
          break;
        case 'covid19CumulativeSummaryReportAggregate':
          resolve({
            main: this.cloneJsonSchema(covid_19_cumulative_summary_aggregate),
            covid19CumulativeSummaryReportBase: this.cloneJsonSchema(
              covid_19_cumulative_summary_base
            )
          });
          break;
        case 'hivMonthlyOnART15AndAboveAggregate':
          resolve({
            main: this.cloneJsonSchema(on_art_15_and_above_aggregate),
            hivMonthlyOnART15AndAboveBase: this.cloneJsonSchema(
              on_art_15_and_above_base
            )
          });
          break;
        case 'hivMonthlyNotScreenedForCovidAggregate':
          resolve({
            main: this.cloneJsonSchema(
              hiv_monthly_not_screened_for_covid_aggregate
            ),
            hivMonthlyNotScreenedForCovidBase: this.cloneJsonSchema(
              hiv_monthly_not_screened_for_covid_base
            )
          });
          break;
        case 'prep-monthly-report':
          resolve({
            main: this.cloneJsonSchema(prep_monthly_report)
          });
          break;
        case 'eligibleForPrepAggregate':
          resolve({
            main: this.cloneJsonSchema(eligible_for_prep_aggregate),
            eligibleForPrepBase: this.cloneJsonSchema(eligible_for_prep_base)
          });
          break;
        case 'reasonForInitiationPrepAggregate':
          resolve({
            main: this.cloneJsonSchema(reasons_for_initiation_prep_aggregate),
            reasonForInitiationPrepBase: this.cloneJsonSchema(
              reasons_for_initiation_prep_base
            )
          });
          break;
        case 'newForPrepAggregate':
          resolve({
            main: this.cloneJsonSchema(new_for_prep_aggregate),
            newForPrepBase: this.cloneJsonSchema(new_for_prep_base)
          });
          break;
        case 'eventDrivenPrepAggregate':
          resolve({
            main: this.cloneJsonSchema(prep_event_driven_aggregate),
            eventDrivenPrepBase: this.cloneJsonSchema(prep_event_driven_base)
          });
          break;
        case 'restartingPrepAggregate':
          resolve({
            main: this.cloneJsonSchema(restarting_prep_aggregate),
            restartingPrepBase: this.cloneJsonSchema(restarting_prep_base)
          });
          break;
        case 'whileOnPrepAggregate':
          resolve({
            main: this.cloneJsonSchema(while_on_prep_aggregate),
            whileOnPrepBase: this.cloneJsonSchema(while_on_prep_base)
          });
          break;
        case 'discontinuedPrepAggregate':
          resolve({
            main: this.cloneJsonSchema(discounted_prep_aggregate),
            discontinuedPrepBase: this.cloneJsonSchema(discounted_prep_base)
          });
          break;
        case 'gbvPrepAggregate':
          resolve({
            main: this.cloneJsonSchema(gbv_prep_aggregate),
            gbvPrepBase: this.cloneJsonSchema(gbv_prep_base)
          });
          break;
        case 'transactionalSexPrepAggregate':
          resolve({
            main: this.cloneJsonSchema(transactional_sex_prep_aggregate),
            transactionalSexPrepBase: this.cloneJsonSchema(
              transactional_sex_prep_base
            )
          });
          break;
        case 'recentSTIPrepAggregate':
          resolve({
            main: this.cloneJsonSchema(recent_sti_prep_aggregate),
            recentSTIPrepBase: this.cloneJsonSchema(recent_sti_prep_base)
          });
          break;
        case 'recurrentUseOfPepPrepAggregate':
          resolve({
            main: this.cloneJsonSchema(recurrent_use_of_pep_prep_aggregate),
            recurrentUseOfPepPrepBase: this.cloneJsonSchema(
              recurrent_use_of_pep_prep_base
            )
          });
          break;
        case 'inconsistentOrNoCondomUsePrepAggregate':
          resolve({
            main: this.cloneJsonSchema(
              inconsistent_or_no_condom_use_prep_aggregate
            ),
            inconsistentOrNoCondomUsePrepBase: this.cloneJsonSchema(
              inconsistent_or_no_condom_use_prep_base
            )
          });
          break;
        case 'otherReasonsForPrepAggregate':
          resolve({
            main: this.cloneJsonSchema(other_reasons_prep_aggregate),
            otherReasonsForPrepBase: this.cloneJsonSchema(
              other_reasons_prep_base
            )
          });
          break;
        case 'sharedNeedlesPrepAggregate':
          resolve({
            main: this.cloneJsonSchema(shared_needles_prep_aggregate),
            sharedNeedlesPrepBase: this.cloneJsonSchema(
              shared_needles_prep_base
            )
          });
          break;
        case 'testedHIVPositivePrepAggregate':
          resolve({
            main: this.cloneJsonSchema(tested_hiv_positive_prep_aggregate),
            testedHIVPositivePrepBase: this.cloneJsonSchema(
              tested_hiv_positive_prep_base
            )
          });
          break;
        case 'lowRiskForHIVPrepAggregate':
          resolve({
            main: this.cloneJsonSchema(low_risk_for_hiv_prep_aggregate),
            lowRiskForHIVPrepBase: this.cloneJsonSchema(
              low_risk_for_hiv_prep_base
            )
          });
          break;
        case 'prepSideEffectsAggregate':
          resolve({
            main: this.cloneJsonSchema(prep_side_effects_prep_aggregate),
            prepSideEffectsPrepBase: this.cloneJsonSchema(
              prep_side_effects_prep_base
            )
          });
          break;
        case 'nonAdherencePrepAggregate':
          resolve({
            main: this.cloneJsonSchema(non_adherence_prep_aggregate),
            nonAdherencePrepBase: this.cloneJsonSchema(non_adherence_prep_base)
          });
          break;
        case 'viralSuppressionOfHIVPositivePartnerPrepAggregate':
          resolve({
            main: this.cloneJsonSchema(
              viral_suppression_of_hiv_positive_partner_prep_aggregate
            ),
            viralSuppressionOfHIVPositivePartnerPrepBase: this.cloneJsonSchema(
              viral_suppression_of_hiv_positive_partner_prep_base
            )
          });
          break;
        case 'tooManyHIVTestsPrepAggregate':
          resolve({
            main: this.cloneJsonSchema(too_many_hiv_tests_prep_aggregate),
            tooManyHIVTestsPrepBase: this.cloneJsonSchema(
              too_many_hiv_tests_prep_base
            )
          });
          break;
        case 'partnerRefusalPrepAggregate':
          resolve({
            main: this.cloneJsonSchema(partner_refusal_prep_aggregate),
            partnerRefusalPrepBase: this.cloneJsonSchema(
              partner_refusal_prep_base
            )
          });
          break;
        case 'partnerViolencePrepAggregate':
          resolve({
            main: this.cloneJsonSchema(partner_violence_prep_aggregate),
            partnerViolencePrepBase: this.cloneJsonSchema(
              partner_violence_prep_base
            )
          });
          break;
        case 'diedPrepAggregate':
          resolve({
            main: this.cloneJsonSchema(died_prep_aggregate),
            diedPrepBase: this.cloneJsonSchema(died_prep_base)
          });
          break;
        case 'transferOutsPrepAggregate':
          resolve({
            main: this.cloneJsonSchema(transfer_outs_prep_aggregate),
            transferOutsPrepBase: this.cloneJsonSchema(transfer_outs_prep_base)
          });
          break;
        case 'missedDrugPickupsPrepAggregate':
          resolve({
            main: this.cloneJsonSchema(missed_drug_pickups_prep_aggregate),
            missedDrugPickupsPrepBase: this.cloneJsonSchema(
              missed_drug_pickups_prep_base
            )
          });
          break;
        case 'anyOtherReasonPrepAggregate':
          resolve({
            main: this.cloneJsonSchema(any_other_reason_prep_aggregate),
            anyOtherReasonPrepBase: this.cloneJsonSchema(
              any_other_reason_prep_base
            )
          });
          break;
        case 'covid-19-monthly-report':
          resolve({
            main: this.cloneJsonSchema(covid_19_monthly_report)
          });
          break;
        case 'txmlReportAggregate':
          resolve({
            main: this.cloneJsonSchema(txml_aggregate_report),
            txmlReportBase: this.cloneJsonSchema(txml_base_report)
          });
          break;
        case 'txmlrstReportAggregate':
          resolve({
            main: this.cloneJsonSchema(txml_rst_report_aggregate),
            txmlrstReportBase: this.cloneJsonSchema(txml_rst_report_base)
          });
          break;
        case 'txmltoReportAggregate':
          resolve({
            main: this.cloneJsonSchema(txml_to_report_aggregate),
            txmltoReportBase: this.cloneJsonSchema(txml_to_report_base)
          });
          break;
        case 'txmlIITabove6ReportAggregate':
          resolve({
            main: this.cloneJsonSchema(txml_iitabove6_report_aggregate),
            txmlIITabove6ReportBase: this.cloneJsonSchema(
              txml_iitabove6_report_base
            )
          });
          break;
        case 'txmlIIT35ReportAggregate':
          resolve({
            main: this.cloneJsonSchema(txml_iit35_report_aggregate),
            txmlIIT35ReportBase: this.cloneJsonSchema(txml_iit35_report_base)
          });
          break;
        case 'txmlIITless3ReportAggregate':
          resolve({
            main: this.cloneJsonSchema(txml_iitless3_report_aggregate),
            txmlIITless3ReportBase: this.cloneJsonSchema(
              txml_iitless3_report_base
            )
          });
          break;
        case 'txml-summary-report':
          resolve({
            main: this.cloneJsonSchema(txml_summary)
          });
          break;
        case 'patient-list-txml-template':
          resolve({
            main: this.cloneJsonSchema(patient_list_txml_template)
          });
          break;
        case 'txnewReportAggregate':
          resolve({
            main: this.cloneJsonSchema(txnew_aggregate_report),
            txnewReportBase: this.cloneJsonSchema(txnew_base_report)
          });
          break;
        case 'txnew-summary-report':
          resolve({
            main: this.cloneJsonSchema(txnew_summary)
          });
          break;
        case 'txcurrReportAggregate':
          resolve({
            main: this.cloneJsonSchema(txcurr_aggregate_report),
            txcurrReportBase: this.cloneJsonSchema(txcurr_base_report)
          });
          break;
        case 'txcurr-summary-report':
          resolve({
            main: this.cloneJsonSchema(txcurr_summary)
          });
          break;
        case 'tx1mmsReportAggregate':
          resolve({
            main: this.cloneJsonSchema(tx1mms_aggregate_report),
            tx1mmsReportBase: this.cloneJsonSchema(tx1mms_base_report)
          });
          break;
        case 'tx2mmsReportAggregate':
          resolve({
            main: this.cloneJsonSchema(tx2mms_aggregate_report),
            tx2mmsReportBase: this.cloneJsonSchema(tx2mms_base_report)
          });
          break;
        case 'tx3mmdReportAggregate':
          resolve({
            main: this.cloneJsonSchema(tx3mmd_aggregate_report),
            tx3mmdReportBase: this.cloneJsonSchema(tx3mmd_base_report)
          });
          break;
        case 'tx4mmdReportAggregate':
          resolve({
            main: this.cloneJsonSchema(tx4mmd_aggregate_report),
            tx4mmdReportBase: this.cloneJsonSchema(tx4mmd_base_report)
          });
          break;
        case 'tx5mmdReportAggregate':
          resolve({
            main: this.cloneJsonSchema(tx5mmd_aggregate_report),
            tx5mmdReportBase: this.cloneJsonSchema(tx5mmd_base_report)
          });
          break;
        case 'tx6mmdReportAggregate':
          resolve({
            main: this.cloneJsonSchema(tx6mmd_aggregate_report),
            tx6mmdReportBase: this.cloneJsonSchema(tx6mmd_base_report)
          });
          break;
        case 'txmmd-summary-report':
          resolve({
            main: this.cloneJsonSchema(txmmd_summary)
          });
          break;
        case 'txrttReportAggregate':
          resolve({
            main: this.cloneJsonSchema(txrtt_aggregate_report),
            txrttReportBase: this.cloneJsonSchema(txrtt_base_report)
          });
          break;
        case 'txrtt-summary-report':
          resolve({
            main: this.cloneJsonSchema(txrtt_summary)
          });
          break;
        case 'plhiv-ncd-v2-monthly-report':
          resolve({
            main: this.cloneJsonSchema(plhiv_ncd_v2_monthly_report)
          });
          break;
        case 'htnPlhivAggregate':
          resolve({
            main: this.cloneJsonSchema(htn_plhiv_aggregate),
            htnPlhivBase: this.cloneJsonSchema(htn_plhiv_base)
          });
          break;
        case 'dmPlhivAggregate':
          resolve({
            main: this.cloneJsonSchema(dm_plhiv_aggregate),
            dmPlhivBase: this.cloneJsonSchema(dm_plhiv_base)
          });
          break;

        case 'depPlhivAggregate':
          resolve({
            main: this.cloneJsonSchema(dep_plhiv_aggregate),
            depPlhivBase: this.cloneJsonSchema(dep_plhiv_base)
          });
          break;

        case 'anxPlhivAggregate':
          resolve({
            main: this.cloneJsonSchema(anx_plhiv_aggregate),
            anxPlhivBase: this.cloneJsonSchema(anx_plhiv_base)
          });
          break;

        case 'bipPlhivAggregate':
          resolve({
            main: this.cloneJsonSchema(bip_plhiv_aggregate),
            bipPlhivBase: this.cloneJsonSchema(bip_plhiv_base)
          });
          break;

        case 'perPlhivAggregate':
          resolve({
            main: this.cloneJsonSchema(per_plhiv_aggregate),
            perPlhivBase: this.cloneJsonSchema(per_plhiv_base)
          });
          break;
        case 'fedPlhivAggregate':
          resolve({
            main: this.cloneJsonSchema(fed_plhiv_aggregate),
            fedPlhivBase: this.cloneJsonSchema(fed_plhiv_base)
          });
          break;

        case 'ocdPlhivAggregate':
          resolve({
            main: this.cloneJsonSchema(ocd_plhiv_aggregate),
            ocdPlhivBase: this.cloneJsonSchema(ocd_plhiv_base)
          });
          break;

        case 'genMDPlhivAggregate':
          resolve({
            main: this.cloneJsonSchema(genMD_plhiv_aggregate),
            genMDPlhivBase: this.cloneJsonSchema(genMD_plhiv_base)
          });
          break;
        case 'stMDPlhivAggregate':
          resolve({
            main: this.cloneJsonSchema(stMD_plhiv_aggregate),
            stMDPlhivBase: this.cloneJsonSchema(stMD_plhiv_base)
          });
          break;
        case 'totMDPlhivAggregate':
          resolve({
            main: this.cloneJsonSchema(totMD_plhiv_aggregate),
            totMDPlhivBase: this.cloneJsonSchema(totMD_plhiv_base)
          });
          break;
        case 'cvdPlhivAggregate':
          resolve({
            main: this.cloneJsonSchema(cvd_plhiv_aggregate),
            cvdPlhivBase: this.cloneJsonSchema(cvd_plhiv_base)
          });
          break;
        case 'neuPlhivAggregate':
          resolve({
            main: this.cloneJsonSchema(neu_plhiv_aggregate),
            neuPlhivBase: this.cloneJsonSchema(neu_plhiv_base)
          });
          break;
        case 'rhePlhivAggregate':
          resolve({
            main: this.cloneJsonSchema(rhe_plhiv_aggregate),
            rhePlhivBase: this.cloneJsonSchema(rhe_plhiv_base)
          });
          break;
        case 'kdPlhivAggregate':
          resolve({
            main: this.cloneJsonSchema(kd_plhiv_aggregate),
            kdPlhivBase: this.cloneJsonSchema(kd_plhiv_base)
          });
          break;
        default:
          reject('Unknown report ', reportName);
          break;
      }
    });
  }

  generateReportQuery(reportSchemas, params) {
    let jSql = this.getJson2Sql(reportSchemas, params);
    return new Promise((resolve, reject) => {
      try {
        resolve(jSql.generateSQL().toString());
      } catch (error) {
        console.error('Error generating report sql statement', error);
        reject('Encountered an unexpected error', error);
      }
    });
  }

  getJson2Sql(reportSchemas, params) {
    return new Json2Sql(reportSchemas.main, reportSchemas, params);
  }

  executeReportQuery(sqlQuery) {
    let runner = this.getSqlRunner();
    return new Promise((resolve, reject) => {
      runner
        .executeQuery(sqlQuery)
        .then((results) => {
          resolve({
            results: results
          });
        })
        .catch((error) => {
          console.error('Error Executing Mysql Query', error);
          reject(error);
        });
    });
  }

  transFormResults(reportSchemas, result) {
    return new Promise((resolve, reject) => {
      try {
        if (
          reportSchemas &&
          reportSchemas.main &&
          reportSchemas.main.transFormDirectives &&
          reportSchemas.main.transFormDirectives.disaggregationColumns &&
          reportSchemas.main.transFormDirectives.joinColumn
        ) {
          const reportProcessorHelpersService = new ReportProcessorHelpersService();
          let final = reportProcessorHelpersService.tranform(result.results, {
            use: reportSchemas.main.transFormDirectives.disaggregationColumns,
            skip: reportSchemas.main.transFormDirectives.skipColumns || [],
            joinColumn: reportSchemas.main.transFormDirectives.joinColumn
          });
          result.results = final;
        }
        resolve(result);
      } catch (error) {
        console.error(error);
        reject(error);
        // expected output: SyntaxError: unterminated string literal
        // Note - error messages will vary depending on browser
      }
    });
  }

  getSqlRunner() {
    return new QueryService();
  }

  cloneJsonSchema(schema) {
    return JSON.parse(JSON.stringify(schema));
  }
}
