import QueryService from '../../app/database-access/query.service';

export class PatientLastOrderLocationDao {

    constructor() { }

    getPatientLastOrderLocation(patientUuid) {
        let runner = new QueryService();

        let sqlQuery = `SELECT e.location_id as location FROM amrs.encounter e
        LEFT JOIN amrs.orders o on o.encounter_id = e.encounter_id
        INNER JOIN amrs.person p on o.patient_id = p.person_id
        WHERE p.uuid = '`+patientUuid+`' ORDER BY e.encounter_datetime DESC LIMIT 1;`;

        return new Promise((resolve, reject) => {
            runner.executeQuery(sqlQuery)
                .then((result) => {
                    resolve({ result: result });
                })
                .catch((error) => {
                    reject(error)
                });
        });
    }
}
