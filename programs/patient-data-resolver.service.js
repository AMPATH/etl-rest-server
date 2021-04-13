const Promise = require('bluebird');

const patientService = require('../service/openmrs-rest/patient.service.js');
const programService = require('../service/openmrs-rest/program.service');
const etlHivSummary = require('../dao/patient/etl-patient-hiv-summary-dao');
const encounterService = require('../service/openmrs-rest/encounter');

const availableKeys = {
  patient: getPatient,
  dummyPatient: getPatient,
  enrollment: getProgramEnrollment,
  hivLastTenClinicalEncounters: gethivLastTenClinicalEncounters,
  hivLastEncounter: getPatientLastEncounter,
  patientEnrollment: getPatientEnrollment,
  patientEncounters: getPatientEncounters
};

const def = {
  getPatient: getPatient,
  getProgramEnrollment: getProgramEnrollment,
  gethivLastTenClinicalEncounters: gethivLastTenClinicalEncounters,
  getAllDataDependencies: getAllDataDependencies,
  availableKeys: availableKeys,
  getPatientLastEncounter: getPatientLastEncounter,
  getPatientEncounters: getPatientEncounters
};

module.exports = def;

function getAllDataDependencies(dataDependenciesKeys, patientUuid, params) {
  return new Promise((resolve, reject) => {
    const dataObject = {};
    Promise.reduce(
      dataDependenciesKeys,
      (previous, key) => {
        return availableKeys[key](patientUuid, params)
          .then((data) => {
            dataObject[key] = data;
          })
          .catch((err) => {
            dataObject[key] = {
              error: 'An error occured',
              detail: err
            };
          });
      },
      0
    )
      .then((data) => {
        resolve(dataObject);
      })
      .catch((err) => {
        console.log('err: ', err);
        reject(err);
      });
  });
}

function getPatient(patientUuid, params) {
  return new Promise((resolve, reject) => {
    patientService
      .getPatientByUuid(patientUuid, { rep: 'full' })
      .then((patient) => {
        resolve(patient);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function getProgramEnrollment(patientUuid, params) {
  return new Promise((resolve, reject) => {
    programService
      .getProgramEnrollmentByUuid(params.programEnrollmentUuid, {
        rep:
          'custom:(uuid,display,voided,dateEnrolled,dateCompleted,location,' +
          'program:(uuid),states:(uuid,startDate,endDate,state:(uuid,initial,terminal,' +
          'concept:(uuid,display))))'
      })
      .then((enrollment) => {
        resolve(enrollment);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function getPatientEncounters(patientUuid) {
  const patientEncounters = encounterService.getPatientEncounters({
    patientUuid,
    v: 'custom:(encounterDatetime,encounterType:(uuid,display))'
  });

  return new Promise((resolve, reject) => {
    patientEncounters
      .then((encounters) => {
        resolve(encounters);
      })
      .catch((e) => {
        reject(e);
      });
  });
}

function gethivLastTenClinicalEncounters(patientUuid, params) {
  return new Promise((resolve, reject) => {
    etlHivSummary
      .getPatientHivSummary(patientUuid, true, {}, 0, 10)
      .then((response) => {
        resolve(response.result);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function getPatientLastEncounter(patientUuid) {
  return new Promise((resolve, reject) => {
    etlHivSummary
      .getPatientLastEncounter(patientUuid)
      .then((response) => {
        resolve(response.result[0]);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function getPatientEnrollment(patientUuid, params) {
  return new Promise((resolve, reject) => {
    programService
      .getProgramEnrollmentByPatientUuid(patientUuid, params)
      .then((response) => {
        resolve(response.results);
      })
      .catch((error) => {
        reject(error);
      });
  });
}
