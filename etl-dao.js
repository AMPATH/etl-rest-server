/*jshint -W003, -W097, -W117, -W026 */
'use strict';
var
  _ = require('underscore')
  , clinic = require('./dao/clinic/etl-clinic-dao')
  , analytics = require('./dao/analytics/etl-analytics-dao')
  , patient = require('./dao/patient/etl-patient-dao')
  , eid = require('./dao/eid/etl-eid-dao')
  , session = require('./dao/session/session')
  , labCohorts = require('./dao/lab-cohorts/lab-cohorts-dao');

module.exports.dao = function(App) {

  var dao ={};
    _.extend(dao, analytics.dao(App));
    _.extend(dao, clinic.dao(App));
    _.extend(dao, patient.dao(App));
    _.extend(dao, eid.dao(App));
    _.extend(dao, session.dao(App));
    _.extend(dao, labCohorts.dao(App));

  return dao;
};
