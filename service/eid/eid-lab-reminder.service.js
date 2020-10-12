'use strict';
const _ = require('lodash');
let ObsService = require('../openmrs-rest/obs.service');
import { LabClient } from '../../app/lab-integration/utils/lab-client';
let  syncPreproc = require('../../app/lab-integration/lab-sync-pre-processor.service');
var config = require('../../conf/config');
import { BaseMysqlReport } from '../../app/reporting-framework/base-mysql.report';
var etlHelpers = require('../../etl-helpers.js');
var patientReminderService = require('../../service/patient-reminder.service');
import { LabSyncService } from '../../app/lab-integration/lab-sync-service';
let serviceDef = {
  pendingEIDReminders: pendingEIDReminders,
  generateRemindersReport: generateRemindersReport,
  getPatientReminders: getPatientReminders
};

module.exports = serviceDef;

function pendingEIDReminders(params, config) {

  const reflect = (promise) => {
    return promise.then(result => ({ success: true, result })).catch(error => ({ success: false, error }));
  };
  console.log('Config', config);
  return ObsService.getPatientIdentifiers(params.patientUuid).then((identifiers) => {
    let batch = [];
    console.log('identifiers', identifiers);
    if (config && identifiers) {
      Object.keys(config).forEach((labLocation) => {
        console.log('labLocation', labLocation);
        let labClient = new LabClient(config[labLocation]);
        let filterOptions = {
          patient_id: identifiers.identifiers.join()
        }
        batch.push(labClient.fetchPendingViralLoad(filterOptions))
      });
    }


    return Promise.all(batch.map(reflect)).then((results) => {
      return new Promise((resolve, reject) => {
      // merge results from all sites

      let mergedResults = [];
      for (let result of results) {
        mergedResults = mergedResults.concat(result.result.data)
      }
      const labSyncService = new LabSyncService();
      labSyncService.savePendingLabResults(JSON.stringify(mergedResults),params.patientUuid)
          .then((results)=> {
            resolve(mergedResults);
          }).catch((error)=> {
             reject(error);
          });
        
      });

    }).catch((err) => {
      return new Promise((resolve, reject) => {
        reject(err);
      });
    });

  }).catch((err) => {
    return new Promise((resolve, reject) => {
      reject(err);
    });
  });

}

function generateRemindersReport(combineRequestParams,eidReminders){
  return new Promise((resolve, reject) => {

  combineRequestParams.limitParam = 1;
  let reportParams = etlHelpers.getReportParams('clinical-reminder-report', ['referenceDate', 'patientUuid', 'offSetParam', 'limitParam'], combineRequestParams);

  let report = new BaseMysqlReport('clinicalReminderReport', reportParams.requestParams);
  report.generateReport().then((results) => {
      try {
          if (results.results.results.length > 0) {
              let processedResults = patientReminderService.generateReminders(results.results.results, eidReminders);
              results.result = processedResults;
          } else {
              results.result = {
                  person_uuid: combineRequestParams.person_uuid,
                  reminders: []
              };
          }
          resolve(results);
      } catch (error) {
          reject(error);
      }
  }).catch((error) => {
      reject(error);
  });

});
 
   
}

function getPatientReminders(params) {
  const labSyncService = new LabSyncService();
  return new Promise((resolve, reject) => {
    syncPreproc
      .processPendingLabResultRequest(params.patientUuid)
      .then((cachedResults) => {
        if (cachedResults.length > 0) {
          generateRemindersReport(
            params,
            cachedResults
          ).then((report) => {
              resolve(report);
            })
            .catch((error) => {
              reject(error);
            });
        } else {
          labSyncService
            .hasPendingVLOrder(params.patientUuid)
            .then((pendingVlResults) => {
              if (pendingVlResults.size > 0) {
                pendingEIDReminders(
                  params,
                  config.hivLabSystem
                ).then((eidReminders) => {
                    generateRemindersReport(
                      params,
                      eidReminders
                    ).then((result) => {
                        resolve(result);
                      })
                      .catch((error) => {
                        reject(error);
                      });
                  })
                  .catch((err) => {
                    reject(err);
                  });
              } else {
                generateRemindersReport(
                  params,
                  []
                ).then((result) => {
                    resolve(result);
                  })
                  .catch((error) => {
                    reject(error);
                  });
              }
            }).catch((error) => {
              reject(error);
            });
        }
      }).catch((error) => {
        reject(error);
      });
  });
}

