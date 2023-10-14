var db = require('../etl-db');
const Promise = require('bluebird');

export class PatientVerificationReport {
  generateAggregates(params) {
    const that = this;
    return new Promise(function (resolve, reject) {
      const sql = that.aggregateQuery(params.locationUuid, params.curDate);
      const queryParts = {
        sql: sql
      };
      return db.queryServer(queryParts, function (result) {
        resolve(result);
      });
    });
  }

  generateUnverifiedClients(params) {
    const self = this;
    return new Promise(function (resolve, reject) {
      const queryParts = {
        sql: self.unverifiedQuery(params.locationUuid)
      };
      return db.queryServer(queryParts, function (result) {
        resolve(result);
      });
    });
  }

  aggregateQuery(location, curDate) {
    return `SELECT 
        SUM(verified) AS total_verified,
        SUM(unverified) AS total_unverified,
        SUM(on_art) AS total_on_art,
        SUM(verified_today) AS total_verified_today
    FROM
        (SELECT 
            hmsd.person_id,
                upi.identifier,
                hmsd.location_id,
                CASE
                    WHEN upi.patient_id IS NOT NULL THEN 1
                    ELSE 0
                END AS verified,
                CASE
                    WHEN upi.patient_id IS NULL THEN 1
                    ELSE 0
                END AS unverified,
                CASE
                    WHEN hmsd.person_id IS NOT NULL THEN 1
                    ELSE 0
                END AS on_art,
                CASE
                    WHEN DATE(upi.date_created) = DATE('${curDate}') THEN 1
                    ELSE 0
                END AS verified_today
        FROM
            etl.hiv_monthly_report_dataset_v1_2 hmsd
        LEFT JOIN amrs.patient_identifier upi ON (upi.patient_id = hmsd.person_id
            AND upi.identifier_type = 45
            AND upi.voided = 0)
        LEFT JOIN etl.moh_731_last_release_month m ON (hmsd.endDate = m.last_released_month)
        left join amrs.location l on (l.location_id = hmsd.location_id)
        WHERE
            (DATE(endDate) = DATE(m.last_released_month))
                AND l.uuid = '${location}'
                AND (hmsd.on_art_this_month = 1)
        GROUP BY hmsd.person_id) in_h;`;
  }

  unverifiedQuery(locationUuid) {
    return `SELECT 
        hmsd.gender AS gender,
        hmsd.birthdate AS birthdate,
        hmsd.age AS age,
        cc.identifier AS 'CCC',
        CONCAT(COALESCE(person_name.given_name, ''),
                ' ',
                COALESCE(person_name.middle_name, ''),
                ' ',
                COALESCE(person_name.family_name, '')) AS person_name,
        GROUP_CONCAT(DISTINCT id.identifier
            SEPARATOR ', ') AS identifiers,
        GROUP_CONCAT(DISTINCT contacts.value
            SEPARATOR ', ') AS phone_number,
        DATE_FORMAT(fh.rtc_date, '%d-%m-%Y') AS next_appointment_date,
        CONCAT(COALESCE(DATE_FORMAT(fh.encounter_datetime, '%Y-%m-%d'),''),' ',COALESCE(et.name, '')) as last_appoointment
    FROM
        etl.hiv_monthly_report_dataset_v1_2 hmsd
            INNER JOIN
        amrs.location l ON (l.location_id = hmsd.location_id)
            INNER JOIN
        amrs.person t1 ON (hmsd.person_id = t1.person_id)
            LEFT JOIN
        amrs.person_name person_name ON (t1.person_id = person_name.person_id
            AND (person_name.voided IS NULL
            || person_name.voided = 0)
            AND person_name.preferred = 1)
            LEFT JOIN
        amrs.patient_identifier id ON (t1.person_id = id.patient_id
            AND (id.voided IS NULL || id.voided = 0))
            LEFT JOIN
        amrs.person_attribute contacts ON (t1.person_id = contacts.person_id
            AND (contacts.voided IS NULL
            || contacts.voided = 0)
            AND contacts.person_attribute_type_id IN (10 , 48))
            LEFT JOIN
        etl.flat_hiv_summary_v15b fh ON (t1.person_id = fh.person_id
            AND fh.next_clinical_datetime_hiv IS NULL
            AND fh.is_clinical_encounter = 1)
            LEFT JOIN
        amrs.encounter_type et ON (fh.encounter_type = et.encounter_type_id)
            LEFT JOIN
        amrs.person_address pa ON (t1.person_id = pa.person_id)
            LEFT JOIN
        amrs.patient_identifier cc ON (fh.person_id = cc.patient_id
            AND cc.identifier_type = 28
            AND cc.voided = 0)
            LEFT JOIN
        amrs.patient_identifier upi ON (upi.patient_id = fh.person_id
            AND upi.identifier_type = 45
            AND upi.voided = 0)
            LEFT JOIN
        etl.moh_731_last_release_month m ON (hmsd.endDate = m.last_released_month)
    WHERE
        (DATE(endDate) = DATE(m.last_released_month))
             AND l.uuid = '${locationUuid}'
            AND (hmsd.on_art_this_month = 1)
            AND upi.patient_id is null
    GROUP BY hmsd.person_id;`;
  }
}
