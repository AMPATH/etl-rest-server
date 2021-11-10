'use strict';
var db = require('../etl-db');
const Promise = require('bluebird');

var serviceDefinition = {
  getPatientLatestEACSessionData: getPatientLatestEACSessionData,
  getPatientLatestEACSessionNo: getPatientLatestEACSessionNo,
  determinePatientLatestEACSessionNo: determinePatientLatestEACSessionNo
};

module.exports = serviceDefinition;

function getPatientLatestEACSessionData(patientUuid) {
  return new Promise((resolve, reject) => {
    let queryParts = {};
    const sql = `select 
    mdt.person_id,
    mdt.obs_datetime,
    mdt.concept_id,
    mdt.mdt_session_number
    from 
    (SELECT 
        o.person_id,
        o.obs_datetime,
        o.concept_id,
        case
          when o.concept_id = 10532 then  4
          when o.concept_id in (10527,10528,10529,10530,10531) then  3
          when o.concept_id in (10523,10524,10525,10526) then  2
          when o.concept_id in (10518,10519,10520,10521,10522) then  1
          else null
      end as mdt_session_number
    FROM
        amrs.obs o
        join amrs.person p on (p.person_id = o.person_id AND p.voided = 0)
    WHERE
        o.concept_id in (10527,10528,10529,10530,10531,10523,10524,10525,10526,10518,10519,10520,10521,10522,10532)
            AND p.uuid = "${patientUuid}"
            AND o.voided = 0
            ) mdt
            order by mdt.obs_datetime desc, mdt.mdt_session_number desc
            limit 1;`;
    queryParts = {
      sql: sql
    };
    return db.queryServer(queryParts, function (result) {
      result.sql = sql;
      resolve(result);
    });
  });
}

function getPatientsLatestVl(patientUuid) {
  return new Promise((resolve, reject) => {
    let queryParts = {};
    const sql = `SELECT 
    o.value_numeric as 'latest_vl',
    DATE_FORMAT(o.obs_datetime,'%Y-%m-%d') as 'latest_vl_date'
FROM
    amrs.obs o
        JOIN
    amrs.person p ON (p.person_id = o.person_id
        AND p.voided = 0)
WHERE
    o.concept_id = 856
        AND p.uuid = '${patientUuid}'
        AND o.voided = 0
        order by o.obs_datetime desc limit 1;`;

    console.log('sql', sql);

    queryParts = {
      sql: sql
    };
    return db.queryServer(queryParts, function (result) {
      result.sql = sql;
      resolve(result);
    });
  });
}

function determinePatientLatestEACSessionNo(sessionData, vl) {
  let eacSessionNo = 0;
  const mdtSessionNo = sessionData.mdt_session_number
    ? sessionData.mdt_session_number
    : null;
  if (mdtSessionNo === 4 && vl < 1000) {
    // if patient's last session was 4 and they are suppressed assign seesion 5
    eacSessionNo = 5;
  } else if (mdtSessionNo === 4 && vl > 1000) {
    // if patient's last session was 4 and they are not suppressed assign seesion 0 i.e start the sessions again
    eacSessionNo = 0;
  } else if (mdtSessionNo === null || mdtSessionNo === '') {
    eacSessionNo = 0;
  } else {
    eacSessionNo = mdtSessionNo;
  }

  return eacSessionNo;
}

async function getPatientLatestEACSessionNo(patientUuid) {
  let sessionData = [];
  let latestEacSessionNo = null;
  try {
    const eacSessionData = await getPatientLatestEACSessionData(patientUuid);
    const vlData = await getPatientsLatestVl(patientUuid);
    sessionData = eacSessionData.size > 0 ? eacSessionData.result[0] : [];
    const latestVlData = vlData.size > 0 ? vlData.result[0] : null;
    const latestVl = vlData.size > 0 ? latestVlData.latest_vl : null;
    latestEacSessionNo = determinePatientLatestEACSessionNo(
      sessionData,
      latestVl
    );

    const resultData = {
      patientUuid: patientUuid,
      eacSessionNo: latestEacSessionNo,
      data: sessionData,
      vlData: latestVlData
    };

    return new Promise.resolve(resultData);
  } catch (e) {
    return new Promise.reject(e);
  }
}
