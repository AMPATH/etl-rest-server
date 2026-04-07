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
module.exports = { getPatientAdmissionHistory };
