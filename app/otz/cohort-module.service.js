var db = require('../../etl-db');

export class CohortModuleService {
  getCohortSummary = (cohortUuids) => {
    const uuids = cohortUuids
      .split(',')
      .map((s) => {
        return `"${s}"`;
      })
      .join(',');
    return new Promise((resolve, reject) => {
      let queryParts = {};
      const sql = `SELECT 
        c.uuid,
        COUNT(DISTINCT cm.patient_id) AS total_patients,
        IFNULL(SUM(CASE
                    WHEN fl.hiv_viral_load < 200 THEN 1
                    ELSE 0
                END) / NULLIF(COUNT(DISTINCT cm.patient_id), 0) * 100,
                0) AS suppression_rate_percentage
    FROM
        amrs.cohort c
            LEFT JOIN
        amrs.location l ON l.location_id = c.location_id
            INNER JOIN
        amrs.cohort_member cm ON c.cohort_id = cm.cohort_id
            LEFT JOIN
        (SELECT 
            person_id, MAX(test_datetime) AS latest_test_datetime
        FROM
            etl.flat_labs_and_imaging
        WHERE
            hiv_viral_load IS NOT NULL
        GROUP BY person_id) AS latest_tests ON cm.patient_id = latest_tests.person_id
            LEFT JOIN
        etl.flat_labs_and_imaging fl ON latest_tests.person_id = fl.person_id
            AND latest_tests.latest_test_datetime = fl.test_datetime
    WHERE
        l.uuid = '${cohortUuids}'
    GROUP BY c.cohort_id;
    
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

  /**
   * Every member visit of a group's meetings, with each visit's encounters
   * (type and time only) - what the group page needs for attendance, in one
   * query instead of OpenMRS building each visit and encounter separately.
   * One row per encounter; a visit without encounters has one row with null
   * encounter fields.
   */
  getGroupMeetingAttendance = (cohortUuid) => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT
          cv.uuid AS cohort_visit_uuid,
          p.uuid AS patient_uuid,
          v.uuid AS visit_uuid,
          v.date_started AS visit_start,
          e.encounter_datetime,
          et.uuid AS encounter_type_uuid
        FROM amrs.cohort c
          JOIN amrs.cohort_visit cv
            ON cv.cohort_id = c.cohort_id AND cv.voided = 0
          JOIN amrs.cohort_member_visit mv
            ON mv.cohort_visit_id = cv.cohort_visit_id AND mv.voided = 0
          JOIN amrs.visit v
            ON v.visit_id = mv.visit_id AND v.voided = 0
          JOIN amrs.person p
            ON p.person_id = v.patient_id
          LEFT JOIN amrs.encounter e
            ON e.visit_id = v.visit_id AND e.voided = 0
          LEFT JOIN amrs.encounter_type et
            ON et.encounter_type_id = e.encounter_type
        WHERE c.uuid = ?`;
      db.queryServer({ sql: sql, values: [cohortUuid] }, (result) => {
        if (result.error) {
          reject(result.error);
        } else {
          resolve(result.result || []);
        }
      });
    });
  };
}
