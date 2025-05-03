var db = require('./db');

export class HtsModuleService {
  getHTSData = () => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      const sql = `
     SELECT 
    t1.patient_id,
    t2.gender,
    t3.name,
    t1.encounter_location,
    t1.visit_date,
    CONCAT(COALESCE(t4.given_name, ''),
            ' ',
            COALESCE(t4.middle_name, ''),
            ' ',
            COALESCE(t4.family_name, '')) AS person_name,
    EXTRACT(YEAR FROM (FROM_DAYS(DATEDIFF(NOW(), t2.birthdate)))) AS age,
    t1.ever_tested_for_hiv AS ever_tested,
    t1.population_type AS population_type,
    t1.key_population_type AS key_population_type,
    t1.setting,
    t1.approach,
    t1.test_1_kit_name,
    t1.test_1_kit_lot_no,
    t1.test_1_kit_expiry,
    t1.test_1_result,
    t1.test_2_kit_name,
    t1.test_2_kit_lot_no,
    t1.test_2_kit_expiry,
    t1.test_2_result,
    t1.final_test_result,
    t1.couple_discordant,
    t1.patient_had_hiv_self_test,
    t1.referral_facility
FROM
    amrs_etl.etl_hts_test t1
        INNER JOIN
    afyastat.person t2 ON (t1.patient_id = t2.person_id)
        INNER JOIN
    afyastat.location t3 ON (t3.location_id = t1.encounter_location)
        LEFT JOIN
    afyastat.person_name t4 ON (t1.patient_id = t4.person_id)
WHERE
    DATE(t1.visit_date) >= '2024-07-01'
        AND DATE(t1.visit_date) <= '2024-07-31'
        AND t1.encounter_location IN (192)
ORDER BY t1.visit_date    
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
