const Promise = require('bluebird');
const db = require('../etl-db');
import { BaseMysqlReport } from '../app/reporting-framework/base-mysql.report';
import { PatientlistMysqlReport } from '../app/reporting-framework/patientlist-mysql.report';

export default class MlWeeklyPredictionsService {
  getAggregateReport(reportParams) {
    return new Promise(function (resolve, reject) {
      const report = new BaseMysqlReport(
        'mlWeeklyPredictionsAggregate',
        reportParams.requestParams
      );

      Promise.join(report.generateReport(), (results) => {
        let result = results.results.results;
        results.size = result ? result.length : 0;
        results.result = result;
        delete results['results'];
        resolve(results);
      }).catch((errors) => {
        reject(errors);
      });
    });
  }

  getPatientListReport(reportParams) {
    const indicators = reportParams.indicators
      ? reportParams.indicators.split(',')
      : [];
    delete reportParams['gender'];

    const report = new PatientlistMysqlReport(
      'mlWeeklyPredictionsAggregate',
      reportParams
    );

    return new Promise(function (resolve, reject) {
      Promise.join(report.generatePatientListReport(indicators), (results) => {
        results['result'] = results.results.results;
        delete results['results'];
        resolve(results);
      }).catch((errors) => {
        console.log('Error: ', errors);
        reject(errors);
      });
    });
  }
  getPatientsWithPredictions(patientUuId) {
    return new Promise((resolve, reject) => {
      const week = this.getNextWeek();
      const predictedPatients = `SELECT ml.person_id AS person_id, fi.ccc AS ccc_number, fi.ovcid AS ovcid_id, fi.nupi AS upi_number, p.name AS program, ml.predicted_risk AS predicted_risk, ml.week AS week, ml.predicted_prob_disengage AS predicted_prob_disengage, DATE_FORMAT(ml.prediction_generated_date, '%Y-%m-%d') AS prediction_generated_date, DATE_FORMAT(ml.rtc_date, '%Y-%m-%d') AS rtc_date, pre.follow_up_type AS follow_up_type, pre.follow_up_reason AS follow_up_reason, pre.rescheduled_date AS rescheduled_date, pre.reschedule_appointment AS reschedule_appointment, pre.contact_reached_phone_follow_up AS contact_reached, pre.attempted_home_visit AS attempted_home_visit, pre.reason_not_attempted_home_visit AS reason_not_attempted_home_visit, pre.was_client_found AS was_client_found, pre.reason_client_not_found AS reason_client_not_found, pre.home_visit_personnel AS home_visit_personnel, IF((pre.is_successful_phone_follow_up = 'YES' OR (pre.attempted_home_visit = 'YES' AND pre.was_client_found = 'YES')), 1, 0) AS was_follow_up_successful, pre.comments AS comments, t1.uuid AS patient_uuid, t1.uuid AS uuid, t1.gender AS gender, t1.birthdate AS birthdate, EXTRACT(YEAR FROM (FROM_DAYS(DATEDIFF(NOW(), t1.birthdate)))) AS age, CONCAT(COALESCE(person_name.given_name, ''), ' ', COALESCE(person_name.middle_name, ''), ' ', COALESCE(person_name.family_name, '')) AS person_name, GROUP_CONCAT(DISTINCT id.identifier SEPARATOR ', ') AS identifiers, GROUP_CONCAT(DISTINCT contacts.value SEPARATOR ', ') AS phone_number, DATE_FORMAT(fh.rtc_date, '%Y-%m-%d') AS latest_rtc_date, fli.vl_1 AS latest_vl, CASE WHEN (fli.vl_1 > 1000) THEN 'Suspected Treatment Failure' WHEN (fli.vl_1 >= 200 AND fli.vl_1 < 1000) THEN 'High Risk Low Level Viremia' WHEN (fli.vl_1 >= 50 AND fli.vl_1 < 200) THEN 'Low Risk Low Level Viremia' WHEN (fli.vl_1 < 50) THEN 'LDL' ELSE NULL END AS vl_category, DATE_FORMAT(fli.vl_1_date, '%Y-%m-%d') AS latest_vl_date, CONCAT(COALESCE(DATE_FORMAT(fh.encounter_datetime, '%Y-%m-%d'), ''), ' ', COALESCE(et.name, '')) AS last_appointment, fh.cur_arv_meds AS cur_meds, fh.vl_2 AS previous_vl, DATE_FORMAT(fh.vl_2_date, '%Y-%m-%d') AS previous_vl_date, pa.address3 AS nearest_center, CASE WHEN (c.received_covid_19_vaccine = 1066 AND EXTRACT(YEAR FROM (FROM_DAYS(DATEDIFF(NOW(), t1.birthdate)))) >= 15) THEN 'Not vaccinated' WHEN (c.person_id IS NULL AND c.second_dose_vaccine_administered IS NULL AND EXTRACT(YEAR FROM (FROM_DAYS(DATEDIFF(NOW(), t1.birthdate)))) >= 15) THEN 'Unknown Covid 19 Vaccination' WHEN (c.vaccination_status = 11907) THEN 'Partially Vaccinated' WHEN (c.vaccination_status = 2208) THEN 'Fully Vaccinated' ELSE NULL END AS covid_19_vaccination_status, CASE WHEN (consent.patient_sms_consent_provided = 1066) THEN 'NO' WHEN (consent.patient_sms_consent_provided = 1065) THEN 'YES' ELSE NULL END AS sms_consent_provided, CASE WHEN (fh.patient_category IS NULL) THEN 'N/A' WHEN (fh.patient_category = 0) THEN 'N/A' WHEN (fh.patient_category = 11550) THEN 'UnWell' WHEN (fh.patient_category = 9070) THEN 'Well' ELSE NULL END AS patient_category, consent.sms_receive_time AS sms_receive_time, NULL AS sms_delivery_status, DATE_FORMAT(tb.tb_screening_datetime, '%Y-%m-%d') AS tb_screening_date, CASE WHEN (tb.tb_screening_result = 10974) THEN 'INH PROPHYLAXIS' WHEN (tb.tb_screening_result = 10922) THEN 'ISONIAZID PREVENTIVE TREATMENT PROGRAM' WHEN (tb.tb_screening_result = 10767) THEN 'ON TREATMENT FOR DISEASE' WHEN (tb.tb_screening_result = 6621) THEN 'NOT ASSESSED' WHEN (tb.tb_screening_result = 10678) THEN 'NO SIGNS OR SYMPTOMS OF DISEASE' WHEN (tb.tb_screening_result = 656) THEN 'ISONIAZID' WHEN (tb.tb_screening_result = 6137) THEN 'CONFIRMED' WHEN (tb.tb_screening_result = 6176) THEN 'CURRENTLY ON TUBERCULOSIS TREATMENT' WHEN (tb.tb_screening_result = 1118) THEN 'NOT DONE' WHEN (tb.tb_screening_result = 6971) THEN 'POSSIBLE' WHEN (tb.tb_screening_result = 1107) THEN 'NONE' ELSE NULL END AS tb_screening_result, DATE_FORMAT(cs.encounter_datetime, '%Y-%m-%d') AS cervical_screening_date, CASE WHEN (cs.observations_from_positive_via_or_via_vili_test IS NOT NULL) THEN 'VIA or VIA/VILI' WHEN (cs.screening_method = 2322) THEN 'HPV' WHEN (cs.screening_method = 885) THEN 'PAP SMEAR' WHEN (cs.screening_method = 9434) THEN 'VIA or VIA/VILI' ELSE NULL END AS cervical_screening_method, CASE WHEN (cs.observations_from_positive_via_or_via_vili_test = 9593) THEN 'FRIABLE TISSUE' WHEN (cs.observations_from_positive_via_or_via_vili_test = 7472) THEN 'ATYPICAL BLOOD VESSELS' WHEN (cs.observations_from_positive_via_or_via_vili_test = 6497) THEN 'DYSFUNCTIONAL UTERINE BLEEDING' WHEN (cs.observations_from_positive_via_or_via_vili_test = 7293) THEN 'ULCER' WHEN (cs.observations_from_positive_via_or_via_vili_test = 9592) THEN 'BRIGHT WHITE LESION' WHEN (cs.observations_from_positive_via_or_via_vili_test = 9591) THEN 'OYSTERWHITE LESION' WHEN (cs.observations_from_positive_via_or_via_vili_test = 7470) THEN 'PUNCTUATED CAPILLARIES' WHEN (cs.observations_from_positive_via_or_via_vili_test = 5245) THEN 'PALLOR' WHEN (cs.observations_from_positive_via_or_via_vili_test = 7469) THEN 'ACETOWHITE LESION' WHEN (cs.observations_from_positive_via_or_via_vili_test = 1115) THEN 'NORMAL' WHEN (cs.pap_smear_test_result = 6) THEN 'INVASIVE CANCER' WHEN (cs.pap_smear_test_result = 5) THEN 'AGUS' WHEN (cs.pap_smear_test_result = 4) THEN 'HSIL/CIS' WHEN (cs.pap_smear_test_result = 3) THEN 'LSIL' WHEN (cs.pap_smear_test_result = 2) THEN 'ASCUS' WHEN (cs.pap_smear_test_result = 1) THEN 'NORMAL' WHEN (cs.hpv_test_result = 3) THEN 'INDETERMINATE' WHEN (cs.hpv_test_result = 2) THEN 'POSITIVE' WHEN (cs.hpv_test_result = 1) THEN 'NEGATIVE' WHEN (cs.via_or_via_vili_test_result = 3) THEN 'SUSPICIOUS OF CANCER' WHEN (cs.via_or_via_vili_test_result = 2) THEN 'POSITIVE' WHEN (cs.via_or_via_vili_test_result = 1) THEN 'NEGATIVE' ELSE NULL END AS cervical_screening_result FROM predictions.ml_weekly_predictions ml LEFT JOIN etl.flat_hiv_summary_v15b de ON (de.encounter_id = ml.encounter_id) LEFT JOIN etl.flat_patient_identifiers_v1 fi ON (de.person_id = fi.patient_id) LEFT JOIN etl.program_visit_map pm ON (de.visit_type = pm.visit_type_id) LEFT JOIN amrs.program p ON (p.program_id = pm.program_type_id) LEFT JOIN etl.pre_appointment_summary pre ON (pre.person_id = ml.person_id) INNER JOIN amrs.person t1 ON (ml.person_id = t1.person_id) LEFT JOIN (SELECT fli.person_id, fli.hiv_viral_load AS vl_1, fli.test_datetime AS vl_1_date FROM etl.flat_labs_and_imaging fli INNER JOIN (SELECT person_id, MAX(test_datetime) AS max_vl_1_date, MAX(encounter_id) AS encounter_id FROM etl.flat_labs_and_imaging fli WHERE fli.hiv_viral_load IS NOT NULL GROUP BY person_id) max_dates ON fli.person_id = max_dates.person_id AND fli.encounter_id = max_dates.encounter_id) fli ON (fli.person_id = t1.person_id) LEFT JOIN amrs.person_name person_name ON (t1.person_id = person_name.person_id AND (person_name.voided IS NULL || person_name.voided = 0) AND person_name.preferred = 1) LEFT JOIN amrs.patient_identifier id ON (t1.person_id = id.patient_id AND (id.voided IS NULL || id.voided = 0)) LEFT JOIN amrs.person_attribute contacts ON (t1.person_id = contacts.person_id AND (contacts.voided IS NULL || contacts.voided = 0) AND contacts.person_attribute_type_id IN (10 , 48)) LEFT JOIN etl.flat_hiv_summary_v15b fh ON (t1.person_id = fh.person_id AND fh.next_clinical_location_id IS NULL AND fh.encounter_type NOT IN (99999)) LEFT JOIN amrs.encounter_type et ON (fh.encounter_type = et.encounter_type_id) LEFT JOIN amrs.person_address pa ON (t1.person_id = pa.person_id) LEFT JOIN etl.flat_covid_extract c ON (t1.person_id = c.person_id AND c.next_encounter_datetime IS NULL) LEFT JOIN etl.flat_consent consent ON (consent.person_id = t1.person_id) LEFT JOIN etl.flat_hiv_summary_v15b tb ON (t1.person_id = tb.person_id AND tb.next_clinical_datetime_hiv IS NULL AND tb.is_clinical_encounter = 1) LEFT JOIN etl.flat_cervical_cancer_screening_rc cs ON (cs.person_id = t1.person_id AND cs.next_clinical_datetime_cervical_cancer_screening IS NULL) LEFT JOIN etl.sms_delivery_report delivery_report ON (delivery_report.person_id = t1.person_id AND DATE_FORMAT(delivery_report.date_created, '%Y-%m-%d') = '{startDate}') WHERE t1.uuid='${patientUuId}' AND (ml.week = '${week}') AND (ml.predicted_risk IS NOT NULL) GROUP BY t1.person_id ORDER BY ml.predicted_prob_disengage DESC , ml.prediction_generated_date DESC , pre.encounter_datetime DESC`;
      const queryParts = {
        sql: predictedPatients
      };
      console.log('query', queryParts);
      db.queryServer(queryParts, function (result) {
        result.sql = predictedPatients;
        resolve(result.result);
      });
    });
  }
  getNextWeek() {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate()); // Add 7 days

    const year = currentDate.getFullYear();
    const weekNumber = this.getISOWeek(currentDate);

    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
  }

  // Helper function to get ISO week number
  getISOWeek(date) {
    const dayOfWeek = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayOfWeek);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
    return weekNumber;
  }
}
