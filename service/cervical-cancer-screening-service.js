const db = require('../etl-db');

const defs = {
  getPatientLatestCericalScreeningResult,
  getPatientCervicalCancerScreeningSummary
};

function getPatientLatestCericalScreeningResult(personId) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT fli.person_id,
    via_or_via_vili,
    latest_res.encounter_datetime as last_test_datetime,
    TIMESTAMPDIFF(YEAR, latest_res.encounter_datetime, NOW()) AS 'years_since_last_test',
    CASE WHEN (latest_res.last_test = 1 AND TIMESTAMPDIFF(YEAR, latest_res.encounter_datetime, NOW()) >= 3) OR (latest_res.last_test = 2 AND TIMESTAMPDIFF(YEAR, latest_res.encounter_datetime, NOW()) >= 1)
      THEN 1 ELSE NULL 
      END AS 'qualifies_for_retest',
    TIMESTAMPDIFF(YEAR, test_datetime, NOW()) AS 'years_since_last_via_or_via_vili_test',
    CASE
        WHEN TIMESTAMPDIFF(YEAR, test_datetime, NOW()) >= 1 THEN 1
        ELSE NULL
    END AS 'qualifies_for_via_or_via_vili_retest',
    CASE
        WHEN value_coded = 5276 THEN 1
        ELSE NULL
    END AS 'has_hysterectomy_done'
FROM etl.flat_labs_and_imaging fli
LEFT JOIN
(SELECT person_id,
       value_coded,
       max(obs_datetime) latest_steralization_dt
FROM amrs.obs
WHERE value_coded = 5276
  AND person_id = ${personId}
  AND voided = 0
LIMIT 1) fs ON (fli.person_id = fs.person_id)
LEFT JOIN (SELECT person_id, encounter_id, MAX(encounter_datetime) as encounter_datetime, 
  CASE WHEN hpv_test_result IS NOT NULL THEN 1 ELSE CASE WHEN via_or_via_vili_test_result IS NOT NULL THEN 2 ELSE NULL END END AS last_test
  FROM etl.flat_cervical_cancer_screening WHERE (hpv_test_result IS NOT NULL OR via_or_via_vili_test_result IS NOT NULL) AND person_id = ${personId}) latest_res
  ON latest_res.person_id = fli.person_id
WHERE via_or_via_vili IS NOT NULL
AND fli.person_id = ${personId}
ORDER BY test_datetime DESC
LIMIT 1;`;

    const queryParts = {
      sql: sql
    };
    db.queryServer(queryParts, function (result) {
      result.sql = sql;
      resolve(result);
    });
  });
}

function getPatientCervicalCancerScreeningSummary(patientUuId) {
  return new Promise((resolve, reject) => {
    if (patientUuId === '' || patientUuId === null) {
      reject('Patient Uuid is missing');
    } else {
      const sql = `CALL etl.sp_get_cacx_info('${patientUuId}')`;

      const queryParts = {
        sql: sql
      };
      db.queryServer(queryParts, function (result) {
        const results = {
          startIndex: result.startIndex,
          size: result.result[0].length,
          result: result.result[0]
        };
        resolve(results);
      });
    }
  });
}

module.exports = defs;
