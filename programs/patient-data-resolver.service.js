const Promise = require('bluebird');

const patientService = require('../service/openmrs-rest/patient.service.js');
const programService = require('../service/openmrs-rest/program.service');
const etlHivSummary = require('../dao/patient/etl-patient-hiv-summary-dao');
const encounterService = require('../service/openmrs-rest/encounter');
const dcPatientvisitEvaluator = require('../service/dc-patient-visit-evaluator');
const covidAssessmentService = require('../service/covid-assessment-service');
const weeklyPredictionsService = require('../service/ml-weekly-predictions.service');
var _ = require('underscore');
const {
  default: MlWeeklyPredictionsService
} = require('../service/ml-weekly-predictions.service');

const availableKeys = {
  patient: getPatient,
  dummyPatient: getPatient,
  enrollment: getProgramEnrollment,
  hivLastTenClinicalEncounters: gethivLastTenClinicalEncounters,
  hivLastEncounter: getPatientLastEncounter,
  patientEnrollment: getPatientEnrollement,
  patientEncounters: getPatientEncounters,
  isPatientTransferredOut: checkTransferOut,
  dcQualifedVisits: getQualifiedDcVisits,
  validateMedicationRefill: getMedicationRefillVisits,
  latestCovidAssessment: getLatestCovidAssessment,
  isViremicHighVL: getLatestVL,
  weeklyPredictedPatients: getWeeklyPredictedPatients
};

const def = {
  getPatient: getPatient,
  getProgramEnrollment: getProgramEnrollment,
  gethivLastTenClinicalEncounters: gethivLastTenClinicalEncounters,
  getAllDataDependencies: getAllDataDependencies,
  availableKeys: availableKeys,
  getPatientLastEncounter: getPatientLastEncounter,
  getPatientEncounters: getPatientEncounters,
  checkTransferOut: checkTransferOut,
  dcQualifedVisits: getQualifiedDcVisits,
  validateMedicationRefill: getMedicationRefillVisits,
  getLatestCovidAssessment: getLatestCovidAssessment,
  isViremicHighVL: getLatestVL,
  getWeeklyPredictedPatients: getWeeklyPredictedPatients
};

module.exports = def;

function getAllDataDependencies(dataDependenciesKeys, patientUuid, params) {
  return new Promise((success, error) => {
    const dataObject = {};
    Promise.reduce(
      dataDependenciesKeys,
      function (previous, key) {
        return availableKeys[key](patientUuid, params)
          .then(function (data) {
            dataObject[key] = data;
          })
          .catch(function (err) {
            dataObject[key] = {
              error: 'An error occured',
              detail: err
            };
          });
      },
      0
    )
      .then(function (data) {
        success(dataObject);
      })
      .catch(function (err) {
        error(err);
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

function checkTransferOut(patientUuid, params) {
  return new Promise((resolve, reject) => {
    getPatientEncounters(patientUuid)
      .then((encounters) => {
        if (
          _.last(encounters).encounterType.uuid ===
          'cbe2d31d-2201-44ce-b52e-fbd5dc7cff33'
        ) {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function getMedicationRefillVisits(patientUuid) {
  const expectedEncounters = [
    '8d5b2be0-c2cc-11de-8d13-0010c6dffd0f',
    '4e7553b4-373d-452f-bc89-3f4ad9a01ce7'
  ];

  const patientEncounters = encounterService.getPatientEncounters({
    patientUuid,
    v:
      'custom:(encounterDatetime,encounterType:(uuid,display),obs:(uuid,obsDatetime,concept:(uuid,name:(uuid,name)),value:(uuid,display)))'
  });

  return new Promise((resolve, reject) => {
    patientEncounters
      .then((encounters) => {
        const medicationRefillEncounters = encounters
          .filter(
            (encounter) =>
              encounter.encounterType &&
              expectedEncounters.includes(encounter.encounterType.uuid)
          )
          .sort(
            (a, b) =>
              new Date(b.encounterDatetime).getTime() -
              new Date(a.encounterDatetime).getTime()
          );

        resolve(medicationRefillEncounters[0] || null);
      })
      .catch((e) => {
        console.error('An error occurred fetching encounters: ', e);
        reject(e);
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
        console.error('An error occurred fetching encounters: ', e);
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

function getPatientEnrollement(patientUuid, params) {
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

function getQualifiedDcVisits(patientUuid) {
  return new Promise((resolve, reject) => {
    dcPatientvisitEvaluator
      .getPatientQualifiedDcVisits(patientUuid)
      .then((result) => {
        resolve(result.result[0]);
      });
  });
}

function getLatestCovidAssessment(patientUuid) {
  return new Promise((resolve, reject) => {
    covidAssessmentService
      .getPatientLatestCovidAssessmentDate(patientUuid)
      .then((result) => {
        if (result.size > 0) {
          const screeningDate = result.result[0].latest_covid_assessment_date;
          resolve(screeningDate);
        } else {
          resolve('');
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function getLatestVL(patientUuid) {
  return new Promise((resolve, reject) => {
    etlHivSummary
      .getPatientLastVL(patientUuid)
      .then((result) => {
        if (result.size > 0) {
          const isViremic =
            result.result[0].hiv_viral_load > 200 ? true : false;
          resolve(isViremic);
        } else {
          resolve(false);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}
