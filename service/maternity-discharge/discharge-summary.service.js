const db = require('../../etl-db');

export class DischargeSummaryService {
  constructor() {}

  getDischargeSummary(crId, amrsId) {
    if (!crId || !amrsId) {
      throw new Error('patient identifier not defined');
    }

    return new Promise((resolve, reject) => {
      const sql = `SELECT
            e.patient_id,
            e.encounter_id,
            CONCAT_WS(' ', pn.given_name, pn.middle_name, pn.family_name) AS patientName,
            TIMESTAMPDIFF(YEAR, p.birthdate, CURDATE()) AS age,
            MAX(CASE WHEN o.concept_id = 1053 THEN o.value_numeric END) AS parity,
            MAX(CASE WHEN o.concept_id = 1868 THEN o.value_datetime END) AS admissionDate,
            MAX(CASE WHEN o.concept_id = 5599 THEN o.value_datetime END) AS deliveryDate,
            MAX(CASE
                WHEN o.value_coded = 1170 THEN 'SVD'
                WHEN o.value_coded = 1171 THEN 'CS'
                WHEN o.value_coded = 1172 THEN 'BREECH'
                WHEN o.value_coded = 5622 THEN 'OTHER'
                WHEN o.value_coded = 1067 THEN 'UNKNOWN'
                WHEN o.value_coded = 2167 THEN 'Vacuum Assisted Birth'
                WHEN o.value_coded = 2166 THEN 'FORCEPS DELIVERY'
                WHEN o.value_coded = 6263 THEN 'ELECTIVE CS'
                WHEN o.value_coded = 6442 THEN 'EMERGENCY CS'
                WHEN o.value_coded = 8316 THEN 'VERTEX DELIVERY'
            END) as modeOfDelivery,
            MAX(CASE
                WHEN o.value_coded = 6227 THEN 'FEMALE'
                WHEN o.value_coded = 6226 THEN 'MALE'
            END) as babySex,
            MAX(CASE WHEN o.concept_id = 6433 THEN o.value_numeric END) AS birthWeight,
            MAX(CASE
                WHEN o.value_coded = 1066 THEN 'ALIVE'
                WHEN o.value_coded = 159 THEN 'DEAD'
            END) as fate,
            MAX(CASE
                WHEN o.value_coded = 8675 THEN 'YES'
            END) as hygieneAdvice,
            MAX(CASE
                WHEN o.value_coded = 5484 THEN 'YES'
            END) as nutrition,
            MAX(CASE
                WHEN o.value_coded = 1368 THEN 'YES'
            END) as breastFeeding,
            MAX(CASE
                WHEN o.value_coded = 6784 THEN 'YES'
            END) as immunization,
            MAX(CASE
                WHEN o.value_coded = 5271 THEN 'YES'
            END) as familyPlanning,
            MAX(CASE WHEN o.concept_id = 7222 THEN o.value_text END) AS remarks,
            MAX(CASE WHEN o.concept_id = 1869 THEN o.value_datetime END) AS dischargeDate,
            MAX(CASE WHEN o.concept_id = 12092 THEN o.value_text END) AS clinician
            from
            amrs.encounter  e
            JOIN amrs.obs o ON o.encounter_id = e.encounter_id
            JOIN amrs.concept_name cn ON cn.concept_id = o.concept_id
            JOIN amrs.person_name pn ON pn.person_id = e.patient_id AND pn.preferred = 1 and pn.voided = 0
            JOIN amrs.person p ON p.person_id = e.patient_id
            JOIN amrs.patient_identifier pi ON pi.patient_id = e.patient_id
            where e.encounter_type = 274
            AND pi.identifier IN ('${crId}', '${amrsId}')
            group by e.patient_id
            order by e.encounter_datetime desc`;
      const queryParts = {
        sql: sql
      };
      db.queryServer(queryParts, function (result) {
        result.sql = sql;
        resolve(result.result);
      });
    });
  }
}
