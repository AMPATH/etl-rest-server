var db = require('../../etl-db');
var rp = require('../../request-config');
var config = require('../../conf/config');

export class FamilyTestingService {
  getRestResource = (path) => {
    var protocol = config.openmrs.https ? 'https' : 'http';
    var link =
      protocol + '://' + config.openmrs.host + ':' + config.openmrs.port + path;
    return link;
  };

  getPatientList = (params) => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      let sql =
        "select *, count(*) as `contacts_count` from etl.flat_family_testing where location_uuid = '" +
        params.locationUuid +
        "' group by patient_id";

      queryParts = {
        sql: sql
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

  updateRegisteredContact = (params) => {
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

  saveContactTracing = (params) => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      let sql = '';

      if (params.query.trace_id != null) {
        sql =
          'update etl.contact_tracing set contact_id = ' +
          params.payload.contact_id +
          ',contact_date="' +
          params.payload.contact_date +
          '",contact_type=' +
          params.payload.contact_type +
          ',contact_status=' +
          params.payload.contact_status +
          ',reason_not_contacted=' +
          params.payload.reason_not_contacted +
          ',remarks="' +
          params.payload.remarks +
          '" where id = ' +
          params.query.trace_id +
          '';
      } else {
        sql =
          'insert into etl.contact_tracing (contact_id,contact_date,contact_type,contact_status,reason_not_contacted,remarks) values( ' +
          params.payload.contact_id +
          ',"' +
          params.payload.contact_date +
          '",' +
          params.payload.contact_type +
          ',' +
          params.payload.contact_status +
          ',' +
          params.payload.reason_not_contacted +
          ',"' +
          params.payload.remarks +
          '")';
      }
      queryParts = {
        sql: sql
      };
      return db.queryServer(queryParts, function (result) {
        result.sql = sql;
        resolve(result);
      });
    });
  };

  getContactTracingHistory = (params) => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      let sql = `select id, contact_id, contact_date, remarks,
        case 
          when contact_type = 1555 then @contact_type:='Phone tracing' 
          when contact_type = 10791 then @contact_type:='Physical tracing' 
        end as contact_type,
        case 
          when contact_status = 1065 then @contact_status:='Contacted and linked' 
          when contact_status = 1066 then @contact_status:='Contacted but not linked' 
          when contact_status = 1118 then @contact_status:='Not contacted'
        end as contact_status,
        case 
          when reason_not_contacted = 1550 then @reason_not_contacted:='No locator information' 
          when reason_not_contacted = 1561 then @reason_not_contacted:='Incorrect locator information' 
          when reason_not_contacted = 1562 then @reason_not_contacted:='Migrated'
          when reason_not_contacted = 1563 then @reason_not_contacted:='Not found at home' 
          when reason_not_contacted = 1560 then @reason_not_contacted:='Calls not going through' 
          when reason_not_contacted = 1593 then @reason_not_contacted:='Died'
          when reason_not_contacted = 5622 then @reason_not_contacted:='other'
        end as reason_not_contacted
        from etl.contact_tracing 
        where contact_id = ${params.contact_id}`;
      queryParts = {
        sql: sql
      };
      return db.queryServer(queryParts, function (result) {
        result.sql = sql;
        resolve(result);
      });
    });
  };

  getContactObsData = (params) => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      let sql =
        "select uuid from amrs.obs where obs_id = '" + params.contact_id + "'";
      queryParts = {
        sql: sql
      };
      return db.queryServer(queryParts, function (result) {
        result.sql = sql;
        resolve(result);
      });
    });
  };

  deleteContact = (params) => {
    let that = this;
    return this.getContactObsData(params).then((res) => {
      var uri = this.getRestResource(
        '/' +
          config.openmrs.applicationName +
          '/ws/rest/v1/obs/' +
          res.result[0].uuid
      );
      return new Promise(function (resolve, reject) {
        rp.deleteRequestPromise(uri)
          .then(function (result) {
            that.removeDeletedContacts(params).then((res) => {
              resolve(res);
            });
          })
          .catch(function (error) {
            reject(error);
          });
      });
    });
  };

  removeDeletedContacts = (params) => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      let sql =
        "delete from etl.flat_family_testing where obs_group_id = '" +
        params.contact_id +
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
}
