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
        pn.given_name,
        pn.middle_name,
        pn.family_name,
        pi_nupi.identifier AS nupi_number,
        per.gender,
        TIMESTAMPDIFF(YEAR, per.birthdate, CURDATE()) AS age,
        MAX(CASE WHEN pa.person_attribute_type_id = 10 THEN pa.value END) AS phone_number, 
        MAX(CASE WHEN o.concept_id = 5096 THEN o.value_datetime END) AS "Return to clinic date",     
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
        JOIN amrs.obs ON amrs.obs.encounter_id = e186.encounter_id
        WHERE e186.patient_id = p.patient_id
          AND e186.encounter_type = 186
          AND e186.encounter_datetime >= MAX(CASE WHEN o.concept_id = 9605 THEN o.value_datetime END)
          AND e186.voided = 0
          AND obs.concept_id = 10869
          AND obs.voided = 0
        ORDER BY e186.encounter_datetime DESC
        LIMIT 1
    ) AS health_worker
      FROM
        amrs.patient p
        JOIN amrs.encounter e ON p.patient_id = e.patient_id AND e.encounter_type = 2
        JOIN amrs.location l ON e.location_id = l.location_id
        JOIN amrs.obs o ON e.encounter_id = o.encounter_id AND o.voided = 0
        JOIN amrs.person per ON p.patient_id = per.person_id AND per.voided = 0
        JOIN amrs.person_name pn ON per.person_id = pn.person_id AND pn.voided = 0
        LEFT JOIN amrs.person_attribute pa ON per.person_id = pa.person_id AND pa.voided = 0 AND pa.person_attribute_type_id = 10
        LEFT JOIN amrs.patient_identifier pi_ccc ON pi_ccc.patient_id = p.patient_id AND pi_ccc.identifier_type IN (28, 29) AND pi_ccc.voided = 0
        LEFT JOIN amrs.patient_identifier pi_nupi ON pi_nupi.patient_id = p.patient_id AND pi_nupi.identifier_type = 50 AND pi_nupi.voided = 0
      WHERE
        e.voided = 0
        AND l.uuid = '${location_uuid}'
        AND EXISTS (
          SELECT 1
          FROM amrs.obs o2
          WHERE o2.encounter_id = e.encounter_id
            AND o2.concept_id = 11932
            AND o2.value_coded = 11939
            AND o2.voided = 0
        )
      GROUP BY
        p.patient_id
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
