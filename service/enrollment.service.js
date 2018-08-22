var Promise = require("bluebird");
var enrollmentDao = require('../dao/enrollment/enrollment-dao');
const _ = require('lodash');
import {
    BaseMysqlReport
} from '../app/reporting-framework/base-mysql.report';
import { 
    PatientlistMysqlReport 
} from '../app/reporting-framework/patientlist-mysql.report';

var def = {
    getActiveProgramEnrollmentSummary: getActiveProgramEnrollmentSummary,
    getActiveProgramEnrollmentsPatientList: getActiveProgramEnrollmentsPatientList,
    getPatientListReport: getPatientListReport,
    getAggregateReport: getAggregateReport
};

module.exports = def;


function getActiveProgramEnrollmentSummary(params){

    /*
     returns a list of all program-types with their id
     and uuid

    */

  return new Promise(function (resolve, reject) {

           enrollmentDao.getActiveProgramEnrollmentSummary(params).then(function (result) {
                     if(result){
                          var enrolled = result;
                          resolve(enrolled);
                     }else{
                         console.error('ERROR: GetActiveProgramEnrollments error');
                         reject('error');
                     }              
                 })
                .catch(function (error) {
                       console.error('Error: GetActiveProgramEnrollments result Error', error);
                       reject('error');
                });


      });




}

function getActiveProgramEnrollmentsPatientList(params){

    /*
     returns a list of all patients enrolled in a program
     and uuid

    */

  return new Promise(function (resolve, reject) {

           enrollmentDao.getActiveProgramEnrollmentsPatientList(params).then(function (result) {
                     if(result){
                          var enrolled = result;
                          resolve(enrolled);
                     }else{
                         console.error('ERROR: GetActiveProgramEnrollmentsPatientList error');
                         reject('error');
                     }              
                 })
                .catch(function (error) {
                       console.error('Error: GetActiveProgramEnrollmentsPatientList result Error', error);
                       reject('error');
                });


      });




}

function getAggregateReport(reportParams) {
    return new Promise(function (resolve, reject) {

            console.log('ReportParams', reportParams);

            let report = new BaseMysqlReport('patientProgramEnrollmentAggregate', reportParams.requestParams);

        Promise.join(report.generateReport(),
            (results) => {
                let result =results.results.results;
                results.size =result?result.length:0;
                results.result=result;                    
                delete results['results'];
                resolve(results);
                //TODO Do some post processing
            }).catch((errors) => {
                reject(errors);
            });
    });
}
function getPatientListReport(reportParams) {

    let indicators = [];
    
   
    let report = new  PatientlistMysqlReport('patientProgramEnrollmentAggregate', reportParams);
    

    return new Promise(function (resolve, reject) {
        //TODO: Do some pre processing
        Promise.join(report.generatePatientListReport(indicators),
            (results) => {
                resolve(results.results);
            }).catch((errors) => {
                console.log('Error', errors);
                reject(errors);
            });
    });

}







