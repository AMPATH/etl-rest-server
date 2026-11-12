const db = require('../../etl-db');

export class MOH511Service {
  constructor() {}

  getMoh511Register(locationUuid, startDate, endDate) {
    if (!locationUuid) {
      throw new Error('Location not defined');
    }
    if (!startDate) {
      throw new Error('startDate not defined');
    }
    if (!endDate) {
      throw new Error('endDate not defined');
    }

    const locationUuids = (Array.isArray(locationUuid)
      ? locationUuid
      : String(locationUuid).split(',')
    )
      .map((uuid) => uuid.trim())
      .filter(Boolean);

    return new Promise((resolve, reject) => {
      const sql = `SELECT 
    a.encounter_datetime as date,
    pi.identifier as cr_number,
    null as cwc_number,
    a.birth_notification_number as birth_notification_number,
    CONCAT_WS(' ', COALESCE(pn.given_name, ''), COALESCE(pn.middle_name, ''), COALESCE(pn.family_name, '')) as full_names,
    a.age_in_years as age,
    p.gender as sex,
    pa.county_district as county_subcounty,
    pa.city_village as village_estate_landmark,
    attribute.value as phone_number,
    a.weight as weight_in_kgs,
    a.weight_category as weight_category,
    a.height as height,
    a.height_category as height_category,
    a.muac as muac,
    a.exclusive_breastfeeding_less_6_months as exclusive_breastfeeding_less_6_months,
    a.vitamin_a as vitamin_a_supplimentation,
    a.dewormed as dewormed,
    a.mnps_supplimentation as mnps_supplimentation,
    a.developmental_milestones as developmental_milestones_assessment,
    a.danger_signs as danger_signs,
    a.disability as disability,
    a.immunization_status_up_to_date as immunization_status_up_to_date,
    a.llin_given as llin_given,
    a.follow_up as follow_up_for,
    a.referred_from as referred_from,
    a.referred_to as referred_to,
    a.reason_for_referral as reason_for_referral,
    a.remarks as remarks
FROM
    etl.flat_moh_710 a
        INNER JOIN
    amrs.person p ON p.person_id = a.person_id AND p.voided = 0
        INNER JOIN
    amrs.location l ON l.location_id = a.location_id AND l.voided = 0
        LEFT JOIN
    amrs.patient_identifier pi ON pi.patient_id = a.person_id AND pi.identifier_type = 55 AND pi.voided = 0
        INNER JOIN
    amrs.person_name pn ON pn.person_id = a.person_id AND (pn.voided IS NULL || pn.voided = 0) AND pn.preferred = 1
        LEFT JOIN 
    amrs.person_address pa ON a.person_id = pa.person_id AND pa.voided = 0
        LEFT JOIN
    amrs.person_attribute attribute ON attribute.person_id = a.person_id AND attribute.person_attribute_type_id = 10
WHERE l.uuid IN (?)
  AND DATE(a.encounter_datetime) >= ?
  AND DATE(a.encounter_datetime) <= ?`;
      const queryParts = {
        sql: sql,
        values: [locationUuids, startDate, endDate]
      };
      db.queryServer(queryParts, function (result) {
        result.sql = sql;
        resolve(result.result);
      });
    });
  }
}
