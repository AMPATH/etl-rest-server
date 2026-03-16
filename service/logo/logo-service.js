const db = require('../../etl-db');
export class LogoService {
  constructor() {}
  async getLocationLogo(locationUuid) {
    if (!locationUuid) {
      return '/logo/ampath-logo-white.png';
    }
    const resp = await this.getCountyLogoByLocationUuid(locationUuid);
    if (!resp || resp.length === 0) {
      return '/logo/ampath-logo-white.png';
    }
    const data = resp[0];
    const { logo } = data;
    return logo;
  }
  async getCountyLogoByLocationUuid(locationUuid) {
    if (!locationUuid) {
      throw new Error('Missing Location params');
    }
    return new Promise((resolve, reject) => {
      const sql = `SELECT 
    l.name AS location,
    lat.name AS attribute_type_name,
    la.value_reference AS logo
FROM
    amrs.location l
        JOIN
    amrs.location_attribute la ON (l.location_id = la.location_id
        AND la.voided = 0)
        JOIN
    amrs.location_attribute_type lat ON (la.attribute_type_id = lat.location_attribute_type_id
        AND lat.uuid = 'cef1526a-1855-47a3-8c3a-0f32b2d84707')
WHERE
    l.uuid = '${locationUuid}'
        AND lat.retired = 0;`;
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
