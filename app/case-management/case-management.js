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

            var columns = "identifiers,DATE_FORMAT(encounter_datetime, '%Y-%m-%d') AS last_follow_up_date,DATE_FORMAT(effective_rtc, '%Y-%m-%d') AS rtc_date,extract(year from (from_days(datediff(now(),t1.birthdate)))) as age,  TIMESTAMPDIFF(DAY,DATE(rtc_date),curdate()) AS days_since_missed_appointment,  " +
                "case_manager_name AS case_manager,person_name AS patient_name,gender,t1.vl_1 AS last_vl, DATE_FORMAT(t1.vl_1_date, '%Y-%m-%d') as last_vl_date, TIMESTAMPDIFF(DAY,DATE(encounter_datetime),curdate()) AS days_since_follow_up,  " +
                "t1.uuid as patient_uuid, DATE_FORMAT(next_phone_appointment, '%Y-%m-%d') AS next_phone_appointment, case_manager_user_id, (CASE WHEN TIMESTAMPDIFF(DAY,DATE(rtc_date),curdate()) > 0 THEN 1 ELSE 0 END) as missed_appointment, " + getDueForVl() + "AS patients_due_for_vl ";

            let where = " location_uuid = '" + params.locationUuid + "' ";
            if ((params.minDefaultPeriod != null || params.minDefaultPeriod != null)) {
                rtcDateRange = convertDaysToDate(params.minDefaultPeriod, params.maxDefaultPeriod);
                where = where + " and t1.rtc_date between '" + rtcDateRange[1] + "' and '" + rtcDateRange[0] + "' ";
            }
            if ((params.minFollowupPeriod != null || params.maxFollowupPeriod != null)) {
                followupDateRange = convertDaysToDate(params.minFollowupPeriod, params.maxFollowupPeriod);
                where = where + "and t1.encounter_datetime between '" + followupDateRange[1] + "' and '" + followupDateRange[0] + "' ";
            }
            if ((params.rtcStartDate != null || params.rtcEndDate != null)) {
                where = where + "and t1.rtc_date between DATE('" + params.rtcStartDate + "') and DATE('" + params.rtcEndDate + "') ";
            }
            if (params.phoneFollowUpStartDate != null) {
                where = where + "and next_phone_appointment =  DATE('" + params.phoneFollowUpStartDate + "') "
            }
            if (params.hasCaseManager == 1) {
                where = where + "and case_manager_user_id is not null "
            } else if (params.hasCaseManager == 0) {
                where = where + "and case_manager_user_id is null "
            }
            if (params.elevatedVL == 1) {
                where = where + "and  vl_1 > 1000 "
            } else if (params.elevatedVL == 0) {
                where = where + "and vl_1 < 1000 "
            }
            if (params.hasPhoneRTC == 1) {
                where = where + "and next_phone_appointment is not null "
            } else if (params.hasPhoneRTC == 0) {
                where = where + "and next_phone_appointment is null "
            }
            if (params.dueForVl == 1) {
                where = where + "and " + getDueForVl() + " = 1 "
            } else if (params.dueForVl == 0) {
                where = where + "and " + getDueForVl() + " = 0 "
            }
            if (params.caseManagerUserId != null) {
                where = where + "and case_manager_user_id in (" + params.caseManagerUserId + ")"
            }
            sql = "select " + columns + "FROM etl.flat_case_manager `t1` LEFT JOIN amrs.relationship `t2` on (t1.person_id = t2.person_a) WHERE ( " + where + " ) group by person_id order by t1.vl_1 desc"
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
        return new Promise((resolve, reject) => {
            let queryParts = {};
            let sql = "select CONCAT(COALESCE(t6.given_name, ''), ' ', COALESCE(t6.middle_name,''), ' ',  " +
                "COALESCE(t6.family_name, '')) as person_name, t2.uuid as `user_uuid`, t5.value_reference as `location_uuid`, " +
                "count(t1.person_id) as `number_assigned`,t4.provider_id,t2.user_id FROM amrs.users `t2`  " +
                "INNER JOIN amrs.person `t3` ON (t3.person_id = t2.person_id)  " +
                "INNER JOIN amrs.provider `t4` ON (t4.person_id = t3.person_id) " +
                "INNER JOIN amrs.provider_attribute `t5` ON (t5.provider_id = t4.provider_id)  " +
                "INNER JOIN amrs.person_name `t6` ON (t6.person_id = t3.person_id) " +
                "LEFT JOIN amrs.person_attribute `t1` ON (t2.user_id = t1.value AND person_attribute_type_id = 68) "+
                "WHERE ( t5.attribute_type_id = 1 AND (t1.voided = 0 or t1.voided is null) AND t5.value_reference = '" + params.locationUuid + "') GROUP by t2.uuid; "

            queryParts = {
                sql: sql
            };
            return db.queryServer(queryParts, function (result) {
                result.sql = sql;
                resolve(result);
            });
        })
    },
    assignPatientsToCaseManagers: async (payload) => {
        try {
            let payloadData = getPayloadData(payload);
            let erroredPatients = []
            while (payloadData.length > 0) {
                let data = payloadData.splice(0, 10);
                let promisesArray = [];

                data.forEach(d => {
                    const obj = {
                        user_id: d.user_id,
                        user_name: d.user_name,
                        patient_uuid: d.patient_uuid,
                        user_uuid: d.user_uuid
                    }
                    promisesArray.push(postPersonAttributes(obj))
                })
                await Promise.allSettled(promisesArray).
                    then((results) => results.forEach((result) => {
                        if (result.isFulfilled()) {
                            updateCaseManager(result.value());
                        } else if (result.isRejected()) {
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
        const uuid = m.user_uuid;
        const id = m.user_id;
        const name = m.user_name;
        patientsToAssign.forEach(p => {
            const patient = {
                user_uuid: uuid,
                user_id: id,
                user_name: name,
                patient_uuid: p.patient_uuid
            }
            payloadData.push(patient)
        })
    })
    return payloadData;
}

function getRestResource(path) {
    var protocol = config.openmrs.https ? 'https' : 'http';
    var link = protocol + '://' + config.openmrs.host + ':' + config.openmrs.port + path;
    return link;
}

function postPersonAttributes(params) {
    var uri = getRestResource('/' + config.openmrs.applicationName + '/ws/rest/v1/person/' + params.patient_uuid);
    let payload = {
        "attributes": [
            {
                "attributeType": "9a6e12b5-98fe-467a-9541-dab11ad87e45",
                "value": params.user_uuid
            }
        ]
    }
    return new Promise(function (resolve, reject) {
        rp.postRequestPromise(payload, uri)
            .then(function (r) {
                resolve(params);
            })
            .catch(function (error) {
                const response = {
                    patieuntUuid: params.patient_uuid
                }
                reject(response);
            })
    });
}

function updateCaseManager(params) {
    return new Promise((resolve, reject) => {
        let queryParts = {};
        let sql = "update etl.flat_case_manager set case_manager_user_id = '" + params.user_id + "', case_manager_user_name='" + params.user_name + "', case_manager_name='" + params.user_name + "'  where uuid = '" + params.patient_uuid + "' ;"
        queryParts = {
            sql: sql
        };
        db.queryServer(queryParts, function (result) {
            result.sql = sql;
            resolve(result);
        });
    })
}

function getDueForVl() {
    return "(case when (timestampdiff(month,vl_1_date, curdate()) >= 3) and vl_1 > 999 and arv_start_date < vl_1_date then 1  " +
        "when (timestampdiff(month,arv_start_date,curdate()) between 6 and 12) and (vl_1_date is null or vl_1_date < arv_start_date ) then 1 " +
        "when (timestampdiff(month,arv_start_date,curdate()) > 12) and (vl_1_date is null or timestampdiff(month,vl_1_date,curdate()) > 12) then 1  " +
        "WHEN  (t1.is_pregnant OR (t2.relationship = 2 AND TIMESTAMPDIFF(MONTH, t2.date_created,curdate()) BETWEEN 0 AND 24 )) AND vl_1 > 400 AND  (TIMESTAMPDIFF(MONTH, vl_1_date,curdate()) >= 3) THEN 1  " +
        "WHEN  (t1.is_pregnant OR (t2.relationship = 2 AND TIMESTAMPDIFF(MONTH, t2.date_created,curdate()) BETWEEN 0 AND 24 )) AND vl_1 <= 400 AND  (TIMESTAMPDIFF(MONTH, vl_1_date,curdate()) >= 6) THEN 1 " +
        "WHEN arv_first_regimen_start_date is not null and arv_start_date is not null and arv_first_regimen_start_date < arv_start_date AND TIMESTAMPDIFF(MONTH,arv_start_date,curdate()) >= 3 AND vl_1_date is null then 1 " +
        "WHEN arv_first_regimen_start_date is not null and arv_start_date is not null and arv_first_regimen_start_date < arv_start_date AND TIMESTAMPDIFF(MONTH,arv_start_date,curdate()) >= 3 AND TIMESTAMPDIFF(MONTH,vl_1_date,arv_start_date)>=1  then 1 else 0 end) "
}

function convertDaysToDate(minDays, maxDays) {
    return [moment().subtract(minDays, "days").format("YYYY-MM-DD"), moment().subtract(maxDays, "days").format("YYYY-MM-DD")];
}

module.exports = caseDataDao;