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
    isViremicHighVL: false
  };
  let isStandardDcVisit = false;

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
    'cb4a90fd-28b8-4c01-b15c-242ff5e5e731'
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
      'cb4a90fd-28b8-4c01-b15c-242ff5e5e731'
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

function isInitialPrepVisit(patientEncounters) {
  const initialPrEPEncounterUuid = '00ee2fd6-9c95-4ffc-ab31-6b1ce2dede4d';

  let initialPrEPEncounters = _.filter(patientEncounters, (encounter) => {
    return encounter.encounterType.uuid === initialPrEPEncounterUuid;
  });

  return initialPrEPEncounters.length === 0;
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
