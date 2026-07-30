const db = require('../../etl-db');

function getPatientAdmissionHistory(patientUuid) {
  if (!patientUuid) {
    throw new Error('Patient not defined');
  }
  return new Promise((resolve, reject) => {
    const sql = `SELECT 
    b.bed_number,
    EXTRACT(YEAR FROM (FROM_DAYS(DATEDIFF(NOW(), p.birthdate)))) AS age,
    bm.date_started AS date_admitted,
    bm.date_stopped AS date_discharged,
    TIMESTAMPDIFF(DAY,
        bm.date_started,
        IF(bm.date_stopped IS NULL,
            NOW(),
            bm.date_stopped)) AS days_in_ward,
    p.gender,
    p.uuid AS 'patient_uuid',
    l.name AS 'ward',
    CONCAT(cpn.given_name,
            ' ',
            cpn.middle_name,
            ' ',
            cpn.family_name) AS 'admitted_by'
FROM
    amrs.bed_patient_assignment_map bm
        JOIN
    amrs.person p ON (p.person_id = bm.patient_id)
        JOIN
    amrs.bed b ON (b.bed_id = bm.bed_id)
        JOIN
    amrs.bed_location_map blm ON (blm.bed_id = bm.bed_id)
        JOIN
    amrs.location l ON (l.location_id = blm.location_id)
        JOIN
    amrs.users creator ON (creator.user_id = bm.creator)
        JOIN
    amrs.person_name cpn ON (cpn.person_id = creator.person_id)
WHERE
    bm.voided = 0 AND p.voided = 0
        AND p.uuid = '${patientUuid}';`;
    const queryParts = {
      sql: sql
    };
    db.queryServer(queryParts, function (result) {
      result.sql = sql;
      resolve(result.result);
    });
  });
}
function getAdmissionRequests(locationUuid) {
  if (!locationUuid) {
    throw new Error('Location not defined');
  }
  return new Promise((resolve, reject) => {
    const sql = `SELECT 
    obs.obs_datetime AS 'admission_request_date',
    l.name AS 'admission_location',
    CONCAT(cr.identifier, ' , ', id.identifier) AS 'identifiers',
    UPPER(CONCAT_WS(' ',
                    pn.given_name,
                    pn.middle_name,
                    pn.family_name)) AS patient_name,
    EXTRACT(YEAR FROM (FROM_DAYS(DATEDIFF(NOW(), p.birthdate)))) AS age,
    p.gender,
    l.uuid AS location_uuid,
    p.uuid patient_uuid,
    v.uuid AS visit_uuid,
    vt.name AS 'visit_type'
FROM
    amrs.obs obs
        JOIN
    amrs.obs al ON (obs.obs_group_id = al.obs_group_id
        AND al.concept_id = 12659
        AND obs.voided = 0)
        JOIN
    amrs.encounter re ON (re.encounter_id = obs.encounter_id)
        JOIN
    amrs.visit v ON (v.visit_id = re.visit_id)
        JOIN
    amrs.visit_type vt ON (vt.visit_type_id = v.visit_type_id)
        JOIN
    amrs.location l ON (l.location_id = al.value_text)
        JOIN
    amrs.person p ON (p.person_id = obs.person_id
        AND p.voided = 0)
        INNER JOIN
    amrs.person_name pn ON (pn.person_id = p.person_id
        AND pn.voided = 0)
        LEFT JOIN
    amrs.encounter ae ON (ae.encounter_type = 318
        AND ae.encounter_datetime > obs.obs_datetime
        AND ae.voided = 0 AND ae.patient_id = obs.person_id)
        LEFT JOIN
    amrs.encounter ce ON (ce.encounter_type = 323
        AND ce.encounter_datetime > obs.obs_datetime
        AND ce.voided = 0
        AND ce.patient_id = obs.person_id)
        LEFT JOIN
    amrs.patient_identifier cr ON (cr.patient_id = obs.person_id
        AND cr.identifier_type = 55
        AND cr.voided = 0)
        LEFT JOIN
    amrs.patient_identifier id ON (id.patient_id = obs.person_id
        AND id.identifier_type = 5
        AND id.voided = 0)
WHERE
    obs.concept_id = 12658
        AND obs.value_coded = 12797
        AND obs.voided = 0
        AND l.uuid = '${locationUuid}'
        AND ae.encounter_id IS NULL
        AND ce.encounter_id IS NULL
        group by obs.person_id;`;
    const queryParts = {
      sql: sql
    };
    db.queryServer(queryParts, function (result) {
      result.sql = sql;
      resolve(result.result);
    });
  });
}
module.exports = { getPatientAdmissionHistory, getAdmissionRequests };
