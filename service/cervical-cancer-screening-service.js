const db = require('../etl-db');

const defs = {
  getPatientLatestCericalScreeningResult,
  getPatientCervicalCancerScreeningSummary
};

function getPatientLatestCericalScreeningResult(personId) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT fli.person_id,
    via_or_via_vili,
    hpv,
    test_datetime,
    TIMESTAMPDIFF(YEAR, test_datetime, NOW()) AS 'years_since_last_test',
    CASE
        WHEN via_or_via_vili IS NOT NULL AND TIMESTAMPDIFF(YEAR, test_datetime, NOW()) < 1 THEN 1
        ELSE NULL
    END AS 'does_not_qualify_for_via_or_via_vili_retest',
    CASE
        WHEN hpv IS NOT NULL AND TIMESTAMPDIFF(YEAR, test_datetime, NOW()) < 3 THEN 1
        ELSE NULL
    END AS 'does_not_qualify_for_hpv_retest',
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
WHERE via_or_via_vili IS NOT NULL OR hpv IS NOT NULL
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
