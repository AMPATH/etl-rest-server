var db = require("../../etl-db");
var moment = require('moment');

const caseDataDao = {
    
    getCaseManagementData: (params) => {
        const daysMissedSinceRtc = convertDaysToDate(params.minDefaultPeriod, params.maxDefaultPeriod);
        try {
            let queryParts = {};
            queryParts = {
                columns: "t1.encounter_type, t1.encounter_datetime, t1.rtc_date, t1.vl_1, t1.vl_1_date, t1.enrollment_date, t1.arv_first_regimen_start_date, t1.arv_start_date, t1.prev_arv_start_date",
                table: "etl.flat_case_manage_beta",
                alias: 't1',
                where: ["t1.rtc_date between ? and ?", 
                daysMissedSinceRtc[1], 
                daysMissedSinceRtc[0]]
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