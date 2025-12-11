const _ = require('lodash');
const Moment = require('moment');

const def = {
  buildScope: buildScope
};

module.exports = def;

function buildScope(dataDictionary) {
  const scope = {
    isPatientTransferredOut: false,
    isFirstAMPATHHIVVisit: true,
    qualifiesForStandardVisit: false,
    qualifiesMedicationRefillVisit: false,
    lastCovidScreeningDate: '',
    retroSpective: false,
    screenedForCovidToday: false,
    isViremicHighVL: false,
    hasHTSEncounters: false,
    showOnlyHTSScreening: false,
    showOnlyHTSINITIAL: false,
    showOnlyHTSRetest: false,
    showHTSRetestToConfirmP: false,
    showOthersHTSEncounters: false,
    isEligibleForCommunityVisit: false,
    inPrediction: false,
    showCommunityDSDVisit: false,
    showStandardCommunityVisit: false,
    isPrepStudyType: false,
    isPrepConsentFilled: false
  };

  let isStandardDcVisit = false;

  if (
    dataDictionary.weeklyPredictedPatients &&
    dataDictionary.weeklyPredictedPatients.length > 0
  ) {
    scope.inPrediction = true;
  }
  // Restrict to Pilot locations
  scope.MlLocations = [
    '08feb8ae-1352-11df-a1f1-0026b9348838',
    '08feb9a8-1352-11df-a1f1-0026b9348838',
    '08fec60a-1352-11df-a1f1-0026b9348838',
    '090090d4-1352-11df-a1f1-0026b9348838',
    'db2bdd7c-5fe6-4ea3-adc1-d2d8dfb3d658',
    '17c97881-90e5-43c8-b8a3-cc0322f89a89',
    'e9f515c2-7c48-4099-ac76-41db9977f96f',
    'f7aabb83-7915-4c24-88b2-bcde8b3a9977',
    '08feae7c-1352-11df-a1f1-0026b9348838',
    '1ce5034b-f05d-46b6-910f-fc959e091641',
    '29124daf-6422-4896-b70e-daad3b252c9d',
    '08fec42a-1352-11df-a1f1-0026b9348838',
    'a36c86bb-7ca3-4319-8674-28c66ba14deb',
    '345514ae-8f37-42fc-9bbe-993828c2910d',
    '08feb444-1352-11df-a1f1-0026b9348838',
    '0900880a-1352-11df-a1f1-0026b9348838',
    '0900948a-1352-11df-a1f1-0026b9348838',
    'dfa41633-bef8-4465-b773-8254cef7cc7f',
    '1ee4e702-913b-40a6-ab9c-26f9b4fced1c',
    'af0d01d4-7c15-491d-be73-50512ab67e3a',
    '8241f06b-d74d-4f6d-9def-7254d9833e10',
    'd560891a-28b9-41cc-8cfc-1efd441bc906',
    'e467502b-ac9a-47f8-ad13-9a8e3eda889f',
    '2313bdd9-54f2-4534-9193-07246f2485d6',
    '4e21fbba-66e4-43d5-94a9-219b25a02ddc',
    '18c343eb-b353-462a-9139-b16606e6b6c2',
    '08febb92-1352-11df-a1f1-0026b9348838',
    '535dc3bd-842b-4ca1-bc7c-357635ab985e',
    'e466e113-dcfa-4dd0-9404-66a45a9a6a88',
    'd9076981-4a84-4f6c-9f22-8980376727ae',
    '09008fda-1352-11df-a1f1-0026b9348838',
    'dfc0f21e-2e6c-4052-bdfe-23ee1b8084e8',
    '25972cec-2e14-4047-a537-404c6ad18389',
    '0449c609-d190-4412-80ae-c14444e6a5f2',
    'b77f94ea-62ea-469a-8a88-5aa2d33bdaaf',
    '3d8cdb07-bbe5-495c-b4ae-b9d6a2dc694f',
    '0900831e-1352-11df-a1f1-0026b9348838',
    '8f5694dc-cba7-47b5-a97c-677cfb9a8d7c',
    '0900b74e-1352-11df-a1f1-0026b9348838',
    'cb4a90fd-28b8-4c01-b15c-242ff5e5e731',
    '49fa8ba9-06f4-4072-afe7-fd3e51ed4482',
    '8c7ec4f7-270c-45e9-a4f9-8589242d50d5',
    '96d2964e-8cec-4eca-ad05-a9c1fb29a045',
    '2b1d2083-b4df-4e5c-96fe-af88122ef75b',
    '0db6a78c-6b64-420c-bc30-ac403417c237',
    '2c89c870-560d-4521-90f9-b62f56939595',
    'ce8089a9-d105-4d79-8a0a-d4a389d691b4',
    '3db5339b-491c-4e80-8c55-7ef21d7141e6',
    'a580930d-9a57-48ec-aa3e-c170802f45b0',
    '6b9bebc0-bea7-4c90-8dc8-4c14f33c96de',
    '090089ea-1352-11df-a1f1-0026b9348838',
    'e93d79ea-13c8-4f0c-a757-0858a7f387eb',
    '19874e26-f614-47bb-99c7-a3756bfe3c64',
    'b8135ddf-e02c-4098-b4ce-17880a9ddb0f',
    '09004e76-1352-11df-a1f1-0026b9348838',
    'e907044b-4170-49e1-98e8-93258596bb23',
    '0900b000-1352-11df-a1f1-0026b9348838',
    'b4f7483a-00b8-4ff4-be70-dfefc85c60fa',
    '9d1025b7-280d-46f7-8f0d-33b3b7aeab41',
    'd0d133f1-22f3-49c3-b9f1-d2f64944eb0d',
    '7a8c0cc5-be43-48e1-aa41-33cb1e9cc26f',
    '22a1255d-e56b-446a-a32b-e7ea8bd1a89c',
    '6cd0b441-d644-487c-8466-5820a73f9ce5',
    '523d5060-07ee-46d9-b439-12867c4e83ac',
    'b56b5219-0c8f-4520-810e-ba43302c63eb',
    '516c889a-f9ea-4861-b89c-e39f08dfb15c',
    'e05cbb83-9418-4ebc-9240-ae2512d70321',
    'de051b8a-78ab-4fa8-bb08-5364c8e87297',
    'fc26648e-aa47-4928-8595-5c96943b44b2',
    '20bd486d-5c84-44f4-9ffa-2f1c1d9e79f8',
    'f0e8d70a-dd24-4f59-bcf3-3566b8a1d5cc',
    '0a2d9adf-d758-4c81-8429-2ff54e2c58d6',
    '0900b104-1352-11df-a1f1-0026b9348838',
    '0943a3b0-3630-4d71-ad09-cc55cfd3bde1',
    '0900aace-1352-11df-a1f1-0026b9348838',
    '8b6f450b-8a61-4051-b4bd-b1a79cb541ee',
    '0900b212-1352-11df-a1f1-0026b9348838',
    '48305e5b-2ca5-44e1-8f6b-008c4d2789ba',
    '38eec9dd-8b52-4f8c-ad25-f045486299c1',
    '08fec704-1352-11df-a1f1-0026b9348838',
    'e3cb359e-0b69-4371-aa62-8ca22dca151f',
    'cb31d052-b668-4321-80ad-c0aaa571f87b',
    'e211bf00-819a-43a5-baa4-354feaa02db8',
    '1d3bc503-925b-4a31-91da-337b611cc27a',
    '88506d5f-8b48-42ca-88ab-c2855bca9ee2',
    '538c14c2-c98a-49a2-9e11-0af6f7b912dc',
    'e26cbaf5-fd02-4c4f-a529-7a4dcb5ed5e6',
    '81e709e6-769d-4ac0-95b9-65fffa1b87c3',
    '09c9dbeb-9a24-4511-9ad2-9cf6601a9023',
    '7fb68709-6e7b-4eaf-a984-ea111fa45853',
    '68cb63f3-992d-4fd0-a80d-47a27fcf8021',
    '10446739-2ef2-4fb3-b134-29840d97acbe',
    '08fec24a-1352-11df-a1f1-0026b9348838',
    '08fec056-1352-11df-a1f1-0026b9348838',
    '08fec150-1352-11df-a1f1-0026b9348838',
    '1dc987ac-5396-4498-9e87-a344aeb4b290',
    '65bdb112-a254-4cf9-a5a7-29dce997312d',
    '08feb14c-1352-11df-a1f1-0026b9348838',
    '8cad59c8-7f88-4964-aa9e-908f417f70b2',
    '02e85257-94d6-43bf-8603-322248c1a210',
    '00b47ef5-a29b-40a2-a7f4-6851df8d6532',
    'f8dd8eb8-b9fe-46d1-bb42-58a5f18cfc25',
    '08febf52-1352-11df-a1f1-0026b9348838',
    '60cd8ba2-c4a5-44e5-b7cf-7cc3192756f6',
    '0900aefc-1352-11df-a1f1-0026b9348838',
    '1254d7b3-4fb1-407e-b192-57e149225bb3',
    '0900adee-1352-11df-a1f1-0026b9348838',
    'abef0621-e2cd-4a65-8893-2ee6e963ab81',
    '0900abdc-1352-11df-a1f1-0026b9348838',
    '37649b75-d92f-4a73-8ffe-42cb62280efc',
    '840d4e9c-8f62-4ece-bfd7-64bf04007033',
    'a473d19b-51ce-429e-927e-a197d36e00f1',
    '294efcca-cf90-40da-8abb-1e082866388d',
    '0900a9ac-1352-11df-a1f1-0026b9348838',
    '78d91367-c020-4c65-b4f3-31ec07fb90d9',
    '09008206-1352-11df-a1f1-0026b9348838',
    '2efc716d-fddf-468e-8365-09cca3fc4d5c',
    '0900acea-1352-11df-a1f1-0026b9348838',
    '469bb74e-18a4-4d74-872e-55fcebe12dc7',
    '6666bb3c-1500-4320-9c46-78efc5bbaee0',
    '4949293e-7b5c-4359-8a55-1196a578143b',
    'd0fac112-5690-47c5-8ffc-0abcbb5b3124'
  ].includes(dataDictionary.intendedVisitLocationUuid);
  if (dataDictionary.patient) {
    buildPatientScopeMembers(scope, dataDictionary.patient);
  }

  if (dataDictionary.enrollment) {
    buildProgramScopeMembers(scope, dataDictionary.enrollment);
  }

  if (dataDictionary.patientEnrollment) {
    const activeEnrollments = _.filter(dataDictionary.patientEnrollment, {
      dateCompleted: null
    });
    let isEnrolledInPMTCT = false;
    let isEnrolledInViremia = false;

    activeEnrollments.forEach((item) => {
      if (item.program.uuid === 'c4246ff0-b081-460c-bcc5-b0678012659e') {
        isEnrolledInViremia = true;
      }

      if (item.program.uuid === '781d897a-1359-11df-a1f1-0026b9348838') {
        isEnrolledInPMTCT = true;
      }
    });

    if (isEnrolledInPMTCT && isEnrolledInViremia) {
      scope.isEnrolledInViremiaPMTCT = true;
    } else {
      scope.isEnrolledInViremiaPMTCT = false;
    }
  }

  if (dataDictionary.dcQualifedVisits) {
    const result = conditionalDCVisits(dataDictionary);
    const medicationRefillResults = validateMedicationRefillEligibility(
      dataDictionary.validateMedicationRefill
    );
    if (medicationRefillResults?.communityVisit) {
      scope.isEligibleForCommunityVisit = true;
    }
    if (medicationRefillResults?.medicationRefill) {
      scope.isEligibleForMedicationRefill = true;
    }
    if (result) {
      isStandardDcVisit = true;
    }
    if (
      dataDictionary.dcQualifedVisits.qualifies_for_standard_visit === 1 ||
      isStandardDcVisit
    ) {
      scope.qualifiesForStandardVisit = true;
    }
    if (
      dataDictionary.dcQualifedVisits.qualifies_for_medication_refill === 1 &&
      !isStandardDcVisit
    ) {
      scope.qualifiesMedicationRefillVisit = true;
    }
  }

  if (dataDictionary.latestCohortEncounter) {
    if (dataDictionary.latestCohortEncounter.showDCVisit) {
      scope.showCommunityDSDVisit = true;
    }

    if (dataDictionary.latestCohortEncounter.showStandardCommunityVisit) {
      scope.showStandardCommunityVisit = true;
    }
  }

  if (dataDictionary.intendedVisitLocationUuid) {
    scope.intendedVisitLocationUuid = dataDictionary.intendedVisitLocationUuid;
    // Restrict to Pilot locations
    scope.MlLocations = [
      '08feb8ae-1352-11df-a1f1-0026b9348838',
      '08feb9a8-1352-11df-a1f1-0026b9348838',
      '08fec60a-1352-11df-a1f1-0026b9348838',
      '090090d4-1352-11df-a1f1-0026b9348838',
      'db2bdd7c-5fe6-4ea3-adc1-d2d8dfb3d658',
      '17c97881-90e5-43c8-b8a3-cc0322f89a89',
      'e9f515c2-7c48-4099-ac76-41db9977f96f',
      'f7aabb83-7915-4c24-88b2-bcde8b3a9977',
      '08feae7c-1352-11df-a1f1-0026b9348838',
      '1ce5034b-f05d-46b6-910f-fc959e091641',
      '29124daf-6422-4896-b70e-daad3b252c9d',
      '08fec42a-1352-11df-a1f1-0026b9348838',
      'a36c86bb-7ca3-4319-8674-28c66ba14deb',
      '345514ae-8f37-42fc-9bbe-993828c2910d',
      '08feb444-1352-11df-a1f1-0026b9348838',
      '0900880a-1352-11df-a1f1-0026b9348838',
      '0900948a-1352-11df-a1f1-0026b9348838',
      'dfa41633-bef8-4465-b773-8254cef7cc7f',
      '1ee4e702-913b-40a6-ab9c-26f9b4fced1c',
      'af0d01d4-7c15-491d-be73-50512ab67e3a',
      '8241f06b-d74d-4f6d-9def-7254d9833e10',
      'd560891a-28b9-41cc-8cfc-1efd441bc906',
      'e467502b-ac9a-47f8-ad13-9a8e3eda889f',
      '2313bdd9-54f2-4534-9193-07246f2485d6',
      '4e21fbba-66e4-43d5-94a9-219b25a02ddc',
      '18c343eb-b353-462a-9139-b16606e6b6c2',
      '08febb92-1352-11df-a1f1-0026b9348838',
      '535dc3bd-842b-4ca1-bc7c-357635ab985e',
      'e466e113-dcfa-4dd0-9404-66a45a9a6a88',
      'd9076981-4a84-4f6c-9f22-8980376727ae',
      '09008fda-1352-11df-a1f1-0026b9348838',
      'dfc0f21e-2e6c-4052-bdfe-23ee1b8084e8',
      '25972cec-2e14-4047-a537-404c6ad18389',
      '0449c609-d190-4412-80ae-c14444e6a5f2',
      'b77f94ea-62ea-469a-8a88-5aa2d33bdaaf',
      '3d8cdb07-bbe5-495c-b4ae-b9d6a2dc694f',
      '0900831e-1352-11df-a1f1-0026b9348838',
      '8f5694dc-cba7-47b5-a97c-677cfb9a8d7c',
      '0900b74e-1352-11df-a1f1-0026b9348838',
      'cb4a90fd-28b8-4c01-b15c-242ff5e5e731',
      '49fa8ba9-06f4-4072-afe7-fd3e51ed4482',
      '8c7ec4f7-270c-45e9-a4f9-8589242d50d5',
      '96d2964e-8cec-4eca-ad05-a9c1fb29a045',
      '2b1d2083-b4df-4e5c-96fe-af88122ef75b',
      '0db6a78c-6b64-420c-bc30-ac403417c237',
      '2c89c870-560d-4521-90f9-b62f56939595',
      'ce8089a9-d105-4d79-8a0a-d4a389d691b4',
      '3db5339b-491c-4e80-8c55-7ef21d7141e6',
      'a580930d-9a57-48ec-aa3e-c170802f45b0',
      '6b9bebc0-bea7-4c90-8dc8-4c14f33c96de',
      '090089ea-1352-11df-a1f1-0026b9348838',
      'e93d79ea-13c8-4f0c-a757-0858a7f387eb',
      '19874e26-f614-47bb-99c7-a3756bfe3c64',
      'b8135ddf-e02c-4098-b4ce-17880a9ddb0f',
      '09004e76-1352-11df-a1f1-0026b9348838',
      'e907044b-4170-49e1-98e8-93258596bb23',
      '0900b000-1352-11df-a1f1-0026b9348838',
      'b4f7483a-00b8-4ff4-be70-dfefc85c60fa',
      '9d1025b7-280d-46f7-8f0d-33b3b7aeab41',
      'd0d133f1-22f3-49c3-b9f1-d2f64944eb0d',
      '7a8c0cc5-be43-48e1-aa41-33cb1e9cc26f',
      '22a1255d-e56b-446a-a32b-e7ea8bd1a89c',
      '6cd0b441-d644-487c-8466-5820a73f9ce5',
      '523d5060-07ee-46d9-b439-12867c4e83ac',
      'b56b5219-0c8f-4520-810e-ba43302c63eb',
      '516c889a-f9ea-4861-b89c-e39f08dfb15c',
      'e05cbb83-9418-4ebc-9240-ae2512d70321',
      'de051b8a-78ab-4fa8-bb08-5364c8e87297',
      'fc26648e-aa47-4928-8595-5c96943b44b2',
      '20bd486d-5c84-44f4-9ffa-2f1c1d9e79f8',
      'f0e8d70a-dd24-4f59-bcf3-3566b8a1d5cc',
      '0a2d9adf-d758-4c81-8429-2ff54e2c58d6',
      '0900b104-1352-11df-a1f1-0026b9348838',
      '0943a3b0-3630-4d71-ad09-cc55cfd3bde1',
      '0900aace-1352-11df-a1f1-0026b9348838',
      '8b6f450b-8a61-4051-b4bd-b1a79cb541ee',
      '0900b212-1352-11df-a1f1-0026b9348838',
      '48305e5b-2ca5-44e1-8f6b-008c4d2789ba',
      '38eec9dd-8b52-4f8c-ad25-f045486299c1',
      '08fec704-1352-11df-a1f1-0026b9348838',
      'e3cb359e-0b69-4371-aa62-8ca22dca151f',
      'cb31d052-b668-4321-80ad-c0aaa571f87b',
      'e211bf00-819a-43a5-baa4-354feaa02db8',
      '1d3bc503-925b-4a31-91da-337b611cc27a',
      '88506d5f-8b48-42ca-88ab-c2855bca9ee2',
      '538c14c2-c98a-49a2-9e11-0af6f7b912dc',
      'e26cbaf5-fd02-4c4f-a529-7a4dcb5ed5e6',
      '81e709e6-769d-4ac0-95b9-65fffa1b87c3',
      '09c9dbeb-9a24-4511-9ad2-9cf6601a9023',
      '7fb68709-6e7b-4eaf-a984-ea111fa45853',
      '68cb63f3-992d-4fd0-a80d-47a27fcf8021',
      '10446739-2ef2-4fb3-b134-29840d97acbe',
      '08fec24a-1352-11df-a1f1-0026b9348838',
      '08fec056-1352-11df-a1f1-0026b9348838',
      '08fec150-1352-11df-a1f1-0026b9348838',
      '1dc987ac-5396-4498-9e87-a344aeb4b290',
      '65bdb112-a254-4cf9-a5a7-29dce997312d',
      '08feb14c-1352-11df-a1f1-0026b9348838',
      '8cad59c8-7f88-4964-aa9e-908f417f70b2',
      '02e85257-94d6-43bf-8603-322248c1a210',
      '00b47ef5-a29b-40a2-a7f4-6851df8d6532',
      'f8dd8eb8-b9fe-46d1-bb42-58a5f18cfc25',
      '08febf52-1352-11df-a1f1-0026b9348838',
      '60cd8ba2-c4a5-44e5-b7cf-7cc3192756f6',
      '0900aefc-1352-11df-a1f1-0026b9348838',
      '1254d7b3-4fb1-407e-b192-57e149225bb3',
      '0900adee-1352-11df-a1f1-0026b9348838',
      'abef0621-e2cd-4a65-8893-2ee6e963ab81',
      '0900abdc-1352-11df-a1f1-0026b9348838',
      '37649b75-d92f-4a73-8ffe-42cb62280efc',
      '840d4e9c-8f62-4ece-bfd7-64bf04007033',
      'a473d19b-51ce-429e-927e-a197d36e00f1',
      '294efcca-cf90-40da-8abb-1e082866388d',
      '0900a9ac-1352-11df-a1f1-0026b9348838',
      '78d91367-c020-4c65-b4f3-31ec07fb90d9',
      '09008206-1352-11df-a1f1-0026b9348838',
      '2efc716d-fddf-468e-8365-09cca3fc4d5c',
      '0900acea-1352-11df-a1f1-0026b9348838',
      '469bb74e-18a4-4d74-872e-55fcebe12dc7',
      '6666bb3c-1500-4320-9c46-78efc5bbaee0',
      '4949293e-7b5c-4359-8a55-1196a578143b',
      'd0fac112-5690-47c5-8ffc-0abcbb5b3124'
    ].includes(dataDictionary.intendedVisitLocationUuid);
  }

  if (dataDictionary.patientEncounters) {
    scope.patientEncounters = dataDictionary.patientEncounters;
    scope.programUuid = dataDictionary.programUuid;
    buildHivScopeMembers(
      scope,
      dataDictionary.patientEncounters,
      dataDictionary?.intendedVisitLocationUuid
    );
    buildOncologyScopeMembers(
      scope,
      dataDictionary.patientEncounters,
      dataDictionary.programUuid
    );
    buildMNCHScopeMembers(
      scope,
      dataDictionary.patientEncounters,
      dataDictionary.patientEnrollment
    );
  }

  if (dataDictionary.retroSpective) {
    scope.retroSpective = dataDictionary.retroSpective;
  }

  if (dataDictionary.isPatientTransferredOut) {
    scope['isPatientTransferredOut'] = dataDictionary.isPatientTransferredOut;
  }

  if (dataDictionary.retroSpective === 'true') {
    scope.screenedForCovidToday = true;
  } else {
    const today = Moment().format('YYYY-MM-DD');
    const visitDate = Moment(dataDictionary.visitDate).format('YYYY-MM-DD');
    if (dataDictionary.latestCovidAssessment) {
      scope['lastCovidScreeningDate'] = dataDictionary.latestCovidAssessment;
      const screeningDate = Moment(dataDictionary.latestCovidAssessment).format(
        'YYYY-MM-DD'
      );
      /*
      if the visit is a past visit but not retrospective
      or visit is retrospective
      */

      if (
        screeningDate >= visitDate ||
        Moment(today).isAfter(Moment(visitDate))
      ) {
        scope.screenedForCovidToday = true;
      }
    } else {
      /*
      if the visit is a past visit but not retrospective
      */
      if (Moment(today).isAfter(Moment(visitDate))) {
        scope.screenedForCovidToday = true;
      }
    }
  }
  // Add Restrictions For Users who are not Suppressed vl > 200 System to Restrict Filling of Enhance Adherance Form
  if (
    dataDictionary.programUuid === 'c4246ff0-b081-460c-bcc5-b0678012659e' &&
    dataDictionary.isViremicHighVL
  ) {
    scope.isViremicHighVL = true;
  }

  if (dataDictionary.patientEncounters) {
    scope.patientEncounters = dataDictionary.patientEncounters;
    scope.programUuid = dataDictionary.programUuid;

    // Add HTS scope building alongside other program builders
    if (dataDictionary.programUuid === 'a0f8382f-df8a-4f1d-8959-9fb6eef90353') {
      buildHTSScopeMembers(
        scope,
        dataDictionary.patientEncounters,
        dataDictionary.isHtsPatientNegative,
        dataDictionary
      );
    }

    buildHivScopeMembers(
      scope,
      dataDictionary.patientEncounters,
      dataDictionary?.intendedVisitLocationUuid
    );
    buildOncologyScopeMembers(
      scope,
      dataDictionary.patientEncounters,
      dataDictionary.programUuid
    );
    buildMNCHScopeMembers(
      scope,
      dataDictionary.patientEncounters,
      dataDictionary.patientEnrollment
    );
  }

  if (dataDictionary.programUuid === 'c19aec66-1a40-4588-9b03-b6be55a8dd1d') {
    scope.isPrepStudyType = prepStudyVisit(dataDictionary.patientTypeConcepts);
  }
  // add other methods to build the scope objects
  return scope;
}

function conditionalDCVisits(patient) {
  // get the latest encounter by sorting the encounters by date
  const patientEncounters = patient.patientEncounters;
  const latestEncounter = getLatestEncounter(patientEncounters);
  const expectedEncounterToBeDrugPickup =
    '987009c6-6f24-43f7-9640-c285d6553c63';
  if (latestEncounter) {
    return (
      latestEncounter.encounterType.uuid === expectedEncounterToBeDrugPickup
    );
  }
}

function checkPrepStudyConsent(patientEncounters) {
  let prepConsentFilled = false;
  const prepStudyConsentEncounter = '874ddf0e-6a7c-48ab-8d7f-470d2c5cefcd';

  let prepConsentEncounter = getSpecificEncounterTypesFromEncounters(
    patientEncounters,
    prepStudyConsentEncounter
  );

  if (prepConsentEncounter.length === 1) {
    prepConsentFilled = true;
  } else {
    prepConsentEncounter = false;
  }
  return prepConsentFilled;
}

function validateMedicationRefillEligibility(validateMedicationRefill) {
  if (!validateMedicationRefill || !validateMedicationRefill.obs) {
    console.warn('No encounter or observations found.');
    return;
  }

  const conceptMap = {
    medicationRefillEligibility: 'd5e8c52f-7a38-44ed-a76a-bc771cc9b2ee',
    communityVisitEligibility: 'f930b22e-8b8e-4b8c-8d19-4c34a5d34a5e'
  };

  const icadAnswerUuid = '7e5e7759-e9f7-4b16-b904-041fcdddb390';

  // Version 2.0 cutoff date
  const VERSION_2_CUTOFF_DATE = new Date('2025-05-02');

  let isEligibleForMedicationRefill = false;
  let isEligibleForCommunityVisit = false;
  let hasMedicationRefillConcept = false;

  // Check if the new concepts exist in observations
  for (const obs of validateMedicationRefill.obs) {
    const conceptUuid = obs.concept?.uuid;

    if (!conceptUuid) continue;

    if (conceptUuid === conceptMap.medicationRefillEligibility) {
      hasMedicationRefillConcept = true;
      isEligibleForMedicationRefill = true;
    }

    if (
      conceptUuid === conceptMap.communityVisitEligibility &&
      obs.value?.uuid === icadAnswerUuid
    ) {
      isEligibleForCommunityVisit = true;
    }
  }

  // Backwards compatibility logic for medicationRefillEligibility
  if (!hasMedicationRefillConcept) {
    const encounterDate = new Date(validateMedicationRefill.encounterDatetime);

    // For encounters before version 2.0, default to eligible for medication refill
    // This maintains the previous workflow where this validation didn't exist
    if (encounterDate < VERSION_2_CUTOFF_DATE) {
      isEligibleForMedicationRefill = true;
      console.log(
        'Legacy encounter detected - defaulting medicationRefill eligibility to true'
      );
    }
    // For newer encounters without the concept
    else {
      console.warn(
        'Recent encounter missing medicationRefillEligibility concept'
      );
      isEligibleForMedicationRefill = false;
    }
  }

  return {
    medicationRefill: isEligibleForMedicationRefill,
    communityVisit: isEligibleForCommunityVisit,
    isLegacyEncounter:
      !hasMedicationRefillConcept &&
      new Date(validateMedicationRefill.encounterDatetime) <
        VERSION_2_CUTOFF_DATE
  };
}

function buildPatientScopeMembers(scope, patient) {
  scope.age = patient.person.age;
  scope.gender = patient.person.gender;
}

function getPreviousHIVClinicallocation(patientEncounters) {
  const hivClinicalEncounterTypeUuids = [
    '8d5b27bc-c2cc-11de-8d13-0010c6dffd0f', // adult initial
    '8d5b2be0-c2cc-11de-8d13-0010c6dffd0f', // Adult Return
    '8d5b2dde-c2cc-11de-8d13-0010c6dffd0f', // Peds Initial
    '8d5b3108-c2cc-11de-8d13-0010c6dffd0f', //peds return
    'df553c4a-1350-11df-a1f1-0026b9348838', // PMTCTANC
    'df55406e-1350-11df-a1f1-0026b9348838', // ADULTNONCLINICALMEDICATION
    'df55417c-1350-11df-a1f1-0026b9348838', // PEDSNONCLINICALMEDICATION
    'df554398-1350-11df-a1f1-0026b9348838', // ECSTABLE
    'df5545aa-1350-11df-a1f1-0026b9348838', // ECHIGHRISK
    'df555306-1350-11df-a1f1-0026b9348838', // ECPeds
    'df555950-1350-11df-a1f1-0026b9348838', // ANCINITIAL
    'df555a5e-1350-11df-a1f1-0026b9348838', // ANCRETURN
    'df555b62-1350-11df-a1f1-0026b9348838', // POSTNATAL
    'b1e9ed0f-5222-4d47-98f7-5678b8a21ebd', // PMTCTPOSTNATAL
    'fc8c1694-90fc-46a8-962b-73ce9a99a78f', // YOUTHINITIAL
    '4e7553b4-373d-452f-bc89-3f4ad9a01ce7', // YOUTHRETURN
    '56b6a3cf-4552-45f9-a80b-bd8ab61a232f', // GENERALNOTE
    '485ba2f3-8529-4255-804e-278c3a14f6ef', // CLINICREVIEW
    '8e942fd1-135d-42bd-9701-04560f180ec5', // MOH257BLUECARD
    '425ee5d1-bf39-4e09-b372-fc86abfea0c1', // RESISTANCECLINIC
    '386eedd9-e835-48e5-9da9-59b2641ea742', // NONCLINICALMEDICATION
    'e3202a01-8cd5-4224-b0dd-760557f85310', // DIFFERENTIATEDCARE
    'fb8aa28d-ca10-4f9a-a913-3233afb4c22a', // HIVCOMMUNITYBASEDRESEARCH
    '3c8cd5d4-cdc2-4136-8326-224b682b6543', // MDTFORM
    '0ea8bfc4-fd3b-40bb-bb34-d5c5d9199c96', // DIFFERENTIATEDCARECLINICIAN
    'b70a7e18-9ed1-4bf5-800e-740d7eaa3514', // DIFFERENTIATEDCARERETENTION
    '693559d3-4e44-4d33-83f9-bc70ca56fe34', // TXSUPPORTERMEDREFILL
    'fed9ffa5-da88-484a-8259-bee7daa6d6f2', // PEDSTHIRDLINE
    'b690e24a-6dc7-40a8-8cbd-0924dd507dca', // YOUTHTHIRDLINE
    'de78a6be-bfc5-4634-adc3-5f1a280455cc', // HIV Enrollment
    'a0034eee-1940-4e35-847f-97537a35d05e' // HIV Consultation
  ];
  const encountersFromLatest = patientEncounters.reverse();
  const latestHivClinicalLocation = [
    encountersFromLatest.find((e) => {
      const encounterType = e?.encounterType?.uuid;
      return hivClinicalEncounterTypeUuids.includes(encounterType);
    })
  ].map((r) => {
    return r?.encounterType?.uuid;
  });
  return latestHivClinicalLocation[0] ? latestHivClinicalLocation[0] : null;
}

function prepStudyVisit(patient) {
  let isPrepStudyType = false;
  if (patient !== undefined) {
    const studyTypeAnswer = patient.value.uuid;
    if (studyTypeAnswer === 'a89a898a-1350-11df-a1f1-0026b9348838') {
      isPrepStudyType = true;
    }
  } else {
    isPrepStudyType = false;
  }
  return isPrepStudyType;
}

function isInitialPrepVisit(patientEncounters) {
  const initialPrEPEncounterUuid = '00ee2fd6-9c95-4ffc-ab31-6b1ce2dede4d';

  let initialPrEPEncounters = _.filter(patientEncounters, (encounter) => {
    return encounter.encounterType.uuid === initialPrEPEncounterUuid;
  });

  return initialPrEPEncounters.length === 0;
}

function isInitialKVPVisit(patientEncounters) {
  const initialKVPEncounterUuid = '73715d49-533f-4f41-8ac0-8965d4acc9fc';

  let initialKVPEncounters = _.filter(patientEncounters, (encounter) => {
    return encounter.encounterType.uuid === initialKVPEncounterUuid;
  });

  return initialKVPEncounters.length === 0;
}

function isInitialPepVisit(patientEncounters) {
  /*
  1. Hide the PEP Return Visit 2 months from the initial Visit  Use initial encounter date 
  if in case the client does not come for 1 month return Visit

   2. Display Initial Visit when Clinician discharge or after filling a PEP return form.

  */
  const initialPEPEncounterUuid = 'c3a78744-f94a-4a25-ac9d-1c48df887895';
  const returnPEPEncounterUuid = 'f091b833-9e1a-4eef-8364-fc289095a832';
  const today = Moment(new Date());
  let isInitialPEPVisit = true;

  // get initial and return pep encounters

  const initialPEPEncounters = getSpecificEncounterTypesFromEncounters(
    patientEncounters,
    initialPEPEncounterUuid
  );
  const pepReturnEncounters = getSpecificEncounterTypesFromEncounters(
    patientEncounters,
    returnPEPEncounterUuid
  );

  if (initialPEPEncounters.length === 0) {
    isInitialPEPVisit = true;
  } else {
    const latestPEPInitialEncounter = getLatestEncounter(initialPEPEncounters);
    const latestPEPInitialEncounterDate = Moment(
      latestPEPInitialEncounter.encounterDatetime
    ).format();

    const durationSinceLastPEPInitialEncounter = today.diff(
      latestPEPInitialEncounterDate,
      'months'
    );

    if (pepReturnEncounters.length === 0) {
      if (durationSinceLastPEPInitialEncounter >= 2) {
        isInitialPEPVisit = true;
      } else {
        isInitialPEPVisit = false;
      }
    } else {
      const latestPEPReturnEncounter = getLatestEncounter(pepReturnEncounters);
      const latestPEPReturnEncounterDate = Moment(
        latestPEPReturnEncounter.encounterDatetime
      ).format();

      if (
        Moment(latestPEPInitialEncounterDate).isAfter(
          latestPEPReturnEncounterDate
        )
      ) {
        if (durationSinceLastPEPInitialEncounter >= 2) {
          isInitialPEPVisit = true;
        } else {
          isInitialPEPVisit = false;
        }
      } else {
        isInitialPEPVisit = true;
      }
    }
  }

  return isInitialPEPVisit;
}

function isInitialPMTCTVisit(patientEncounters) {
  const initialPMTCTEncounterUuids = [
    '8d5b27bc-c2cc-11de-8d13-0010c6dffd0f', // Adult Initial
    '8d5b2dde-c2cc-11de-8d13-0010c6dffd0f', // Peds Initial
    'fc8c1694-90fc-46a8-962b-73ce9a99a78f' // Youth Initial
  ];

  let initialPMTCTEncounters = _.filter(patientEncounters, (encounter) => {
    return initialPMTCTEncounterUuids.includes(encounter.encounterType.uuid);
  });

  return initialPMTCTEncounters.length === 0;
}
function isInitialVisit(
  patientEncounters,
  patientEnrollment,
  programUuid,
  encounterUuid
) {
  let initialEncounters = _.filter(patientEncounters, (encounter) => {
    return encounterUuid === encounter.encounterType.uuid;
  });

  const activeEnrollments = _.filter(patientEnrollment, {
    dateCompleted: null
  });
  let isEnrolled = false;
  let dateEnrolled = '';
  activeEnrollments.forEach((item) => {
    if (item.program.uuid === programUuid) {
      isEnrolled = true;
      dateEnrolled = item.dateEnrolled;
    }
  });
  // get latest initial encounter and compare with dateenrolled to check whether it's a new enrollment
  let latestEnc = initialEncounters[initialEncounters.length - 1];
  if (
    initialEncounters.length > 0 &&
    dateEnrolled > latestEnc.encounterDatetime
  ) {
    return true;
  } else if (initialEncounters.length === 0) {
    return true;
  } else {
    return false;
  }
}
function isInitialOncologyVisit(encounters, programUuid) {
  const oncologyProgramEncounterTypeMap = [
    {
      programUuid: 'e8bc5036-1462-44fa-bcfe-ced21eae2790', // Lung Cancer Treatment Program
      initialEncounterUuid: 'be7b0971-b2ab-4f4d-88c7-e7322aa58dbb' // Lung Cancer Initial
    },
    {
      programUuid: '725b5193-3452-43fc-aca3-6a80432d9bfa', // General Oncology Program
      initialEncounterUuid: 'd17b3adc-0837-4ac6-862b-0953fc664cb8' // General Oncology Initial
    },
    {
      programUuid: '88566621-828f-4569-9af5-c54f8237750a', // Breast Cancer Treatment Program
      initialEncounterUuid: '9ad5292c-14c3-489b-9c14-5f816e839691' // Breast Cancer Initial
    },
    {
      programUuid: 'e48b266e-4d80-41f8-a56a-a8ce5449ebc6', // Sickle Cell Program
      initialEncounterUuid: 'ba5a15eb-576f-496b-a58d-e30b802a5da5' // Sickle Cell Initial
    },
    {
      programUuid: 'a3610ba4-9811-46b3-9628-83ec9310be13', // Hemophilia Program
      initialEncounterUuid: '3945005a-c24f-478b-90ec-4af84ffcdf6b' // Hemophilia Initial
    },
    {
      programUuid: '698b7153-bff3-4931-9638-d279ca47b32e', // Multiple Myeloma Program
      initialEncounterUuid: 'bf762b3e-b60a-436a-a40b-f874c59869ec' // Multiple Myeloma Initial
    },
    {
      programUuid: '418fe011-a903-4862-93d4-5e7c84d9c253', // Anticoagulation Program
      initialEncounterUuid: '4a7450b1-f720-4a0c-b13b-d8a6a83348ee' // Anticoagulation Initial
    }
  ];

  let initialOncologyEncounters = [];
  let initialEncounterType = oncologyProgramEncounterTypeMap.find(
    (e) => e.programUuid === programUuid
  );

  if (initialEncounterType) {
    initialOncologyEncounters = _.filter(encounters, (encounter) => {
      return (
        initialEncounterType.initialEncounterUuid ===
        encounter.encounterType.uuid
      );
    });
  }
  return initialOncologyEncounters.length === 0;
}

function buildHTSScopeMembers(
  scope,
  patientEncounters,
  isHtsPatientNegative,
  dataDictionary
) {
  const HTS_ENCOUNTER_TYPES = {
    SCREENING: '82749926-63b1-467b-9d41-453c7542678a',
    INITIAL: 'ae9693ff-d341-4997-8166-fa46ac4d38f4',
    RETEST: '16bac581-5a17-43f2-9315-3e12a1f3189a',
    LINKAGE: 'fbb106cf-d24f-4917-b905-42db7549a788',
    REFERRAL: '55c10a7a-2732-4063-be25-68d5e1bce1fc'
  };
  const visitDate = Moment(dataDictionary.visitDate).format('YYYY-MM-DD');

  const today = dataDictionary.retroSpective
    ? visitDate
    : Moment().startOf('day');

  const isFromPreviousDate = (encounter) => {
    const encounterDate =
      encounter?.encounterDatetime &&
      Moment(encounter.encounterDatetime).startOf('day');
    return encounterDate ? encounterDate.isBefore(today) : false;
  };

  const getLatestEncounterOfType = (encounters, encounterTypeUuid) =>
    encounters
      ?.filter(({ encounterType }) => encounterType?.uuid === encounterTypeUuid)
      .sort(
        (a, b) =>
          Moment(b.encounterDatetime).valueOf() -
          Moment(a.encounterDatetime).valueOf()
      )[0];

  scope.hasHTSEncounters =
    patientEncounters?.some(({ encounterType }) =>
      Object.values(HTS_ENCOUNTER_TYPES).includes(encounterType?.uuid)
    ) || false;

  if (!scope.hasHTSEncounters) {
    scope.showOnlyHTSScreening = true;
    scope.showHTSRetestToConfirmP = true;
    return scope;
  }

  const latestScreening = getLatestEncounterOfType(
    patientEncounters,
    HTS_ENCOUNTER_TYPES.SCREENING
  );
  const latestInitial = getLatestEncounterOfType(
    patientEncounters,
    HTS_ENCOUNTER_TYPES.INITIAL
  );
  const latestRetest = getLatestEncounterOfType(
    patientEncounters,
    HTS_ENCOUNTER_TYPES.RETEST
  );

  const hasOldScreening =
    latestScreening && isFromPreviousDate(latestScreening);
  const hasOldInitial = latestInitial && isFromPreviousDate(latestInitial);
  const hasScreeningToday =
    latestScreening && !isFromPreviousDate(latestScreening);
  const hasInitialToday = latestInitial && !isFromPreviousDate(latestInitial);
  const hasRetestToday = latestRetest && !isFromPreviousDate(latestRetest);

  if (isHtsPatientNegative && hasInitialToday) {
    scope.showOnlyHTSINITIAL = true;
    return scope;
  }

  if (!hasScreeningToday) {
    scope.showOnlyHTSScreening = true;
    scope.isFirstHTSNewRetestVisit = true;
  } else if (hasScreeningToday && !hasInitialToday) {
    scope.showOnlyHTSINITIAL = true;
    scope.isFirstHTSNewRetestVisit = false;
  } else if (hasInitialToday && !hasRetestToday) {
    scope.showOnlyHTSRetest = true;
  } else if (hasRetestToday) {
    scope.showOthersHTSEncounters = true;
  } else {
    scope.showOnlyHTSScreening = true;
  }

  return scope;
}

function buildProgramScopeMembers(scope, programEnrollment) {
  if (
    programEnrollment &&
    programEnrollment.location &&
    programEnrollment.location.uuid
  ) {
    scope.programLocation = programEnrollment.location.uuid;
  }

  if (programEnrollment && programEnrollment.states) {
    const states = programEnrollment.states;
    const currentState = states.filter((state) => state.endDate === null);

    if (currentState.length > 0) {
      const state = currentState[0].state;
      scope.inCareUuid = state.concept.uuid;
    }
  }
}

function buildHivScopeMembers(
  scope,
  patientEncounters,
  intendedVisitLocationUuid
) {
  scope.isFirstPrEPVisit = isInitialPrepVisit(patientEncounters);
  scope.isFirstPEPVisit = isInitialPepVisit(patientEncounters);
  scope.isFirstPMTCTVisit = isInitialPMTCTVisit(patientEncounters);
  scope.isFirstAMPATHHIVVisit = !isInitialHivVisit(patientEncounters);
  scope.previousHIVClinicallocation = getPreviousHIVClinicallocation(
    patientEncounters
  );
  scope.isPrepConsentFilled = checkPrepStudyConsent(patientEncounters);
  scope.isFirstKVPVisit = isInitialKVPVisit(patientEncounters);
}

function buildOncologyScopeMembers(scope, patientEncounters, programUuid) {
  scope.isFirstOncologyVisit = isInitialOncologyVisit(
    patientEncounters,
    programUuid
  );
}
function buildMNCHScopeMembers(scope, patientEncounters, programEnrollment) {
  // If the client has not exited the antenatal program show return visit if they have an initial encounter

  scope.isFirstANCVisit = isInitialVisit(
    patientEncounters,
    programEnrollment,
    '52aeb285-fb18-455b-893e-3e53ccc77ceb',
    'f5702679-6a16-43bd-8629-4b44c7a78ff1',
    '8d5b27bc-c2cc-11de-8d13-0010c6dffd0f'
  );
  scope.isFirstPNCVisit = isInitialVisit(
    patientEncounters,
    programEnrollment,
    'd2552058-d7bd-47c6-aed1-480a4308027a',
    'ded4ecf7-8129-4a9e-8aa3-a21a7adb7759',
    '8d5b27bc-c2cc-11de-8d13-0010c6dffd0f'
  );
}
function isInitialHivVisit(patientEncounters) {
  const adultInitial = '8d5b27bc-c2cc-11de-8d13-0010c6dffd0f';
  const youthInitial = 'fc8c1694-90fc-46a8-962b-73ce9a99a78f';
  const pedsInitial = '8d5b2dde-c2cc-11de-8d13-0010c6dffd0f';
  const adultReturn = '8d5b2be0-c2cc-11de-8d13-0010c6dffd0f';
  const youthReturn = '4e7553b4-373d-452f-bc89-3f4ad9a01ce7';
  const pedsReturn = '8d5b3108-c2cc-11de-8d13-0010c6dffd0f';

  const initialEncounters = [
    youthInitial,
    adultInitial,
    pedsInitial,
    adultReturn,
    youthReturn,
    pedsReturn
  ];
  const hasInitial = patientEncounters.some((e) => {
    const encounterType = e?.encounterType?.uuid;
    return initialEncounters.some((i) => {
      return i === encounterType;
    });
  });
  return hasInitial;
}

function getSpecificEncounterTypesFromEncounters(
  encountersArray,
  encounterTypeUuid
) {
  return _.filter(encountersArray, (encounter) => {
    return encounter.encounterType.uuid === encounterTypeUuid;
  });
}

function getLatestEncounter(encountersArray) {
  const orderedEncounters = encountersArray.sort((a, b) => {
    const dateA = new Date(a.encounterDatetime);
    const dateB = new Date(b.encounterDatetime);
    return dateB - dateA;
  });

  const latestEncounter = orderedEncounters[0];

  return latestEncounter;
}
