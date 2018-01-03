const etlHelpers = require('../etl-helpers.js');
const dao = require('../etl-dao');
const Promise = require('bluebird');
const Moment = require('moment');
const _ = require('lodash');
import {
    ResolveUuidsService
} from '../dao/resolve-uuids.service'
export class ClinicScheduleService {
    getDailyVisits(request) {
        return this.resolveUuids(request).then((params) => {
            params.groupBy = 'groupByPerson';
            let reportParams = etlHelpers.getReportParams('hiv-daily-attendance', ['startDate', 'locations',
                'program_type_ids', 'encounter_types', 'visit_type_ids', 'groupBy'
            ], params);
            return dao.runReport(reportParams);
        });
    }
    getDailyAppointments(request) {
        return this.resolveUuids(request).then((params) => {
            params.groupBy = 'groupByPerson';
            let reportParams = etlHelpers.getReportParams('hiv-daily-appointments', ['startDate', 'locations',
                'program_type_ids', 'encounter_types', 'visit_type_ids', 'groupBy'
            ], params);
            return dao.runReport(reportParams);
        });
    }

    getDailyHasNotReturned(request) {
        return this.resolveUuids(request).then((params) => {
            params.groupBy = 'groupByPerson';
            let reportParams = etlHelpers.getReportParams('hiv-daily-has-not-returned', ['startDate', 'locations',
                'program_type_ids', 'encounter_types', 'visit_type_ids', 'groupBy'
            ], params);
            return dao.runReport(reportParams);
        });
    }

    getMonthlySchedule(request) {
        return this.resolveUuids(request).then((params) => {
            let reportParams = etlHelpers.getReportParams('name', ['startDate', 'endDate',
                'encounter_types', 'locations', 'program_type_ids', 'visit_type_ids'
            ], params);
            return this.getData(reportParams);
        });
    }

    resolveUuids(request) {
        let compineRequestParams = Object.assign({}, request.query, request.params);
        let resolveUuidsService = new ResolveUuidsService();
        return Promise.join(
            resolveUuidsService.resolveLocations(compineRequestParams.locationUuids),
            resolveUuidsService.resolvePrograms(compineRequestParams.programUuids),
            resolveUuidsService.resolveEncounterTypes(compineRequestParams.encounterTypeUuids),
            resolveUuidsService.resolveVisitTypes(compineRequestParams.visitTypeUuids),
            (locationIds, programIds, encounterTypeIds, visitTypeIds) => {
                let params = Object.assign({}, compineRequestParams);
                params.locations = locationIds;
                params.program_type_ids = programIds;
                params.visit_type_ids = visitTypeIds;
                params.encounter_types = encounterTypeIds;
                return new Promise((resolve, reject) => {
                    resolve(params);
                });
            });
    }

    getData(reportParams) {
        let self = this;
        return new Promise(function (resolve, reject) {
            Promise.join(self.getAttended(reportParams), self.getScheduled(reportParams), self.getHasNotReturned(reportParams),
                (attended, scheduled, hasNotReturned) => {
                    let attendedResponse = self.buildAttendedResponse(attended);
                    let scheduledResponse = self.buildScheduledResponse(scheduled);
                    let hasNotReturnedResponse = self.buildHasnoReturnedResponse(hasNotReturned);
                    let combinedResponse = attendedResponse.concat(scheduledResponse).concat(hasNotReturnedResponse);
                    let grouped = _.groupBy(combinedResponse, (row) => {
                        return row.date;
                    });
                    let results = _.chain(combinedResponse).groupBy("date").map(function (v, i) {
                        return {
                            date: i,
                            count: _.map(v, 'count').reduce(function (acc, x) {
                                for (let key in x) acc[key] = x[key];
                                return acc;
                            }, {})
                        }
                    }).value();
                    resolve({
                        results: results
                    });
                }).catch((errors) => {
                reject(errors);
            });
        });
    }

    getAttended(reportParams) {
        reportParams['reportName'] = 'program-attended';
        return dao.runReport(reportParams);
    }

    getScheduled(reportParams) {
        reportParams['reportName'] = 'program-scheduled';
        return dao.runReport(reportParams);
    }

    getHasNotReturned(reportParams) {
        reportParams['reportName'] = 'program-has-not-returned-report';
        return dao.runReport(reportParams);
    }

    buildAttendedResponse(payload) {
        let data = payload.result.map(function (row) {
            let utc = Moment.utc(row.attended_date).utcOffset(+3).toDate();
            return {
                count: {
                    attended: row.attended,
                },
                date: Moment(utc).local().format('YYYY-MM-DD')
            }
        });
        return data;
    }

    buildScheduledResponse(payload) {
        let data = payload.result.map(function (row) {
            return {
                count: {
                    scheduled: row.scheduled
                },
                date: row.scheduled_date
            }
        });
        return data;
    }

    buildHasnoReturnedResponse(payload) {
        let data = payload.result.map(function (row) {
            return {
                count: {
                    has_not_returned: row.p_has_not_returned
                },
                date: row.d
            }
        });
        return data;
    }

};