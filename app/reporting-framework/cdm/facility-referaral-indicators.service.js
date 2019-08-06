import {
    BaseMysqlReport
} from '../base-mysql.report';
import {
    PatientlistMysqlReport
} from '../patientlist-mysql.report';
import {
    IndicatorDefinitionService
} from './indicator-definition.service';

const dao = require('../../../etl-dao');
const Promise = require("bluebird");
const Moment = require('moment');
const _ = require('lodash');
export class ReferalIndicatorsService {

    composite_indicators ={
    }

    getAggregateReport(reportParams) {
        let self = this;
        reportParams.groupBy = 'groupByLocation';
        reportParams.countBy = 'num_persons';
        let params = reportParams.requestParams;

        if (params.indicators) {
            let indicators = params.indicators.split(',');
            let columnWhitelist = indicators.concat(['location_id','location_uuid', 'month', 'location', 'encounter_datetime', 'person_id']);

            columnWhitelist = this.addDerivateIndicatorsForPercIndicators(columnWhitelist);
            params.columnWhitelist = columnWhitelist;
        }
        let report = new BaseMysqlReport('facilityReferralReportAggregate', params)
        return new Promise(function (resolve, reject) {
            Promise.join(report.generateReport(),
                (result) => {
                    let indicatorDefinitionService = new IndicatorDefinitionService();
                    let returnedResult = {};
                    try {
                        returnedResult.indicatorDefinitions = indicatorDefinitionService.getDefinitions(params.indicators)
                    } catch (error) {
                        console.log(error);
                    }

                    returnedResult.schemas = result.schemas;
                    returnedResult.sqlQuery = result.sqlQuery;
                    returnedResult.result = result.results.results;
                    resolve(returnedResult);
                    //TODO Do some post processing
                }).catch((errors) => {
                reject(errors);
            });
        });
    }
    getPatientListReport(reportParams) {
        console.log('Params',reportParams);
        let self = this;
        let gender = reportParams.gender.split(',');
        let locations = reportParams.locationUuids.split(',');
        reportParams.locationUuids = locations;
        reportParams.gender = gender;
        reportParams.limitParam = reportParams.limit;
        reportParams.offSetParam = reportParams.startIndex;
        let report = new PatientlistMysqlReport('facilityReferralReportAggregate', reportParams)
        return new Promise(function (resolve, reject) {
            //TODO: Do some pre processing
            Promise.join(report.generatePatientListReport(reportParams.indicator.split(',')),
                (result) => {
                    let returnedResult = {};
                    returnedResult.schemas = result.schemas;
                    returnedResult.sqlQuery = result.sqlQuery;
                    returnedResult.result = result.results.results;
                    resolve(returnedResult);
                }).catch((errors) => {
                reject(errors);
            });
        });
    }

    addDerivateIndicatorsForPercIndicators(indicatorsArray) {
        let additionalIndicators = [];
        for(var i = 0; i < indicatorsArray.length; i++) {
            let indicator = indicatorsArray[i];

            if(this.composite_indicators[indicator]) {
                additionalIndicators = additionalIndicators.concat(this.composite_indicators[indicator].childIndictors);
            }
        }
        return indicatorsArray.concat(additionalIndicators);
    }
}
