'use strict';
var moment = require('moment');
var amrsPersonService = require('../../service/openmrs-rest/person.service');
var amrsVisitService = require('../../service/openmrs-rest/visit.service');
import { LabSyncService } from './lab-sync-service';

var definition = {
  processLabSyncReqest: processLabSyncReqest,
  isBatchMode : isBatchMode,
  hasVisitStartedToday: hasVisitStartedToday,
  processPendingLabResultRequest:processPendingLabResultRequest
};

module.exports = definition;


function processLabSyncReqest(params) {
  return new Promise(function (resolve, reject) {
    const isTestPatient = determineIfTestPatient(params.patientUuId);
    if (!isTestPatient) {
      const isBatch = isBatchMode(params);
      if (isBatch === true) {
        resolve(true);
      } else {
        const hasTodaysVisit = hasVisitStartedToday(params.patientUuId);
        if (hasTodaysVisit) {
          resolve(true);
        } else {
          resolve(false);
        }
      }
    } else {
      reject('ERROR: is a TestPatient');
    }
  });
}


function isBatchMode(params) {
    if (params.mode) {
      const mode = params.mode;
      if (mode === 'batch') {
        return true;
      }
    } else {
       return false;
    }
}


function hasVisitStartedToday(patientUuId) {
    amrsVisitService.getPatientVisits(patientUuId)
      .then((visits) => {
        var hastodaysVisits = visits.some((visit) => {
          return (moment(visit.startDatetime).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD'));
        });
        return hastodaysVisits;
      })
      .catch((error) => {
          return error;
      });
}

function processPendingLabResultRequest(patientUuid){
  const labSyncService = new LabSyncService();
  return new Promise((resolve, reject) => {
    const isTestPatient = determineIfTestPatient(patientUuid);
    if (!isTestPatient) {
      labSyncService.getCachedPendingLabResults(patientUuid).then((cachedResults) => {
                  let cachedEidResult = [];
                  if(cachedResults.size > 0){
                      cachedEidResult = JSON.parse(cachedResults.result[0].pending_result);
                      resolve(cachedEidResult);
                  }else{
                      resolve(cachedEidResult);
                  }
              }).catch((error) => {
                  reject(error);
              });
          }else{
              reject('Is Test Patient')
    }
  });

}



function determineIfTestPatient(personUuid){
      var testPatientAttributeTypeUuid = '1e38f1ca-4257-4a03-ad5d-f4d972074e69';
      amrsPersonService.getPersonAttributes(personUuid)
         .then((result) => {
            const isTestPatient = result.some((attribute) => {
              return (attribute.attributeType.uuid === testPatientAttributeTypeUuid) && (attribute.value === true);
            });
            return isTestPatient;
         }).catch((error) => {
             reject(error);
         });

}
