var db = require("../../etl-db");
var moment = require('moment');

const caseDataDao = {
    
    getCaseManagementData: (params) => {
        const rtcDateRange = convertDaysToDate(params.minDefaultPeriod, params.maxDefaultPeriod);
        const followupDateRange = convertDaysToDate(params.minFollowupPeriod, params.maxFollowupPeriod);
        try {
            let queryParts = {};
            queryParts = {
                columns: "t1.encounter_type, t1.encounter_datetime, t1.rtc_date, t1.vl_1, t1.vl_1_date, t1.enrollment_date, t1.arv_first_regimen_start_date, t1.arv_start_date, t1.prev_arv_start_date",
                table: "etl.flat_case_manage_beta",
                alias: 't1',
                where: ["t1.rtc_date between ? and ? and t1.encounter_datetime between ? and ?", 
                rtcDateRange[1], 
                rtcDateRange[0],
                followupDateRange[1], 
                followupDateRange[0]]
            };
            return db.queryDb(queryParts);
        } catch (error) {
            return error;
        }
    },
    getCaseManagers: (params) => {
        try {
            let queryParts = {};
            queryParts = {
                columns: "CONCAT(COALESCE(t4.given_name, ''), ' ', COALESCE(t4.middle_name,''), ' ', COALESCE(t4.family_name, '')) as person_name, t1.uuid as `user_uuid`, t5.value_reference as `location_uuid`",
                table: "amrs.users",
                alias: 't1',
                joins: [
                    ['amrs.person', 't2', 't1.person_id = t2.person_id'],
                    ['amrs.provider', 't3', 't2.person_id = t3.person_id'],
                    ['amrs.person_name', 't4', 't2.person_id = t4.person_id'],
                    ['amrs.provider_attribute', 't5', 't3.provider_id = t5.provider_id'],
                ],
                where: ['t5.attribute_type_id = 1 and t5.value_reference = ?', 
                params.locationUuid]
            };
            return db.queryDb(queryParts);
        } catch (error) {
            return error;
        }
    }
}

function convertDaysToDate(minDays, maxDays) {
    return [moment().subtract(minDays, "days").format("YYYY-MM-DD"),moment().subtract(maxDays, "days").format("YYYY-MM-DD")];
}

module.exports = caseDataDao;