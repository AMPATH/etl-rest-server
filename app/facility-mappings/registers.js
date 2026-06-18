var db = require('../../etl-db');

var defs = {
  getPrEPRegisterData: (params) => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      let sql =
        'SELECT l.name as location_name, fps.encounter_id, pi.identifier AS PrEP_Number, pi2.identifier AS National_ID, pi3.identifier AS NUPI, fps.encounter_datetime AS Date_Of_Visit, EXTRACT(YEAR FROM fps.encounter_datetime) - EXTRACT(YEAR FROM fps.birthdate) - CASE WHEN (EXTRACT(MONTH FROM fps.encounter_datetime) < EXTRACT(MONTH FROM fps.birthdate)) OR (EXTRACT(MONTH FROM fps.encounter_datetime) = EXTRACT(MONTH FROM fps.birthdate) AND EXTRACT(DAY FROM fps.encounter_datetime) < EXTRACT(DAY FROM fps.birthdate)) THEN 1 ELSE 0 END Age, fps.gender AS Sex, fps.population_type, NULL AS client_prep_status, NULL AS prep_method, CASE WHEN COALESCE(fps.hiv_rapid_test_result) = 664 THEN "N" WHEN COALESCE(fps.hiv_rapid_test_result) = 703 THEN "P" END AS HIV_result, NULL AS with_STI, COALESCE(fps.initiation_reason, fps.discontinued_reason) AS remarks FROM etl.flat_prep_summary_v1_1 fps LEFT JOIN amrs.location l ON l.location_id = fps.location_id LEFT JOIN amrs.patient_identifier pi ON fps.person_id = pi.patient_id AND pi.identifier_type = 44 LEFT JOIN amrs.patient_identifier pi2 ON fps.person_id = pi2.patient_id AND pi2.identifier_type = 5 LEFT JOIN amrs.patient_identifier pi3 ON fps.person_id = pi3.patient_id AND pi3.identifier_type = 45 WHERE DATE(fps.encounter_datetime)= "2024-01-02" AND fps.location_id in (1,13,14)';
      queryParts = {
        sql: sql
      };
      return db.queryServer(queryParts, function (result) {
        result.sql = sql;
        resolve(result.result);
      });
    });
  }
};

module.exports = defs;
