var db = require('../../etl-db');

export class ContactTracingService {
  constructor() {}

  saveContactTracing = (params) => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      let sql =
        'insert into etl.contact_tracing (obs_group_id,contact_date,contact_type,contact_status) values( ' +
        params.obs_group_id +
        ',' +
        params.contact_date +
        ',' +
        params.contact_type +
        ',' +
        params.contact_status;
      (')');
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
