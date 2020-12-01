var db = require('../../etl-db');

export class FamilyTestingService {
  getPatientList = (params) => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      let sql =
        "select * from etl.flat_family_testing where location_uuid = '" +
        params.locationUuid +
        "'";

      queryParts = {
        sql: sql,
        startIndex: params.startIndex,
        limit: params.limit
      };
      return db.queryServer(queryParts, function (result) {
        result.sql = sql;
        resolve(result);
      });
    });
  };
  getPatientFamilyHistory = (params) => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      let sql =
        'select * from etl.flat_family_testing where patient_id = ' +
        params.patientId +
        '';
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
