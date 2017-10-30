import {
    HIVNotificationService
} from "./hiv-notifications.service";
import {
    EIDNotificationService
} from "./eid-notification.service";
const etlHelpers = require('../../etl-helpers.js');
const Promise = require("bluebird");
const _ = require('lodash');
export class NotificationsService {
    services = [];
    request = {};
    constructor(request) {
        this.request = request;
        this.registerServices();
    }

    getNotifications() {
        let self = this;
        return Promise.all(this.services.map(p => p.catch(e => e)))
            .then((results) => {
                let flatResults = results.reduce((a, b) => a.concat(b), []);
                return new Promise((resolve, reject) => {
                    let maxRetry = self.getMaxRetry(flatResults).retry;
                    resolve({
                        retry: maxRetry,
                        results: flatResults
                    });
                });
            });
    }

    registerServices() {
        let compineRequestParams = Object.assign(this.request.query, this.request.params);
        compineRequestParams.limit = 1;
        let reportParams = etlHelpers.getReportParams('clinical-reminder-report', ['referenceDate', 'patientUuid', 'indicators'],
            compineRequestParams);
        this.services.push(new HIVNotificationService().getHIVNotifications(reportParams));
        this.services.push(new EIDNotificationService().getEIDnotifications(this.request.params));
    }
    getMaxRetry(results) {
        let errors = _.filter(results, (a) => {
            if (a.error && a.retry) {
                return a;
            }
        });
        let maxObj = _.max(errors, (obj) => {
            return obj.retry;
        }) || {
            retry: null
        };
        return maxObj;
    }

};