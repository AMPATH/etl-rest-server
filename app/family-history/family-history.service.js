var db = require('../../etl-db');

export class FamilyTestingService {

    getPatientList = (params) => {
        return new Promise((resolve, reject) => {
            let queryParts = {};
            let sql =
                "SELECT fh.person_id AS `person_id`,fh.uuid as `patient_uuid`,l.uuid AS `location_uuid`,fh.location_id AS `location_id`,GROUP_CONCAT(DISTINCT id.identifier SEPARATOR ', ') AS `identifiers`,CONCAT(COALESCE(person_name.given_name, ''),' ',COALESCE(person_name.middle_name, ''),' ',COALESCE(person_name.family_name, '')) AS `person_name`,t1.gender AS `gender`,EXTRACT(YEAR FROM (FROM_DAYS(DATEDIFF(NOW(), t1.birthdate)))) AS `age`,pt.name AS `program_name`, " +
                "GROUP_CONCAT(DISTINCT contacts.value SEPARATOR ', ') AS `phone_number`,pa.address3 AS `nearest_center`,family_count " +
                "FROM etl.flat_hiv_summary_v15b `fh`INNER JOIN amrs.location `l` ON (l.location_id = fh.location_id) INNER JOIN amrs.person `t1` ON (fh.person_id = t1.person_id) LEFT JOIN amrs.person_name `person_name` ON (t1.person_id = person_name.person_id AND (person_name.voided IS NULL || person_name.voided = 0) AND person_name.preferred = 1) LEFT JOIN " +
                "amrs.patient_identifier `id` ON (t1.person_id = id.patient_id AND (id.voided IS NULL || id.voided = 0)) LEFT JOIN amrs.person_attribute `contacts` ON (t1.person_id = contacts.person_id AND (contacts.voided IS NULL || contacts.voided = 0) AND contacts.person_attribute_type_id IN (10 , 48)) LEFT JOIN amrs.person_address `pa` ON (t1.person_id = pa.person_id) LEFT JOIN amrs.patient_program `pp` ON (pp.patient_id = fh.person_id AND pp.date_completed IS NULL) " +
                "LEFT JOIN amrs.program `pt` ON (pp.program_id = pt.program_id) LEFT JOIN (SELECT  COUNT(*) AS `family_count`, patient_id FROM etl.flat_family_testing GROUP BY patient_id) `t1` ON t1.patient_id = fh.person_id WHERE fh.next_clinical_location_id IS NULL AND fh.encounter_type NOT IN (99999) AND l.uuid = '" + params.locationUuid + "' "+
                "AND TIMESTAMPDIFF(DAY,fh.rtc_date, curdate()) < 30 GROUP BY t1.person_id ";

            queryParts = {
                sql: sql,
                startIndex: params.startIndex,
                limit: params.limit
            };
            return db.queryServer(queryParts, function (result) {
                result.sql = sql;
                resolve(result);
            });
        });
    }
    getPatientFamilyHistory = (params) => {
        return new Promise((resolve, reject) => {
            let queryParts = {};
            let sql =
                "select * from etl.flat_family_testing where patient_id = "+ params.patientId +"";
            queryParts = {
                sql: sql
            };
            return db.queryServer(queryParts, function (result) {
                result.sql = sql;
                resolve(result);
            });
        });
    }
}