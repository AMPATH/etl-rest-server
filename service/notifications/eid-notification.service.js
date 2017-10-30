const EIDLabReminderService = require('../eid/eid-lab-reminder.service');
const config = require('../../conf/config');
const redis = require('../../redis');
const Moment = require('moment');
import * as _ from 'lodash';

export class EIDNotificationService {
    getEIDnotifications(params) {
        let self = this;
       return redis.getAsync('eid_cache').then(function (res) {
            if (!res) {
                return EIDLabReminderService.pendingEIDReminders(params, config.eid).then(
                    (results) => {
                        // console.log('EID reminders',results);
                        let processedResults = self.pendingViralLoadLabResult(results);
                        console.log('Processed reminders',processedResults);

                        redis.set('eid_cache', JSON.stringify(processedResults), 'EX', 5 * 60);
                        return new Promise((resolve, reject) => {
                            resolve(processedResults);
                        }).catch((err) => {
                            return new Promise((resolve, reject) => {
                                reject({
                                    error: 'Unable to fetch eid data',
                                    retry: 120000
                                });
                            });
                        });
                    }
                )
            } else {
                return new Promise((resolve, reject) => {
                    resolve(JSON.parse(res));
                });
            }
        });

    }
    pendingViralLoadLabResult(eidResults) {
        let reminders = [];
        let data = _.last(eidResults.viralLoad);
        if (data) {
            let dateSplit = data.DateCollected.split('-');
            let dateCollected = Moment([dateSplit[2],
                parseInt(Moment().month(dateSplit[1]).format('M'), 10) - 1, dateSplit[0]
            ]);
            reminders.push({
                name: 'pending_lab_result',
                supersedes: ['needs_vl'],
                message: 'Patient lab Order No.' + data.OrderNo + ' is currently being processed. Sample' +
                    ' collected on ' + dateCollected.format('DD-MM-YYYY') + ').',
                title: 'Pending Lab Order Result',
                type: 'info',
                display: {
                    banner: true,
                    toast: true,
                    log: true
                }
            });
        }
        return reminders;
    }

};