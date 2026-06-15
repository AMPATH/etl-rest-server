const db = require('../../etl-db');

export class FacilityProvidersService {
  constructor() {}

  getFacilityActiveProvidersByLocationUuid(locationUuid, serviceUuid) {
    if (!locationUuid) {
      throw new Error('Location not defined');
    }
    return new Promise((resolve, reject) => {
      const sql = `SELECT 
    e.location_id,
    l.name AS location_name,
    CONCAT(pn.given_name,
            '  ',
            pn.middle_name,
            ' ',
            pn.family_name) AS provider_names,
    ep.provider_id,
    pa.value_reference AS national_id,
    ls.value_reference AS license_status,
    le.value_reference AS license_expiry_date,
    sp.value_reference AS speciality
FROM
    amrs.encounter e
        INNER JOIN
    amrs.location l ON e.location_id = l.location_id
        INNER JOIN
    amrs.encounter_provider ep ON e.encounter_id = ep.encounter_id
        INNER JOIN
    amrs.provider pr ON ep.provider_id = pr.provider_id
        INNER JOIN
    amrs.person_name pn ON (pn.person_id = pr.person_id)
        INNER JOIN
    amrs.provider_attribute pa ON (pa.provider_id = pr.provider_id
        AND pa.attribute_type_id = 5)
        LEFT JOIN
    amrs.provider_attribute ls ON (ls.provider_id = pr.provider_id
        AND ls.attribute_type_id = 7)
        LEFT JOIN
    amrs.provider_attribute le ON (le.provider_id = pr.provider_id
        AND le.attribute_type_id = 4)
        LEFT JOIN
    amrs.provider_attribute sp ON (sp.provider_id = pr.provider_id
        AND sp.attribute_type_id = 8)
WHERE
    e.encounter_datetime BETWEEN DATE_SUB(NOW(), INTERVAL 3 MONTH) AND NOW()
        AND e.voided = 0
        AND pn.voided = 0
        AND l.uuid = '${locationUuid}'
        AND pr.retired = 0
        AND (e.voided IS NULL OR e.voided = 0)
GROUP BY pr.provider_id;`;
      const queryParts = {
        sql: sql
      };
      db.queryServer(queryParts, function (result) {
        result.sql = sql;
        resolve(result.result);
      });
    });
  }
}
