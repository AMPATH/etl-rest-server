/*jshint -W003, -W097, -W117, -W026 */
'use strict';
import { BaseMysqlReport } from '../../app/reporting-framework/base-mysql.report';

var Promise = require('bluebird');
var noteService = require('../../service/notes.service');
var encounterService = require('../../service/openmrs-rest/encounter.js');
var db = require('../../etl-db');
var _ = require('lodash');
var Boom = require('boom'); //extends Hapi Error Reporting. Returns HTTP-friendly error objects: github.com/hapijs/boom
var helpers = require('../../etl-helpers');
var patientReminderService = require('../../service/patient-reminder.service.js');

module.exports = function () {
    function getPatientHivSummary(request, callback) {
        var uuid = request.params.uuid;
        var order = helpers.getSortOrder(request.query.order);
        var includeNonClinicalEncounter = Boolean(true || false);
        var whereClause = includeNonClinicalEncounter === true ? ["uuid = ?",
            uuid
        ] : ["uuid = ?  and t1.encounter_type in (1,2,3,4,17,21,110,117,99999)", uuid];
        var queryParts = {
            columns: request.query.fields || "*",
            table: "etl.flat_hiv_summary_v15b",
            where: whereClause,
            order: order || [{
                column: 'encounter_datetime',
                asc: false
            }],
            offset: request.query.startIndex,
            limit: request.query.limit
        };

        var qParts = {
            columns: "*",
            table: "amrs.encounter_type",
            where: ["retired = ?", 0],
            offset: request.query.startIndex,
            limit: 1000
        };

        var encounterTypeNames = {};
        //get encounter type Name
        var encounterNamesPromise = db.queryDb(qParts);
        var summaryDataPromise = db.queryDb(queryParts);

        var promise = Promise.all([encounterNamesPromise, summaryDataPromise])
            .then(function (data) {
                var encTypeNames = data[0];
                var summaryData = data[1];

                // Map encounter type ids to names.
                _.each(encTypeNames.result, function (row) {
                    encounterTypeNames[row.encounter_type_id] = row.name;
                });

                // Format & Clean up raw summaries
                _.each(summaryData.result, function (summary) {
                    summary.cur_arv_meds_id = summary.cur_arv_meds;
                    summary.arv_first_regimen_id = summary.arv_first_regimen;
                    summary.cur_arv_meds = helpers.getARVNames(summary.cur_arv_meds);
                    summary.arv_first_regimen = helpers.getARVNames(summary.arv_first_regimen);
                    summary['encounter_type_name'] = encounterTypeNames[summary.encounter_type];
                    summary['prev_encounter_type_name'] = encounterTypeNames[summary.prev_encounter_type_hiv];
                });

                // Return when done.
                return summaryData;
            }).catch((error) => {
                console.error('EROR : GetPatientHivSummary', error);
            });

        if (_.isFunction(callback)) {
            promise.then(function (result) {
                callback(result);
            }).catch(function (err) {
                callback(err);
            });
        }

        return promise;
    }

    function getPatientOncologySummary(request, callback) {
        let queryParts = {
            columns: request.query.fields || "*",
            order: [{
                column: 'encounter_datetime',
                asc: false
            }]
        };

        getOncologyPatientReport(request, queryParts).then((data) => {
            let oncSummary = data;
            let medsSummary = '';
            let encounterId = 0;
            if (!_.isEmpty(oncSummary.result)) {
                encounterId = oncSummary.result[0].encounter_id;
            }
            getOncMeds(request, 'summary', encounterId).then((data) => {
                _.each(data.result, function (concept) {
                    medsSummary += helpers.getConceptName(parseInt(concept.value_coded)) + ', ';
                });
                _.each(oncSummary.result, (summary) => {
                    summary.diagnosis = helpers.getConceptName(summary.diagnosis);
                    summary.cur_onc_meds = medsSummary;
                    summary.diagnosis_method = helpers.getConceptName(summary.diagnosis_method);
                    summary.cancer_stage = helpers.getConceptName(summary.cancer_stage);
                    summary.overal_cancer_stage_group = helpers.getConceptName(summary.overal_cancer_stage_group);
                    summary.oncology_treatment_plan = helpers.getConceptName(summary.oncology_treatment_plan);
                    summary.chemotherapy_plan = helpers.getConceptName(summary.chemotherapy_plan);
                    summary.drug_route = helpers.getConceptName(summary.drug_route);
                    summary.medication_history = helpers.getConceptName(summary.medication_history);
                    summary.other_meds_added = helpers.getConceptName(summary.other_meds_addeds);
                    summary.encounter_datetime = helpers.filterDate(summary.encounter_datetime);
                    summary.visit_start_datetime = helpers.filterDate(summary.visit_start_datetime);
                    summary.enrollment_date = helpers.filterDate(summary.enrollment_date);
                    summary.rtc_date = helpers.filterDate(summary.rtc_date);
                    summary.prev_rtc_date = helpers.filterDate(summary.prev_rtc_date);
                    summary.diagnosis_date = helpers.filterDate(summary.diagnosis_date);
                    summary.cur_onc_meds_start_date = helpers.filterDate(summary.cur_onc_meds_start_date);
                });

                callback(oncSummary);

            }).catch((error) => {
                callback(error);
            });

        }).catch((error) => {
            callback(error);
        });

    }

    function getPatientOncologyMedicationHistory(request, callback) {
        let oncMedsDetailed = [];
        let oncMedHistory = {};
        getOncMeds(request, '', '').then((data) => {
            if (!!data) {
                let groupedMedsData = generateMedsDataSet(data.result);
                _.each(groupedMedsData, (summary) => {
                    if (summary.drugs) {
                        let planAndDate = summary.treatment_plan;
                        _.each(summary.drugs, function (data) {
                            let oncMed = {};
                            _.each(data, function (a) {
                                if (a.concept_id === 9918) {
                                    oncMed.cur_onc_meds = helpers.getConceptName(a.value_coded);
                                } else if (a.concept_id === 1899) {
                                    oncMed.cur_onc_meds_dose = a.value_numeric;
                                } else if (a.concept_id === 1896) {
                                    oncMed.cur_onc_meds_frequency = helpers.getConceptName(a.value_coded);
                                } else if (a.concept_id === 7463) {
                                    oncMed.cur_onc_meds_route = helpers.getConceptName(a.value_coded);
                                }
                                if (planAndDate) {
                                    oncMed.meds_start_date = planAndDate[0].obs_datetime;
                                    oncMed.chemotherapy_plan = helpers.getConceptName(planAndDate[0].value_coded);
                                }
                            });
                            if (oncMed !== '') {
                                oncMedsDetailed.push(oncMed);
                            }
                        });
                    }
                });
                oncMedHistory.result = oncMedsDetailed;
                callback(oncMedHistory);
            }
        });
    }

    function getPatientOncologyDiagnosis(request, callback) {
        let patientUuid = request.params.uuid;
        let queryParts = {
            columns: "*",
            order: [{
                column: 'encounter_id',
                asc: false
            }],
            joins: [
                ['amrs.person', 't2', 't2.person_id=t1.person_id']
            ],
            table: "amrs.obs",
            where: ["t2.uuid = ? and t1.concept_id in ? and t1.voided = ?", patientUuid, [9841, 9871, 6536, 9844, 6551, 9846, 6540, 9843], 0],
            offset: request.query.startIndex,
            limit: request.query.limit
        };
        db.queryDb(queryParts).then(data => {
            let diagnosisData = data;
            _.each(diagnosisData.result, (summary) => {
                summary.diagnosis = helpers.getConceptName(summary.value_coded);
                summary.diagnosis_date = helpers.filterDate(summary.diagnosis_date);
            });
            callback(diagnosisData);
        }).catch((error) => {
            callback(error);
        });
    }


    function getOncologyPatientReport(request, query) {
        let patientUuid = request.params.uuid;
        let programUuid = request.query.programUuid;
        let whereClause = ["uuid = ? AND programuuid = ? ", patientUuid, programUuid];

        _.merge(query, {
            table: "etl.flat_onc_patient_history",
            where: whereClause,
            leftOuterJoins: [
                ['(SELECT program_id, uuid as `programuuid` FROM amrs.program ) `t5` ON (t1.program_id = t5.program_id)']
            ],
            offset: request.query.startIndex,
            limit: request.query.limit
        });
        return db.queryDb(query);
    }

    function getPatientVitals(request, callback) {
        var uuid = request.params.uuid;
        var order = helpers.getSortOrder(request.query.order);
        // request.query.page;
        // request.query.pageSize;

        var queryParts = {
            columns: request.query.fields || "*",
            table: "etl.flat_vitals",
            where: ["uuid = ?", uuid],
            order: order || [{
                column: 'encounter_datetime',
                asc: false
            }],
            offset: request.query.startIndex,
            limit: request.query.limit
        };

        // Use promisified function instead
        var promise = db.queryDb(queryParts);

        if (_.isFunction(callback)) {
            promise.then(function (result) {
                callback(result);
            }).catch(function (err) {
                callback(err);
            });
        }

        // return the promise
        return promise;
    }

    function getHivPatientClinicalSummary(request, callback) {
        var patientUuid = request.params.uuid;
        var patientEncounters = encounterService.getPatientEncounters(patientUuid);
        var patientHivSummary = getPatientHivSummary(request);
        var patientVitals = getPatientVitals(request);
        var patientLabData = new Promise(function (resolve) {
            var extendedRequest = request;
            extendedRequest.query.limit = 300;
            getPatientLabData(extendedRequest, function (result) {
                resolve(result);
            });
        });
        var patientReminders = new Promise(function (resolve, reject) {
            var extendedRequest = request;
            extendedRequest.query.limit = 1;
            extendedRequest.params['referenceDate'] = new Date().toISOString().substring(0, 10);
            extendedRequest.params.patientUuid = patientUuid;

            getPatientReminders(extendedRequest,
                function (result) {
                    resolve(result);
                }, function (error) {
                    reject(error);
                });
        });

        Promise.all([patientEncounters, patientHivSummary, patientVitals, patientLabData, patientReminders])
            .then(function (data) {
                var encounters = data[0];
                var hivSummaries = data[1].result;
                var vitals = data[2].result;
                var labDataSummary = data[3].result;
                var reminders = data[4].result;
                var notes = noteService.generateNotes(encounters, hivSummaries, vitals);
                callback({
                    patientUuid: patientUuid,
                    notes: notes,
                    vitals: vitals,
                    hivSummaries: hivSummaries,
                    reminders: reminders.reminders || [],
                    labDataSummary: labDataSummary
                });
            })
            .catch(function (e) {
                // Return  error
                console.error('An error occured', e);
                callback(Boom.badData(JSON.stringify(e)));
            });
    }

    function getPatientReminders(request, onSuccess, onError) {
        var combineRequestParams = Object.assign({}, request.query, request.params);
        combineRequestParams.limitParam = 1;
        var reportParams = helpers.getReportParams('clinical-reminder-report', ['referenceDate', 'patientUuid', 'offSetParam', 'limitParam'], combineRequestParams);

        var report = new BaseMysqlReport('clinicalReminderReport', reportParams.requestParams);
        report.generateReport().then(function (results) {
            try {
                if (results.results.results.length > 0) {
                    var processedResults = patientReminderService.generateReminders(results.results.results, []);
                    results.result = processedResults;
                } else {
                    results.result = {
                        person_uuid: combineRequestParams.person_uuid,
                        reminders: []
                    };
                }
                onSuccess(results);
            } catch (error) {
                console.error('Error generating reminders', error);
                onError(new Error('Error generating reminders'));
            }
        }).catch(function (error) {
            console.error('Error generating reminders', error);
            onError(new Error('Error generating reminders'));
        });
    }

    function getClinicalNotes(request, callback) {
        var patientEncounters = encounterService.getPatientEncounters(request.params.uuid);
        var patientHivSummary = getPatientHivSummary(request);
        var patientVitals = getPatientVitals(request);

        Promise.all([patientEncounters, patientHivSummary, patientVitals]).then(function (data) {
            var encounters = data[0];
            var hivSummaries = data[1].result;
            var vitals = data[2].result;
            var notes = noteService.generateNotes(encounters, hivSummaries, vitals);
            callback({
                notes: notes,
                status: 'notes generated'
            });
        })
            .catch(function (e) {
                // Return empty json on error
                callback({
                    notes: [],
                    status: 'error generating notes',
                    error: e
                });
            });
    }

    function getPatientLabData(request, callback) {
        var uuid = request.params.uuid;
        var order = helpers.getSortOrder(request.query.order);

        var queryParts = {
            columns: request.query.fields || "t1.*, t2.cur_arv_meds",
            table: "etl.flat_labs_and_imaging",
            leftOuterJoins: [
                ['(select * from etl.flat_hiv_summary_v15b where is_clinical_encounter and uuid="' + uuid + '" group by date(encounter_datetime))',
                    't2', 'date(t1.test_datetime) = date(t2.encounter_datetime)'
                ]
            ],
            where: ["t1.uuid = ?", uuid],
            order: order || [{
                column: 'test_datetime',
                asc: false
            }],
            offset: request.query.startIndex,
            limit: request.query.limit
        };

        db.queryServer_test(queryParts, function (result) {
            _.each(result.result, function (row) {
                row.tests_ordered = helpers.getTestsOrderedNames(row.tests_ordered);
                row.hiv_rapid_test = helpers.getConceptName(row.hiv_rapid_test);
                row.cur_arv_meds = helpers.getARVNames(row.cur_arv_meds);
                row.lab_errors = helpers.resolvedLabOrderErrors(row.vl_error, row.cd4_error, row.hiv_dna_pcr_error);
                row.hiv_dna_pcr = helpers.getConceptName(row.hiv_dna_pcr);
                row.chest_xray = helpers.getConceptName(row.chest_xray);
                row.ecg = helpers.getConceptName(row.ecg);
                row.test_datetime = row.test_datetime.toString();
            });
            var arr = result.result;

            var cleanResult = getUnique(arr, 'test_datetime');
            result.result = cleanResult;
            callback(result);
        });
    }

    function getUnique(arr, comp) {
        const unique = arr.map(e => e[comp])
            .map((e, i, final) => final.indexOf(e) === i && i)
            .filter(e => arr[e]).map(e => arr[e]);

        return unique;

    }

    function getPatient(request, callback) {
        var uuid = request.params.uuid;
        var order = helpers.getSortOrder(request.query.order);

        var queryParts = {
            columns: request.query.fields || "*",
            table: "etl.flat_hiv_summary_v15b",
            where: ["uuid = ?", uuid],
            order: order || [{
                column: 'encounter_datetime',
                asc: false
            }],
            offset: request.query.startIndex,
            limit: request.query.limit
        };

        db.queryServer_test(queryParts, function (result) {
            callback(result);
        });
    }

    function getPatientCountGroupedByLocation(request, callback) {
        var periodFrom = request.query.startDate || new Date().toISOString().substring(0, 10);
        var periodTo = request.query.endDate || new Date().toISOString().substring(0, 10);
        var order = helpers.getSortOrder(request.query.order);

        var queryParts = {
            columns: "t3.location_id,t3.name,count( distinct t1.patient_id) as total",
            table: "amrs.patient",
            where: ["date_format(t1.date_created,'%Y-%m-%d') between date_format(?,'%Y-%m-%d') AND date_format(?,'%Y-%m-%d')", periodFrom, periodTo],
            group: ['t3.uuid,t3.name'],
            order: order || [{
                column: 't2.location_id',
                asc: false
            }],
            joins: [
                ['amrs.encounter', 't2', 't1.patient_id = t2.patient_id'],
                ['amrs.location', 't3', 't2.location_id=t3.location_id'],
                ['amrs.person_name', 't4', 't4.person_id=t1.patient_id and (t4.voided is null || t4.voided = 0)']
            ],
            offset: request.query.startIndex,
            limit: request.query.limit
        };

        db.queryServer_test(queryParts, function (result) {
            callback(result);
        });
    }

    function getPatientDetailsGroupedByLocation(request, callback) {
        var location = request.params.location;
        var periodFrom = request.query.startDate || new Date().toISOString().substring(0, 10);
        var periodTo = request.query.endDate || new Date().toISOString().substring(0, 10);
        var order = helpers.getSortOrder(request.query.order);
        var queryParts = {
            columns: "distinct t4.uuid as patientUuid, t1.patient_id, t3.given_name, t3.middle_name, t3.family_name, t4.gender, extract(year from (from_days(datediff(now(),t4.birthdate)))) as age",
            table: "amrs.patient",
            where: ["t2.location_id = ? AND date_format(t1.date_created,'%Y-%m-%d') between date_format(?,'%Y-%m-%d') AND date_format(?,'%Y-%m-%d')", location, periodFrom, periodTo],
            order: order || [{
                column: 't2.location_id',
                asc: false
            }],
            joins: [
                ['amrs.encounter', 't2', 't1.patient_id = t2.patient_id'],
                ['amrs.person_name', 't3', 't3.person_id=t1.patient_id and (t3.voided is null || t3.voided = 0)'],
                ['amrs.person', 't4', 't4.person_id=t1.patient_id']
            ],
            offset: request.query.startIndex,
            limit: request.query.limit
        };

        db.queryServer_test(queryParts, function (result) {
            callback(result);
        });
    }

    function getOncMeds(request, medsFormat, encounterId) {
        let queryParts = {};
        var patientUuid = request.params.uuid;
        var programUuid = request.query.programUuid;
        if (medsFormat == 'summary') {
            queryParts = {
                columns: "t1.value_coded",
                table: "amrs.obs",
                where: ["t2.uuid = ? and t1.concept_id in ? and t1.encounter_id = ? and t1.voided = ?", patientUuid, [9918], encounterId, 0],
                order: [{
                    column: 't1.obs_group_id',
                    asc: false
                }],
                joins: [
                    ['amrs.person', 't2', 't2.person_id=t1.person_id'],
                ],
                offset: request.query.startIndex,
                limit: request.query.limit
            };
        } else {
            queryParts = {
                columns: "t1.concept_id, t1.value_coded, t1.value_numeric, t1.obs_group_id, t1.encounter_id, t1.obs_datetime",
                table: "amrs.obs",
                where: ["t2.uuid = ? and t5.programuuid = ? and t1.concept_id in ? and t1.voided = ?", patientUuid, programUuid, [9918, 8723, 1896, 7463, 1899, 9869], 0],
                order: [{
                    column: 't1.obs_group_id',
                    asc: false
                }],
                joins: [
                    ['amrs.person', 't2', 't2.person_id=t1.person_id'],
                    ['amrs.patient_program', 't3', 't3.patient_id=t2.person_id']
                ],
                leftOuterJoins: [
                    ['(SELECT program_id, uuid as `programuuid` FROM amrs.program ) `t5` ON (t3.program_id = t5.program_id)']
                ],
                offset: request.query.startIndex,
                limit: request.query.limit
            };
        }
        return db.queryDb(queryParts)
    }
    let generateMedsDataSet = ((data) => {
        let meds = [];
        const groupBy = key => array =>
            array.reduce((objectsByKeyValue, obj) => {
                const value = obj[key];
                objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
                return objectsByKeyValue;
            }, {});
        //Group medical history obs by the group
        if (data) {
            const groupByEncounter = groupBy('encounter_id');
            const encounterData = groupByEncounter(data);
            _.each(encounterData, function (concepts) {
                let oncMeds = {};
                const i = groupBy('obs_group_id');
                let plan = _.filter(concepts, function (o) { return o.concept_id == 9869 });
                oncMeds.treatment_plan = plan;
                _.remove(concepts, function (e) {
                    return e.obs_group_id == null;
                });
                let drug;
                drug = i(concepts);
                if (!_.isEmpty(drug)) {
                    oncMeds.drugs = drug;
                    meds.push(oncMeds);
                }
            })
        }
        return meds;
    });

    return {
        getPatientHivSummary: getPatientHivSummary,
        getPatientOncologySummary: getPatientOncologySummary,
        getPatientOncologyDiagnosis: getPatientOncologyDiagnosis,
        getPatientOncologyMedicationHistory: getPatientOncologyMedicationHistory,
        getPatientVitals: getPatientVitals,
        getClinicalNotes: getClinicalNotes,
        getPatientData: getPatientLabData,
        getPatient: getPatient,
        getHivPatientClinicalSummary: getHivPatientClinicalSummary,
        getPatientCountGroupedByLocation: getPatientCountGroupedByLocation,
        getPatientDetailsGroupedByLocation: getPatientDetailsGroupedByLocation
    }
}();
