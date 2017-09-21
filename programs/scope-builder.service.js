var def = {
    buildScope: buildScope
};

module.exports = def;

function buildScope(dataDictionary) {
    var scope = {};
    if (dataDictionary.patient) {
        buildPatientScopeMembers(scope, dataDictionary.patient);
    }

    if (dataDictionary.enrollment) {
        buildProgramScopeMembers(scope, dataDictionary.enrollment);
    }

    if (dataDictionary.hivLastTenClinicalEncounters) {
        buildHivScopeMembers(scope, dataDictionary.hivLastTenClinicalEncounters);
    }

    if (dataDictionary.intendedVisitLocationUuid) {
        scope.intendedVisitLocationUuid = dataDictionary.intendedVisitLocationUuid;
        console.log('scope.intendedVisitLocationUuid ', scope.intendedVisitLocationUuid );
    }

    // add other methods to build the scope objects
    return scope;
}

function buildPatientScopeMembers(scope, patient) {
    scope.age = patient.person.age;
}

function buildProgramScopeMembers(scope, programEnrollment) {
    if (programEnrollment && programEnrollment.location &&
        programEnrollment.location.uuid) {
        scope.programLocation = programEnrollment.location.uuid;
    }
}

function buildHivScopeMembers(scope, lastTenHivSummary) {
    if (Array.isArray(lastTenHivSummary) && lastTenHivSummary.length > 0) {
        scope.isFirstAMPATHHIVVisit = false;
        scope.previousHIVClinicallocation = lastTenHivSummary[0].location_uuid;
        console.log('scope111111', scope);
    } else {
        scope.isFirstAMPATHHIVVisit = true;
    }
    console.log('scope', scope);
}