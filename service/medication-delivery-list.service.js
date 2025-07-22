var db = require('../etl-db');

export class MedicationDeliveryService {
  getMedicationDeliveryList = (location_uuid, startDate, endDate) => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      const sql = `
    SELECT
    p.patient_id,
    per.uuid AS person_uuid,
    pi_ccc.identifier AS ccc_number,
    e.encounter_datetime AS enrollment_date,
    pn.given_name,
    pn.middle_name,
    pn.family_name,
    pi_nupi.identifier AS nupi_number,
    ident.identifier AS identifier,
    per.gender,
    l.uuid AS location_uuid,
    TIMESTAMPDIFF(YEAR, per.birthdate, CURDATE()) AS age,

    MAX(CASE WHEN pa.person_attribute_type_id = 10 THEN pa.value END) AS phone_number,

    MAX(CASE WHEN o.concept_id = 5096 THEN o.value_datetime END) AS 'Return to clinic date',
    MAX(CASE WHEN o.concept_id = 9605 THEN o.value_datetime END) AS medication_pickup_date,

    CASE
        WHEN EXISTS (
            SELECT 1
            FROM amrs.encounter e186
            WHERE e186.patient_id = p.patient_id
              AND e186.encounter_type = 186
              AND e186.encounter_datetime >= MAX(CASE WHEN o.concept_id = 9605 THEN o.value_datetime END)
              AND e186.voided = 0
        ) THEN 'Picked'
        ELSE 'Not Picked'
    END AS pickup_status,

    (
        SELECT obs.value_text
        FROM amrs.encounter e186
        JOIN amrs.obs ON obs.encounter_id = e186.encounter_id
        WHERE e186.patient_id = p.patient_id
          AND e186.encounter_type = 186
          AND e186.encounter_datetime >= MAX(CASE WHEN o.concept_id = 9605 THEN o.value_datetime END)
          AND e186.voided = 0
          AND obs.concept_id = 10869
          AND obs.voided = 0
        ORDER BY e186.encounter_datetime DESC
        LIMIT 1
    ) AS health_worker,

    fhs.latest_vl,
    fhs.latest_vl_date,
    fhs.latest_rtc_date,

    GROUP_CONCAT(DISTINCT q_concept.name ORDER BY q_concept.name SEPARATOR ', ') AS current_regimen

FROM
    amrs.patient p
JOIN amrs.encounter e ON p.patient_id = e.patient_id AND e.encounter_type = 2 AND e.voided = 0
JOIN amrs.location l ON e.location_id = l.location_id
JOIN amrs.obs o ON e.encounter_id = o.encounter_id AND o.voided = 0
JOIN amrs.person per ON p.patient_id = per.person_id AND per.voided = 0
JOIN (
  SELECT person_id, given_name, middle_name, family_name
  FROM amrs.person_name
  WHERE voided = 0 AND preferred = 1
) pn ON pn.person_id = per.person_id
LEFT JOIN amrs.person_attribute pa ON per.person_id = pa.person_id AND pa.voided = 0 AND pa.person_attribute_type_id = 10
LEFT JOIN amrs.patient_identifier pi_ccc ON pi_ccc.patient_id = p.patient_id AND pi_ccc.identifier_type IN (28, 29) AND pi_ccc.voided = 0
LEFT JOIN amrs.patient_identifier ident ON ident.patient_id = p.patient_id AND ident.identifier_type IN (8, 3, 1) AND ident.voided = 0
LEFT JOIN amrs.patient_identifier pi_nupi ON pi_nupi.patient_id = p.patient_id AND pi_nupi.identifier_type = 45 AND pi_nupi.voided = 0

LEFT JOIN (
    SELECT 
        f.person_id,
        f.vl_1 AS latest_vl,
        f.vl_1_date AS latest_vl_date,
        f.prev_clinical_rtc_date_hiv AS latest_rtc_date,
        f.cur_arv_meds AS current_regimen
    FROM etl.flat_hiv_summary_v15b f
    INNER JOIN (
        SELECT person_id, MAX(encounter_datetime) AS latest_visit
        FROM etl.flat_hiv_summary_v15b
        GROUP BY person_id
    ) latest_summary
      ON f.person_id = latest_summary.person_id AND f.encounter_datetime = latest_summary.latest_visit
) fhs ON fhs.person_id = p.patient_id
LEFT JOIN amrs.drug d ON d.drug_id = o.value_drug
LEFT JOIN amrs.concept_name q_concept 
  ON q_concept.concept_id = d.concept_id
 AND q_concept.locale = 'en'
 AND q_concept.locale_preferred = 1
 AND q_concept.voided = 0

WHERE
    l.uuid = '${location_uuid}'
    AND EXISTS (
        SELECT 1
        FROM amrs.obs o2
        WHERE o2.encounter_id = e.encounter_id
          AND o2.concept_id = 11932
          AND o2.value_coded = 11939
          AND o2.voided = 0
    )

GROUP BY
    p.patient_id,
    per.uuid,
    pi_ccc.identifier,
    pn.given_name,
    pn.middle_name,
    pn.family_name,
    pi_nupi.identifier,
    ident.identifier,
    per.gender,
    l.uuid,
    per.birthdate,
    fhs.latest_vl,
    fhs.latest_vl_date,
    fhs.latest_rtc_date

HAVING
    medication_pickup_date BETWEEN '${startDate}' AND '${endDate}'

ORDER BY
    pn.given_name, pn.family_name;
      `;

      queryParts = {
        sql: sql
      };

      return db.queryServer(queryParts, function (result) {
        result.sql = sql;
        resolve(result);
      });
    });
  };
}
