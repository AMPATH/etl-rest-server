var
    db = require('../etl-db'),
    fs = require('fs'),
    util = require('util'),
    stream = require('stream'),
    es = require('event-stream'),
    config = require('../conf/config'),
    Promise = require('bluebird'),
    eidService = require('../service/eid.service.js'),
    _ = require('underscore'),
    format = require('date-format'),
    moment = require('moment');
var nodemailer = require('nodemailer'); // npm install nodemailer

var log_file = 'lab-sync-scheduling.log';
var error_file = 'lab-sync-scheduling-error.log';

var service = {
    errorQueue: [],
    scheduledSuccessfully: [],
    retryInterval: 20 * 60 * 1000, // Retry every 20 minutes incase of an error
    maxTrialCount: 3, // maxinum number of attempts to schedule syncing incase of an error during 1st trial
    currentTrialCount: 0,
    schedulingInProgress: false,
    start: function () {
        console.info('scheduling process started');
        setInterval(function () {
            if (!service.schedulingInProgress)
                service.scheduleEidSync();
        }, service.retryInterval);
        service.scheduleEidSync();
    },
    scheduleEidSync: function () {
        console.log('Attempting to schedule ...', service.currentTrialCount);
        if (service.currentTrialCount === 0) {
            // first trial.
            // check for date arguments.
            var startDate = this.getProcessArg('--start-date');
            var endDate = this.getProcessArg('--end-date');

            if (!startDate) {
                // No dates were passed in as arguments, therefore schedule for today
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 1);
                startDate = format('yyyy-MM-dd', startDate);

                endDate = new Date();
                endDate = format('yyyy-MM-dd', endDate);
            }
            service.attemptToScheduleEidSync(startDate, endDate);
            service.currentTrialCount++;
            return;
        }



        if (service.currentTrialCount >= service.maxTrialCount) {
            // bailing out
            console.error('Bailing out...Reached maximum number of trials:', service.maxTrialCount);

            console.log('*********************************');
            console.log('Scheduled:');
            console.log('*********************************');
            console.log(service.scheduledSuccessfully);
            service.logSuccessfulScheduling(service.scheduledSuccessfully);

            console.log('*********************************');
            console.log('Could not schedule for:');
            console.log('*********************************');

            _.each(service.errorQueue, function (errorItem) {
                delete errorItem.apiKey;
            });

            console.log(service.errorQueue);
            service.logErrorWhenScheduling(service.errorQueue);

            if (config && config.emailNotification && config.emailNotification.sourceAddress) {
                console.log('*********************************');
                console.log('Sending email notification to maintainers..');
                service.sendMail('There was an error sheduling the eid-amrs sync:  ' +
                        JSON.stringify(service.errorQueue, null, 4), 'EID-AMRS sync error', 'ampath-developers@ampath.or.ke')
                    .then(function (info) {
                        console.log('*********************************');
                        console.log('Exiting scheduler with status 1...');
                        process.exit(1);
                    })
                    .catch(function (error) {
                        console.log('Error sending email notification');
                        console.log('*********************************');
                        console.log('Exiting scheduler with status 1...')
                        process.exit(1);
                    });
            } else {
                console.log('*********************************');
                console.log('Exiting scheduler with status 1...')
                process.exit(1);
            }

            return;
        }

        // check if there are items in the queue and retry to schedule them
        if (service.errorQueue.length > 0) {
            service.attemptToScheduleEidSync();
        } else {
            process.exit(0);
            return;
        }

        service.currentTrialCount++;
    },
    attemptToScheduleEidSync: function (startDate, endDate) {
        if (service.errorQueue.length === 0) {
            service.initializeQueue(startDate, endDate);

            // also pick items from previously saved error queue
        }
        // console.log('queue', service.errorQueue);

        service.scheduleQueue()
            .then(function (result) {
                if (service.errorQueue.length === 0) {
                    console.info('*********************************');
                    console.info('Scheduling completed successfully');
                    console.info('*********************************');
                    console.info(service.scheduledSuccessfully);
                    service.logSuccessfulScheduling(service.scheduledSuccessfully);

                    // attempt for pending vl orders
                    // Attempt to schedule patients with pending vl orders
                    var startDateVlPending = format('yyyy-MM-dd', moment(new Date()).subtract(3, 'months').toDate());
                    service.schedulePatientsWithPendingOrders(startDateVlPending)
                        .then(function (results) {
                            console.log('Scheduled patients with pending vl orders successfully');
                            service.logSuccessfulScheduling('Scheduled patients with pending vl  successfully', startDateVlPending);
                            // console.info('*********************************');
                            // console.log('Exiting scheduler...');
                            // process.exit(0);
                            service.schedulePatientsWithMissingVlPastOneYear()
                                .then(function (res) {
                                    console.log('Scheduled patients with missing vl successfully');
                                    service.logSuccessfulScheduling('Scheduled patients with missing vl', startDateVlPending);
                                    // console.info('*********************************');
                                    // console.log('Exiting scheduler...');
                                    // process.exit(0);
                                    service.rescheduleEidSyncErrors()
                                        .then(function (res2) {
                                            console.log('Scheduled patients in error queue successfully');
                                            service.logSuccessfulScheduling('Scheduled patients in error queue successfully');
                                            console.info('*********************************');
                                            console.log('Exiting scheduler...');
                                            process.exit(0);
                                        })
                                        .catch(function (err) {
                                            console.error('Error rescheduling patients in error queue', err);
                                            service.logErrorWhenScheduling('Error rescheduling patients in error queue ', err);
                                            service.sendMail('Error rescheduling patients in error queue' + err,
                                                'Error Scheduling EID-AMRS Sync For patients in error queue', 'ampath-developers@ampath.or.ke');

                                            console.info('*********************************');
                                            console.log('Exiting scheduler...');
                                            process.exit(1);
                                        });
                                })
                                .catch(function (err) {
                                    console.error('Error scheduling patients with missing vl', error);
                                    service.logErrorWhenScheduling('Error scheduling patients with missing VL for date ' + startDateVlPending, error);
                                    service.sendMail('Error scheduling patients with missing vl' + error,
                                        'Error Scheduling EID-AMRS Sync For patients with missing VL', 'ampath-developers@ampath.or.ke');

                                    console.info('*********************************');
                                    console.log('Exiting scheduler...');
                                    process.exit(1);
                                });
                        })
                        .catch(function (error) {
                            console.error('Error scheduling patients with pending vl orders', error);
                            service.logErrorWhenScheduling('Error scheduling patients with pending VL order for date ' + startDateVlPending, error);
                            service.sendMail('Error scheduling patients with pending vl orders' + error,
                                'Error Scheduling EID-AMRS Sync For patients with pending VL', 'ampath-developers@ampath.or.ke');

                            console.info('*********************************');
                            console.log('Exiting scheduler...');
                            process.exit(1);
                        });

                } else {
                    console.log('An error occured while scheduling for some labs. Attempting again..');
                }
            })
            .catch(function (error) {
                service.logErrorWhenScheduling(error);
                console.log('An expected error happened while scheduling...');
            });

    },
    scheduleQueue: function () {
        service.schedulingInProgress = true;
        return new Promise(function (resolve, reject) {
            var newQueue = [];
            Promise.reduce(service.errorQueue, function (before, currentRow) {
                    return new Promise(function (resolve, reject) {
                        service.scheduleEidSyncPerServerPerType(currentRow)
                            .then(function (result) {
                                service.scheduledSuccessfully.push({
                                    type: currentRow.type,
                                    host: currentRow.host,
                                    patientsScheduledForSync: result.patientIdentifiers,
                                    startDate: currentRow.startDate,
                                    endDate: currentRow.endDate
                                });
                                resolve(result);
                            })
                            .catch(function (error) {
                                currentRow.error = error;
                                newQueue.push(currentRow);
                                resolve(currentRow);
                            });
                    });
                }, 0)
                .then(function (result) {
                    service.errorQueue = newQueue;
                    service.schedulingInProgress = false;
                    resolve(service.scheduledSuccessfully);
                })
                .catch(function (error) {
                    service.errorQueue = newQueue;
                    service.schedulingInProgress = false;
                    reject(error);
                });
        });
    },
    scheduleEidSyncPerServerPerType: function (queueItem) {
        queueItem.trial++;
        return new Promise(function (resolve, reject) {
            console.log('Fetching results from eid...', queueItem.host, queueItem.type);
            service.getEidQueryPromise(queueItem)
                .then(function (result) {
                    console.log('Fetching results from eid done successfully', result);
                    if (result && result.patientIdentifiers &&
                        result.patientIdentifiers.length > 0) {
                        service.insertPatientsWithEidResultsIntoSyncQueue(result.patientIdentifiers)
                            .then(function (inserted) {
                                console.log('Inserted patients into eid sync queue');
                                resolve(result);
                            })
                            .catch(function (error) {
                                console.error('An error occured while inserting into eid sync queue', error);
                                reject(error);
                            });
                    } else {
                        if (result && result.patientIdentifiers) {
                            resolve(result);
                        } else {
                            reject('Unkown response, ', result);
                        }
                    }
                })
                .catch(function (error) {
                    console.error('Fetching results from eid done with an error: ', error);
                    reject(error);
                });
        });
    },
    getEidQueryPromise: function (queueItem) {
        switch (queueItem.type) {
            case 'vl':
                return eidService.getPatientIdentifiersWithEidResultsByType(queueItem.host, queueItem.apiKey,
                    queueItem.startDate, queueItem.endDate, eidService.getEidViralLoadResults);
                break;
            case 'cd4':
                return eidService.getPatientIdentifiersWithEidResultsByType(queueItem.host, queueItem.apiKey,
                    queueItem.startDate, queueItem.endDate, eidService.getEidCD4Results);
                break;
            case 'dnapcr':
                return eidService.getPatientIdentifiersWithEidResultsByType(queueItem.host, queueItem.apiKey,
                    queueItem.startDate, queueItem.endDate, eidService.getEidDnaPcrResults);
                break;
            default:
                throw new Error('Unknown lab type');
        }
    },
    initializeQueue: function (startDate, endDate) {
        _.each(config.eid.locations, function (server) {
            service.errorQueue.push({
                startDate: startDate,
                endDate: endDate,
                host: server.host,
                apiKey: server.generalApiKey,
                type: 'vl',
                trial: 0
            });

            service.errorQueue.push({
                startDate: startDate,
                endDate: endDate,
                host: server.host,
                apiKey: server.generalApiKey,
                type: 'dnapcr',
                trial: 0
            });

            if (server.loadCd4 === true) {
                service.errorQueue.push({
                    startDate: startDate,
                    endDate: endDate,
                    host: server.host,
                    apiKey: server.cd4ApiKey,
                    type: 'cd4',
                    trial: 0
                });
            }
        });
    },
    insertPatientsWithEidResultsIntoSyncQueue: function (patientIdentifiers) {
        var results = '';
        if (Array.isArray(patientIdentifiers)) {
            results = JSON.stringify(patientIdentifiers);
        } else {
            results = patientIdentifiers;
        }
        results = results.replace('[', "").replace(']', "");

        var sql = 'replace into etl.eid_sync_queue(person_uuid) select distinct p.uuid from amrs.person p left join amrs.patient_identifier i on p.person_id = i.patient_id where identifier in (?)';
        sql = sql.replace('?', results);

        var queryObject = {
            query: sql,
            sqlParams: []
        }

        return new Promise(function (resolve, reject) {
            db.queryReportServer(queryObject, function (response) {
                if (response.error) {
                    reject(response);
                } else {
                    resolve(response);
                }
            });
        });
    },
    schedulePatientsWithPendingOrders: function (startDate) {
        var sql = "replace into  etl.eid_sync_queue(person_uuid) (select distinct uuid from (select t3.uuid, t1.patient_id, t1.order_id, t2.order_id as obs_order_id, t1.date_activated from amrs.orders t1  inner join amrs.person t3 on t3.person_id = t1.patient_id left outer join amrs.obs t2 on t1.order_id = t2.order_id having obs_order_id is null) t where t.date_activated > date('?'))";
        sql = sql.replace('?', startDate);
        // console.log(sql);

        var queryObject = {
            query: sql,
            sqlParams: []
        }

        return new Promise(function (resolve, reject) {
            db.queryReportServer(queryObject, function (response) {
                if (response.error) {
                    reject(response);
                } else {
                    resolve(response);
                }
            });
        });
    },
    schedulePatientsWithMissingVlPastOneYear: function () {
        var sql = "replace into  etl.eid_sync_queue(person_uuid) " +
            "(select uuid from etl.flat_hiv_summary where timestampdiff(month, vl_1_date, now()) >= 11 and timestampdiff(month,arv_start_date,now()) >= 4 and is_clinical_encounter=1 and next_clinical_datetime_hiv is null and timestampdiff(month,encounter_datetime,now()) <= 18)";
        // sql = sql.replace('?', startDate);
        // console.log(sql);

        var queryObject = {
            query: sql,
            sqlParams: []
        }

        return new Promise(function (resolve, reject) {
            db.queryReportServer(queryObject, function (response) {
                if (response.error) {
                    reject(response);
                } else {
                    resolve(response);
                }
            });
        });
    },
    rescheduleEidSyncErrors: function () {
        return new Promise(function (resolve, reject) {
            service.insertEidQueueErrorsIntoEidSyncQueue()
                .then(function (response) {
                    service.emptyEidQueueErrors()
                        .then(function (response2) {
                            resolve({
                                insert: response,
                                delete: response2
                            });
                        })
                        .catch(function (err) {
                            reject(err);
                            console.error('error:', err);
                        });
                })
                .catch(function (err) {
                    reject('Error occured inserting error queue back into syn queue');
                    console.error('error:', err);
                });
        });
    },
    insertEidQueueErrorsIntoEidSyncQueue: function () {
        var sql = 'replace into  etl.eid_sync_queue(person_uuid)' +
            ' (select person_uuid from etl.eid_sync_queue_errors)';
        var queryObject = {
            query: sql,
            sqlParams: []
        };

        return new Promise(function (resolve, reject) {
            db.queryReportServer(queryObject, function (response) {
                if (response.error) {
                    reject(response);
                } else {
                    resolve(response);
                }
            });
        });

    },
    emptyEidQueueErrors: function () {
        var sql = 'delete from etl.eid_sync_queue_errors';
        var queryObject = {
            query: sql,
            sqlParams: []
        };
        return new Promise(function (resolve, reject) {
            db.queryReportServer(queryObject, function (response) {
                if (response.error) {
                    reject(response);
                } else {
                    resolve(response);
                }
            });
        });
    },
    getProcessArg(arg) {
        var val = null;
        var args = process.argv;
        _.each(args, function (row) {
            if (row.indexOf(arg) != -1) {
                val = row.split('=')[1];
            }
        });
        return val;
    },
    logSuccessfulScheduling: function (logMessage) {
        // var s = fs.createReadStream(log_file);
        fs.appendFileSync(log_file, JSON.stringify({
            date: new Date(),
            log: logMessage
        }) + '\r\n');
    },
    logErrorWhenScheduling: function (error) {
        fs.appendFileSync(error_file, JSON.stringify({
            date: new Date(),
            error: error
        }) + '\r\n');
    },
    sendMail: function (message, title, destination) {
        var transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: config.emailNotification.sourceAddress, // Your email id
                pass: config.emailNotification.sourcePassword // Your password
            }
        });
        var mailOptions = {
            from: config.emailNotification.sourceAddress, // sender address
            to: destination, // list of receivers
            subject: title, // Subject line
            text: message //, // plaintext body
            // html: '<b>Hello world ✔</b>' // You can choose to send an HTML body instead
        };
        return new Promise(function (resolve, reject) {
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                    reject(error);
                } else {
                    console.log('Message sent: ' + info.response);
                    resolve(info.response);
                };
            });
        });
    }
};

service.start();
