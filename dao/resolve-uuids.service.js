const dao = require('../etl-dao');
export class ResolveUuidsService {
    resolveEncounterTypes(uuids) {
        return new Promise((resolve, reject) => {
            return dao.getIdsByUuidAsyc('amrs.encounter_type', 'encounter_type_id', 'uuid', uuids, (results) => {
                resolve(results);
            });
        });
    }

    resolveVisitTypes(uuids) {
        return new Promise((resolve, reject) => {
            return dao.getIdsByUuidAsyc('amrs.visit_type', 'visit_type_id', 'uuid', uuids, (results) => {
                resolve(results);
            });
        });
    }

    resolvePrograms(uuids) {
        return new Promise((resolve, reject) => {
            return dao.getIdsByUuidAsyc('amrs.program', 'program_id', 'uuid', uuids, (results) => {
                resolve(results);
            });
        });
    }

    resolveLocations(uuids) {
        return new Promise((resolve, reject) => {
            return dao.getIdsByUuidAsyc('amrs.location', 'location_id', 'uuid', uuids, (results) => {
                resolve(results);
            });
        });
    }
};