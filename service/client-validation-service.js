const db = require('../etl-db');
const Promise = require('bluebird');

export class ClientValidationIssues {
  generateVerificationClients(params) {
    const that = this;
    return new Promise(function (resolve, reject) {
      const sql = that.verificationClientsQuery(
        params.locationUuid,
        params.limit,
        params.offset
      );

      const queryParts = {
        sql: sql
      };
      return db.queryServer(queryParts, function (result) {
        resolve(result);
      });
    });
  }

  verificationClientsQuery(location, limit, offset) {
    return (
      `SELECT
    county,
    l.name AS 'health_facility',
    mfl_code,
    CONCAT(COALESCE(nv.clientNumber, ''),',',COALESCE(cc.identifier,'')) as 'identifiers',
    pa.value as status,
    fh.person_id,
    fh.uuid as patient_uuid,
    nv.errorDescription as "error_description",
    CONCAT(COALESCE(person_name.given_name, ''),
            ' ',
            COALESCE(person_name.middle_name, ''),
            ' ',
            COALESCE(person_name.family_name, '')) AS 'person_name',
    GROUP_CONCAT(DISTINCT contacts.value
        SEPARATOR ',') AS 'phone_number',
    DATE_FORMAT(pf.birthdate, '%Y-%m-%d') AS 'date_of_birth',  
    EXTRACT(YEAR FROM (FROM_DAYS(DATEDIFF(NOW(), pf.birthdate)))) AS age,
    pf.gender
    
FROM
    etl.flat_hiv_summary_v15b fh
        LEFT JOIN
    amrs.patient_identifier cc ON (fh.person_id = cc.patient_id
        AND cc.identifier_type = 28
        AND cc.voided = 0)
        LEFT JOIN
    amrs.person pf ON (fh.person_id = pf.person_id AND dead = 0
        AND pf.voided = 0)
        LEFT JOIN
    amrs.location l ON (l.location_id = fh.last_non_transit_location_id)
        LEFT JOIN
    ndwr.mfl_codes lx ON (l.location_id = lx.location_id)
        LEFT JOIN
    amrs.person_name person_name ON (fh.person_id = person_name.person_id
        AND (person_name.voided IS NULL
        || person_name.voided = 0)
        AND person_name.preferred = 1)
        LEFT JOIN
    amrs.person_attribute contacts ON (fh.person_id = contacts.person_id
        AND (contacts.voided IS NULL
        || contacts.voided = 0)
        AND contacts.person_attribute_type_id IN (10 , 48))
        LEFT JOIN
    amrs.patient_identifier id ON (id.patient_id = fh.person_id
        AND id.identifier_type = 45
        AND id.voided = 0)
        LEFT JOIN
    etl.hiv_monthly_report_dataset_v1_2 dd ON (dd.person_id = fh.person_id)
    LEFT JOIN
    amrs.person_attribute pa ON (pa.person_id = fh.person_id)
    inner join etl.nupi_verification nv on nv.clientNumber=id.identifier
WHERE
        fh.location_id != 195 
        AND pa.person_attribute_type_id = 74
        AND l.uuid = '${location}'
        AND fh.next_clinical_datetime_hiv IS NULL
        AND fh.is_clinical_encounter = 1
        AND (TIMESTAMPDIFF(DAY, fh.rtc_date, CURDATE()) < 30)
        AND fh.cur_arv_meds IS NOT NULL
GROUP BY fh.person_id limit ` +
      limit +
      ` offset ` +
      offset +
      `;`
    );
  }
}
