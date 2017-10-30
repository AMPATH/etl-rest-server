const Moment = require('moment');
const dao = require('../../etl-dao');
const Promise = require("bluebird");
const redis = require('../../redis');
export class HIVNotificationService {
    getHIVNotifications(reportParams) {
        let self = this;
        return redis.getAsync('hiv_cache').then(function (res) {
            if (!res) {
                return dao.runReport(reportParams).then((results) => {
                    return new Promise((resolve, reject) => {
                        try {
                            let processedResults = self.generateReminders(results.result);
                            redis.set('hiv_cache', JSON.stringify(processedResults), 'EX', 5 * 60);

                            resolve(processedResults);
                        } catch (err) {
                            reject(err)
                        }
                    });
                }).catch((err) => {
                    console.log(err);
                    return new Promise((resolve, reject) => {
                        reject({
                            error: 'Unable to get hiv clinical notifications',
                            retry: 120000
                        });
                    });
                });
            } else {
                return new Promise((resolve, reject) => {
                    resolve(JSON.parse(res));
                });
            }
        });

    }
    viralLoadReminders(data) {
        let reminders = [];

        let labMessage = 'Last viral load: none';
        if (data.last_vl_date) {
            labMessage = 'Last viral load: ' + data.viral_load + ' on ' +
                '(' + Moment(data.last_vl_date).format('DD-MM-YYYY') + ')' + ' ' +
                data.months_since_last_vl_date + ' months ago.';
        }

        switch (data.needs_vl_coded) {
            case 1:
                reminders.push({
                    name: 'needs_vl',
                    supersedes: [],
                    message: 'Patient requires viral load. Viral loads > 1000 ' +
                        'must be repeated in three months. ' + labMessage,
                    title: 'Viral Load Reminder',
                    type: 'danger',
                    display: {
                        banner: true,
                        toast: true,
                        log: true
                    }
                });
                break;
            case 2:
                reminders.push({
                    name: 'needs_vl',
                    supersedes: [],
                    message: 'Patient requires viral load. Patients newly on ART require ' +
                        'a viral load test every 6 months. ' + labMessage,
                    title: 'Viral Load Reminder',
                    type: 'danger',
                    display: {
                        banner: true,
                        toast: true,
                        log: true
                    }
                });
                break;
            case 3:
                reminders.push({
                    name: 'needs_vl',
                    supersedes: [],
                    message: 'Patient requires viral load. Patients on ART > 1 year require ' +
                        'a viral load test every year. ' + labMessage,
                    title: 'Viral Load Reminder',
                    type: 'danger',
                    display: {
                        banner: true,
                        toast: true,
                        log: true
                    }
                });
                break;
            default:
                console.info.call('No Clinical Reminder For Selected Patient' + data.needs_vl_coded);
        }
        return reminders;
    }

    inhReminders(data) {
        let reminders = [];
        if (data.is_on_inh_treatment && data.inh_treatment_days_remaining > 30 &&
            data.inh_treatment_days_remaining < 150) {
            reminders.push({
                name: 'inh_treatment_start',
                supersedes: [],
                message: 'Patient started INH treatment on (' +
                    Moment(data.tb_prophylaxis_start_date).format('DD-MM-YYYY') + ')' +
                    'Expected to end on (' +
                    Moment(data.tb_prophylaxis_end_date).format('DD-MM-YYYY') + ')' +
                    data.inh_treatment_days_remaining +
                    ' days remaining.',
                title: 'INH Treatment Reminder',
                type: 'danger',
                display: {
                    banner: true,
                    toast: true,
                    log: true
                }
            });
        }
        // INH Treatment Reminder - last month
        if (data.is_on_inh_treatment && data.inh_treatment_days_remaining <= 30 &&
            data.inh_treatment_days_remaining > 0) {
            reminders.push({
                name: 'inh_treatment_end',
                supersedes: ['inh_treatment_start'],
                message: 'Patient has been on INH treatment for the last 5 months, expected to end on (' +
                    Moment(data.tb_prophylaxis_end_date).format('MM-DD-YYYY') + ')',
                title: 'INH Treatment Reminder',
                type: 'danger',
                display: {
                    banner: true,
                    toast: true,
                    log: true
                }
            });
        }
        return reminders;
    }


    viralLoadErrors(data) {
        let reminders = [];
        if (data.ordered_vl_has_error === 1) {
            reminders.push({
                name: 'vl_error',
                supersedes: ['needs_vl', 'pending_lab_result'],
                message: 'Viral load test that was ordered on: (' +
                    Moment(data.vl_error_order_date).format('DD-MM-YYYY') + ') ' +
                    'resulted to an error. Please re-order.',
                title: 'Lab Error Reminder',
                type: 'danger',
                display: {
                    banner: true,
                    toast: true,
                    log: true
                }
            });
        }
        return reminders;
    }



    newViralLoadPresent(data) {
        let reminders = [];
        if (data.new_viral_load_present) {
            reminders.push({
                name: 'new_vl_result',
                supersedes: ['needs_vl', 'pending_lab_result', 'vl_error'],
                message: 'New viral load result: ' + data.viral_load + ' (collected on ' +
                    Moment(data.last_vl_date).format('DD-MM-YYYY') + ').',
                title: 'New Viral Load present',
                type: 'success',
                display: {
                    banner: true,
                    toast: true,
                    log: true
                }
            });
        }
        return reminders;
    }
    pendingViralOrder(data) {
        let reminders = [];
        if (data.overdue_vl_lab_order > 0) {
            reminders.push({
                name: 'overdue_vl_result',
                supersedes: [],
                message: 'No result reported for patient\'s viral load test drawn on (' +
                    Moment(data.vl_order_date).format('DD-MM-YYYY') + ') days ago' +
                    ' Please follow up with lab or redraw new specimen.',
                title: 'Overdue Viral Load Order',
                type: 'danger',
                display: {
                    banner: true,
                    toast: true,
                    log: true
                }
            });
        }
        return reminders;
    }

    generateReminders(etlResults) {
        let reminders = [];
        let data = etlResults[0];
        let new_vl = this.newViralLoadPresent(data);
        let vl_Errors = this.viralLoadErrors(data);
        let pending_vl_orders = this.pendingViralOrder(data);
        let inh_reminders = this.inhReminders(data);
        let vl_reminders = this.viralLoadReminders(data);

        return [].concat(new_vl, vl_Errors, pending_vl_orders, inh_reminders, vl_reminders);
    }

};