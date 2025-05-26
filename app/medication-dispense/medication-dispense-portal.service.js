var db = require('../../etl-db');

export class MedicationDispenseModuleService {
  getPatientPrescriptionDispenseDetails = (locationId) => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      const sql = `SELECT DISTINCT
  p.patient_id,
  pe.uuid AS person_uuid,
  pi.identifier AS patient_identifier,
  l.uuid AS pickup_location_uuid,
  pr.encounter_id AS prescription_refill_encounter_id,
  pr.encounter_datetime AS prescription_date, 
  q_concept.name AS Question,
  md.encounter_id AS medication_dispense_encounter_id,
  md.encounter_datetime AS medication_dispense_date,
  o.concept_id AS concept_id,
  
  -- ART regimen line from adult return encounter (concept 04616f5d-b961-4f41-bbd7-bcc0dd235577)
  (SELECT 
    CASE
      WHEN regimen_obs.value_coded IS NOT NULL THEN regimen_concept.name
      WHEN regimen_obs.value_text IS NOT NULL THEN regimen_obs.value_text
      ELSE NULL
    END
   FROM amrs.obs regimen_obs
   LEFT JOIN amrs.concept_name regimen_concept ON regimen_concept.concept_id = regimen_obs.value_coded
     AND regimen_concept.locale = 'en' AND regimen_concept.locale_preferred = 1 AND regimen_concept.voided = 0
   WHERE regimen_obs.concept_id = 6744
     AND regimen_obs.encounter_id = ar.encounter_id
     AND regimen_obs.voided = 0
   LIMIT 1) AS art_regimen_line,
   -- UUID of ART regimen concept
(SELECT 
  concept.uuid
 FROM amrs.obs regimen_obs
 JOIN amrs.concept concept ON concept.concept_id = regimen_obs.value_coded
 WHERE regimen_obs.concept_id = 6744
   AND regimen_obs.encounter_id = ar.encounter_id
   AND regimen_obs.value_coded IS NOT NULL
   AND regimen_obs.voided = 0
 LIMIT 1) AS art_regimen_uuid,

   
  -- Adult return location UUID
  ar.location_id AS adult_return_location_id,
  (SELECT location_uuid.uuid 
   FROM amrs.location location_uuid 
   WHERE location_uuid.location_id = ar.location_id) AS adult_return_location_uuid,
  
  CASE
    WHEN o.concept_id = 1823 THEN "ARVS_STARTED"
    WHEN o.concept_id = 10893 THEN "MEDICATION_DURATION"
    WHEN o.concept_id = 1896 THEN "MEDICATION_FREQUENCY"
    WHEN o.concept_id = 10888 THEN "MEDICATION_DISPENSED"
    WHEN o.concept_id = 1250 THEN "ANTIRETROVIRALS_STARTED"
    ELSE 'N/A'
  END AS questionId,
  
  CASE
    WHEN o.value_coded IS NOT NULL THEN ans_concept.name
    WHEN o.value_text IS NOT NULL THEN o.value_text
    WHEN o.value_numeric IS NOT NULL THEN o.value_numeric
    WHEN d.name IS NOT NULL THEN d.name
    WHEN ordered_drug.name IS NOT NULL THEN ordered_drug.name
    ELSE 'N/A'
  END AS answer,
  
  -- Additional fields
  COALESCE(d.name, ordered_drug.name) AS drug_name,
  COALESCE(d.uuid, ordered_drug.uuid) AS drug_uuid,
  
  CASE
    WHEN md.encounter_id IS NOT NULL THEN 'Dispensed'
    ELSE 'Not Dispensed'
  END AS dispense_status

FROM amrs.patient p
JOIN amrs.patient_identifier pi ON pi.patient_id = p.patient_id
  AND pi.preferred = 1 AND pi.voided = 0

  JOIN amrs.person pe ON pe.person_id = p.patient_id AND pe.voided = 0

JOIN amrs.person_attribute pa ON pa.person_id = p.patient_id
  AND pa.voided = 0 AND pa.person_attribute_type_id = 7 AND pa.value = 541

JOIN amrs.encounter ar ON ar.patient_id = p.patient_id
  AND ar.voided = 0 AND ar.encounter_type = 2

-- Latest prescription refill encounter
JOIN (
  SELECT patient_id, MAX(encounter_datetime) AS max_date
  FROM amrs.encounter 
  WHERE encounter_type = 301 AND voided = 0
  GROUP BY patient_id
) latest_pr ON latest_pr.patient_id = p.patient_id

JOIN amrs.encounter pr ON pr.patient_id = p.patient_id
  AND pr.encounter_datetime = latest_pr.max_date
  AND pr.encounter_type = 301 AND pr.voided = 0

JOIN amrs.obs o ON o.encounter_id = pr.encounter_id AND o.voided = 0

JOIN amrs.concept_name q_concept ON q_concept.concept_id = o.concept_id
  AND q_concept.locale = 'en' AND q_concept.locale_preferred = 1 AND q_concept.voided = 0

LEFT JOIN amrs.concept_name ans_concept ON ans_concept.concept_id = o.value_coded
  AND ans_concept.locale = 'en' AND ans_concept.locale_preferred = 1 AND ans_concept.voided = 0

-- For value_drug
LEFT JOIN amrs.drug d ON d.drug_id = o.value_drug
LEFT JOIN amrs.concept d_concept ON d.concept_id = d_concept.concept_id

-- For order-based drugs
LEFT JOIN amrs.orders ord ON ord.order_id = o.order_id AND ord.voided = 0
LEFT JOIN amrs.drug_order do ON do.order_id = ord.order_id
LEFT JOIN amrs.drug ordered_drug ON ordered_drug.drug_id = do.drug_inventory_id
LEFT JOIN amrs.concept od_concept ON ordered_drug.concept_id = od_concept.concept_id
JOIN amrs.location l ON l.location_id = pa.value

-- Latest medication dispense
LEFT JOIN (
  SELECT md_inner.patient_id, md_inner.encounter_id, md_inner.encounter_datetime
  FROM amrs.encounter md_inner
  INNER JOIN (
    SELECT patient_id, MAX(encounter_datetime) AS max_disp_date
    FROM amrs.encounter
    WHERE encounter_type = 186 AND voided = 0
    GROUP BY patient_id
  ) latest_md ON latest_md.patient_id = md_inner.patient_id
  AND md_inner.encounter_datetime = latest_md.max_disp_date
  AND md_inner.encounter_type = 186 AND md_inner.voided = 0
) md ON md.patient_id = p.patient_id 
  AND md.encounter_datetime >= pr.encounter_datetime

WHERE pa.value = (SELECT location_id FROM amrs.location WHERE uuid = '${locationId}') -- location id
ORDER BY p.patient_id, pr.encounter_datetime DESC;
    
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
