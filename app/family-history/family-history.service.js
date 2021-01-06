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
  getPatientContacts = (params) => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      let sql =
        "select * from etl.flat_family_testing where patient_uuid = '" +
        params.patientUuid +
        "'";
      queryParts = {
        sql: sql
      };
      return db.queryServer(queryParts, function (result) {
        result.sql = sql;
        resolve(result);
      });
    });
  };

  updateContact = (params) => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      let sql =
        'update etl.flat_family_testing set is_registered = 1, fm_uuid = "' +
        params.uuid +
        '" where obs_group_id = ' +
        params.obs_group_id +
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
