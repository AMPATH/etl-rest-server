const dao = require('../etl-dao');
const Promise = require("bluebird");
const _ = require('lodash');
import {
    MultiDatasetReport
} from '../app/reporting-framework/multi-dataset.report';
import {
    BaseMysqlReport
} from '../app/reporting-framework/base-mysql.report';
import { 
    PatientlistMysqlReport 
} from '../app/reporting-framework/patientlist-mysql.report';
export class CervicalCancerMonthlySummaryService {

    getAggregateReport(reportParams) {
        return new Promise(function (resolve, reject) {
            
            let report = new BaseMysqlReport('cervicalCancerMonthlySummaryAggregate', reportParams.requestParams);

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
    getPatientListReport(reportParams) {

        let indicators = reportParams.requestParams.indicators ? reportParams.requestParams.indicators.split(',') : [];
        reportParams.locations = reportParams.requestParams.locations;
        reportParams.limit = 300;
        reportParams.startIndex = 0;
        let report = new  PatientlistMysqlReport('cervicalCancerMonthlySummaryAggregate', reportParams);
        

        return new Promise(function (resolve, reject) {
            //TODO: Do some pre processing
            Promise.join(report.generatePatientListReport(indicators),
                (results) => {
                    resolve(results);
                }).catch((errors) => {
                    console.log('Error', errors);
                    reject(errors);
                });
        });

    }

}