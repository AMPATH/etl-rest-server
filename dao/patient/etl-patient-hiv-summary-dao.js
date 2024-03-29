'use strict';
var Promise = require('bluebird');
var db = require('../../etl-db');

var def = {
  getPatientHivSummary: getPatientHivSummary,
  getPatientLastEncounter: getPatientLastEncounter,
  getPatientLastVL: getPatientLastVL
};

module.exports = def;

function getPatientHivSummary(
  patientUuid,
  clinicalOnly,
  params,
  startIndex,
  limit
) {
  var whereClause = clinicalOnly
    ? ['uuid = ? AND is_clinical_encounter = true', patientUuid]
    : ['uuid = ?', patientUuid];
  var queryObject = {
    columns: '*',
    table: 'etl.flat_hiv_summary_v15b',
    where: whereClause,
    order: [
      {
        column: 'encounter_datetime',
        asc: false
      }
    ],
    offset: startIndex,
    limit: limit
  };

  return db.queryDb(queryObject);
}

function getPatientLastEncounter(patientUuid) {
  var whereClause = [
    'encounter_type IN (2,106) AND visit_type_id = 59 AND (e.voided in (0) OR e.voided IS NULL) AND p.uuid = ?',
    patientUuid
  ];
  var queryObject = {
    columns:
      'TIMESTAMPDIFF(MONTH, MAX(encounter_datetime), DATE(NOW())) as `months_from_last_visit`',
    table: 'amrs.encounter',
    alias: 'e',
    where: whereClause,
    leftOuterJoins: [
      ['amrs.person', 'p', 'p.person_id = e.patient_id'],
      ['amrs.visit', 'v', 'e.visit_id = v.visit_id']
    ],
    order: [
      {
        column: 'encounter_datetime',
        asc: false
      }
    ]
  };

  return db.queryDb(queryObject);
}
function getPatientLastVL(patientUuid) {
  var whereClause = ['uuid = ? and hiv_viral_load is not null ', patientUuid];

  var queryObject = {
    columns: 'MAX(test_datetime),hiv_viral_load',
    table: 'etl.flat_labs_and_imaging',
    where: whereClause,
    order: [
      {
        column: 'test_datetime',
        asc: false
      }
    ],
    limit: 1,
    group: ['person_id', 'test_datetime']
  };
  return db.queryDb(queryObject);
}
