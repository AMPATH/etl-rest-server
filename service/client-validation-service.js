var db = require('../etl-db');
const Promise = require('bluebird');

export class ClientValidationIssues {
  generateAggregates() {
    const that = this;
    return new Promise(function (resolve, reject) {
      const sql = that.aggregateQuery();
      const queryParts = {
        sql: sql
      };
      return db.queryServer(queryParts, function (result) {
        resolve(result);
      });
    });
  }

  aggregateQuery() {
    return `SELECT
    County,
    l.name AS 'Health Facility',
    mfl_code AS 'MFL Code',
    cc.identifier AS 'CCC NO',fh.person_id,
    nv.clientNumber as 'NUPI',
    nv.errorDescription as "Error description",
    CONCAT(COALESCE(person_name.given_name, ''),
            ' ',
            COALESCE(person_name.middle_name, ''),
            ' ',
            COALESCE(person_name.family_name, '')) AS 'person_name',
    GROUP_CONCAT(DISTINCT contacts.value
        SEPARATOR ',') AS 'phone_number',
    DATE_FORMAT(pf.birthdate, '%Y-%m-%d') AS 'Date of Birth',  
    EXTRACT(YEAR FROM (FROM_DAYS(DATEDIFF(NOW(), pf.birthdate)))) AS age,
    pf.gender
    
FROM
    etl.flat_hiv_summary_v15b fh
        LEFT JOIN
    amrs_migration.patient_identifier cc ON (fh.person_id = cc.patient_id
        AND cc.identifier_type = 28
        AND cc.voided = 0)
        LEFT JOIN
    amrs_migration.person pf ON (fh.person_id = pf.person_id AND dead = 0
        AND pf.voided = 0)
        LEFT JOIN
    amrs_migration.location l ON (l.location_id = fh.last_non_transit_location_id)
        LEFT JOIN
    ndwr.mfl_codes lx ON (l.location_id = lx.location_id)
        LEFT JOIN
    amrs_migration.person_name person_name ON (fh.person_id = person_name.person_id
        AND (person_name.voided IS NULL
        || person_name.voided = 0)
        AND person_name.preferred = 1)
        LEFT JOIN
    amrs_migration.person_attribute contacts ON (fh.person_id = contacts.person_id
        AND (contacts.voided IS NULL
        || contacts.voided = 0)
        AND contacts.person_attribute_type_id IN (10 , 48))
        LEFT JOIN
    amrs_migration.patient_identifier id ON (id.patient_id = fh.person_id
        AND id.identifier_type = 45
        AND id.voided = 0)
        LEFT JOIN
    etl.hiv_monthly_report_dataset_v1_2 dd ON (dd.person_id = fh.person_id)
    inner join etl.nupi_verification nv on nv.clientNumber=id.identifier
WHERE
         fh.location_id != 195 
        AND fh.next_clinical_datetime_hiv IS NULL
        AND fh.is_clinical_encounter = 1
        AND (TIMESTAMPDIFF(DAY, fh.rtc_date, CURDATE()) < 30)
        AND fh.cur_arv_meds IS NOT NULL
GROUP BY fh.person_id limit 10;`;
  }
}
