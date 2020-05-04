var db = require("../../etl-db");
var moment = require('moment');
const Promise = require("bluebird");
var config = require('../../conf/config');
var rp = require('../../request-config');

const caseDataDao = {

    getCaseManagementData: (params, callback) => {
        let followupDateRange = [];
        let rtcDateRange = [];
        let sql = ''
        try {
            let queryParts = {};

            var columns = "identifiers,DATE(encounter_datetime) AS last_follow_up_date,DATE(effective_rtc) AS rtc_date,extract(year from (from_days(datediff(now(),t1.birthdate)))) as age,  " +
                "case_manager_name AS case_manager,person_name AS patient_name,gender,t1.vl_1 AS last_vl, t1.vl_1_date, TIMESTAMPDIFF(DAY,DATE(encounter_datetime),curdate()) AS days_since_follow_up,  " +
                "uuid as patient_uuid, null as phone_rtc_date, null as case_manager_uuid, (CASE WHEN TIMESTAMPDIFF(DAY,DATE(rtc_date),curdate()) > 0 THEN 1 ELSE 0 END) as missed_appointment, " + getDueForVl() + "AS patients_due_for_vl ";

            let where = '';
            if ((params.minDefaultPeriod != null || params.minDefaultPeriod != null)) {
                rtcDateRange = convertDaysToDate(params.minDefaultPeriod, params.maxDefaultPeriod);
                where = "t1.rtc_date between '" + rtcDateRange[1] + "' and '" + rtcDateRange[0] + "' ";
            }
            if ((params.minFollowupPeriod != null || params.maxFollowupPeriod != null)) {
                followupDateRange = convertDaysToDate(params.minFollowupPeriod, params.maxFollowupPeriod);
                where = where + "and t1.encounter_datetime between '" + followupDateRange[1] + "' and '" + followupDateRange[0] + "' ";
            }
            if (params.hasCaseManager == 1) {
                where = where + "and case_manager_person_id is not null "
            } else if (params.hasCaseManager == 0) {
                where = where + "and case_manager_person_id is null "
            }
            if (params.elevatedVL == 1) {
                where = where + "and  vl_1 > 1000 "
            } else if (params.elevatedVL == 0) {
                where = where + "and vl_1 < 1000 "
            }
            if (params.hasPhoneRTC == 1) {
                where = where + "and phone_rtc is not null "
            } else if (params.hasPhoneRTC == 0) {
                where = where + "and phone_rtc is null "
            }
            if (params.dueForVl == 1) {
                where = where + "and " + getDueForVl() + " = 1 "
            } else if (params.dueForVl == 0) {
                where = where + "and " + getDueForVl() + " = 0 "
            }
            if (params.caseManagerUuid != null) {
                where = where + "and case_manager_uuid = '" + params.caseManagerUuid + "'"
            }
            sql = "select " + columns + "FROM etl.flat_case_manager `t1` WHERE (" + where + "  and location_uuid = '" + params.locationUuid + "')"
            queryParts = {
                sql: sql,
                startIndex: params.startIndex,
                limit: params.limit
            };
            db.queryServer(queryParts, function (result) {
                result.sql = sql;
                callback(result);
            });
        } catch (error) {
            return error;
        }
    },
    getCaseManagers: (params) => {
        try {
            let queryParts = {};
            queryParts = {
                columns: "CONCAT(COALESCE(t6.given_name, ''), ' ', COALESCE(t6.middle_name,''), ' ', COALESCE(t6.family_name, '')) as person_name, t1.uuid as `user_uuid`, t5.value_reference as `location_uuid`,count(t1.person_id) as `number_assigned`,t4.provider_id",
                table: "amrs.person_attribute",
                alias: 't1',
                joins: [
                    ['amrs.users', 't2', 't2.user_id = t1.value'],
                    ['amrs.person', 't3', 't3.person_id = t2.person_id'],
                    ['amrs.provider', 't4', 't4.person_id = t3.person_id'],
                    ['amrs.provider_attribute', 't5', 't5.provider_id = t4.provider_id'],
                    ['amrs.person_name', 't6', 't6.person_id = t3.person_id']
                ],
                where: ['person_attribute_type_id=68 and t5.attribute_type_id = 1 and t5.value_reference = ?',
                    params.locationUuid],
                groupBy: 't4.provider_id'
            };
            return db.queryDb(queryParts);
        } catch (error) {
            return error;
        }
    },
    assignPatientsToCaseManagers: async (payload) => {
        try {
            let payloadData = getPayloadData(payload);
            let erroredPatients = []
            while (payloadData.length > 0) {
                let data = payloadData.splice(0, 10);
                let promisesArray = [];

                data.forEach(d => {
                    let payload = {
                        "attributes": [
                            {
                                "attributeType": "9a6e12b5-98fe-467a-9541-dab11ad87e45",
                                "value": d.user_uuid
                            }
                        ]
                    }
                    promisesArray.push(postPersonAttributes(payload, d.patient_uuid))
                })
                await Promise.allSettled(promisesArray).
                    then((results) => results.forEach((result) => {
                        if (result.isRejected()) {
                            erroredPatients.push(result.reason());
                        }
                    }));

            }
            return erroredPatients;
        }
        catch (error) {
            return error;
        }
    }
}

function getPayloadData(payload) {
    let payloadData = [];
    let patients = payload.patients
    let managers = payload.caseManagers

    managers.forEach(m => {
        const patientsToAssign = patients.splice(0, m.count);
        const user_uuid = m.user_uuid;
        patientsToAssign.forEach(p => {
            payloadData.push({
                user_uuid: user_uuid,
                patient_uuid: p.patient_uuid
            })
        })
    })
    return payloadData;
}

function getRestResource(path) {
    var protocol = config.openmrs.https ? 'https' : 'http';
    var link = protocol + '://' + config.openmrs.host + ':' + config.openmrs.port + path;
    return link;
}

function postPersonAttributes(payload, personUuid) {
    var uri = getRestResource('/' + config.openmrs.applicationName + '/ws/rest/v1/person/' + personUuid);
    return new Promise(function (resolve, reject) {
        rp.postRequestPromise(payload, uri)
            .then(function (response) {
                resolve(response);
            })
            .catch(function (error) {
                const response = {
                    patieuntUuid: personUuid
                }
                reject(response);
            })
    });
}

function getDueForVl() {
    return " (CASE WHEN vl_1 > 999 AND vl_1_date > arv_start_date AND TIMESTAMPDIFF(MONTH,vl_1_date,curdate()) >=3 THEN 1 " +
        "WHEN extract(year from (from_days(datediff(now(),t1.birthdate))))<=24 AND arv_first_regimen_start_date is not null AND " +
        "(TIMESTAMPDIFF(MONTH,arv_first_regimen_start_date,curdate())>=6 or TIMESTAMPDIFF(MONTH,arv_start_date,curdate())>=6) and vl_1_date is null  then 1 " +
        "WHEN extract(year from (from_days(datediff(now(),t1.birthdate)))) <=24 AND arv_first_regimen_start_date is not null AND TIMESTAMPDIFF(MONTH,vl_1_date,curdate()) >=6  then 1 " +
        "WHEN extract(year from (from_days(datediff(now(),t1.birthdate)))) >=25 AND arv_first_regimen_start_date is not null AND " +
        "(TIMESTAMPDIFF(MONTH,arv_first_regimen_start_date,curdate())>=6 or TIMESTAMPDIFF(MONTH,arv_start_date,curdate())>=6) and vl_1_date is null  then 1 " +
        "WHEN extract(year from (from_days(datediff(now(),t1.birthdate)))) >=25 AND arv_first_regimen_start_date is not null " +
        "AND TIMESTAMPDIFF(MONTH,vl_1_date,curdate()) >=6 and (TIMESTAMPDIFF(MONTH,arv_first_regimen_start_date,curdate()) <=12 or TIMESTAMPDIFF(MONTH,arv_start_date,curdate()) <= 12 ) then 1 " +
        "WHEN extract(year from (from_days(datediff(now(),t1.birthdate)))) >=25 AND arv_first_regimen_start_date is not null AND TIMESTAMPDIFF(MONTH,vl_1_date,curdate()) >=12 " +
        "AND (TIMESTAMPDIFF(MONTH,arv_first_regimen_start_date,curdate()) > 12 or TIMESTAMPDIFF(MONTH,arv_start_date,curdate()) > 12 )then 1 WHEN arv_first_regimen_start_date is not null " +
        "AND arv_start_date is not null and arv_first_regimen_start_date < arv_start_date  AND TIMESTAMPDIFF(MONTH,arv_start_date,curdate()) >= 3 AND vl_1_date is null then 1 WHEN arv_first_regimen_start_date is not null " +
        "AND arv_start_date is not null and arv_first_regimen_start_date < arv_start_date AND TIMESTAMPDIFF(MONTH,arv_start_date,curdate()) >= 3  then 1 else 0 END) "
}

function convertDaysToDate(minDays, maxDays) {
    return [moment().subtract(minDays, "days").format("YYYY-MM-DD"), moment().subtract(maxDays, "days").format("YYYY-MM-DD")];
}

module.exports = caseDataDao;