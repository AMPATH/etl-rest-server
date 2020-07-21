(function() {
    'use strict';

    var dao = require('../etl-dao');
    var _ = require('underscore');
    var moment = require('moment');
    var utils = require('./utils.js');
    var math = require('math');

    var DEFAULT_NO_NOTES = 40;
    var TB_PROPHY_PERIOD = 6; // In months.
    var CONCEPT_UUIDS = {
        CUR_TB_TX_DETAILED: 'a8afdb8c-1350-11df-a1f1-0026b9348838',
        CUR_TB_TX: 'a899e444-1350-11df-a1f1-0026b9348838',
        TB_TX_DRUG_STARTED_DETAILED: 'a89fe6f0-1350-11df-a1f1-0026b9348838',
        TB_TX_PLAN: 'a89c1fd4-1350-11df-a1f1-0026b9348838',
        CC_HPI: 'a89ffbf4-1350-11df-a1f1-0026b9348838',
        ASSESSMENT: '23f710cc-7f9c-4255-9b6b-c3e240215dba',
        TB_PROPHY_PLAN: 'a89c1cfa-1350-11df-a1f1-0026b9348838',
        S1COGNITIVE_BARRIERS: '28026dea-3b8d-4d70-9d16-cf40a7f0692c',
        S1BEHAVIORAL_BARRIERS: 'ed60ef1e-663e-4034-91ff-8d2e601e0fdc',
        S1EMOTIONAL_BARRIERS: '276f872a-34b4-4bf0-b57c-3d912c4720a4',
        S1ECONOMIC_BARRIERS: '5c941db9-4a23-411d-8517-f60e8b7e459d',
        S1ADHERENCE_PLAN: 'b951337b-21c0-4b6f-81a4-24f10e9c5819',
        S2REVIEW_ADHERENCE_PLAN: 'b6741855-f9e0-456c-ac50-e864638cccd1',
        S2NEW_ISSUES: 'e3162a57-0ad3-4d9d-9aca-dfbf74762075',
        S2REFERRALS_FOLLOWUP: 'f0949b84-f742-4364-a5fc-ecdd9d3c0a07',
        S2ADHERENCE_PLAN: '984b1200-c5ec-41f9-8e76-1d894312eb41',
        S3REVIEW_ADHERENCE_PLAN: 'a486c342-fa15-4965-bbad-ff5c312deeae',
        S3NEW_ISSUES: '2ea6f19b-ba12-4d98-8b96-0b3977093899',
        S3REFERRALS_FOLLOWUP: 'e7517430-55a4-4673-9d17-736fc1445aaa',
        S3ADHERENCE_PLAN: 'cb7eaa9d-a3b1-4f68-8d29-fd2be936be33',
        S3REPEAT_VIRAL_LOAD: '08d99781-41c2-42a1-b8bc-d50b3c84e5d5',
        S4DISCUSS_VIRAL_LOAD: 'abb4c3f3-2a2f-4736-96e0-5b9cf63cd6b2',
        OTHER_ASSESSMENT: '5e4dc798-2cce-4a1a-97e9-bcf22d64b07c',
    };

    var encOrder = {
        2: 1, // ADULTRETURN
        1: 10, // ADULTINITIAL
        4: 1, // PEDSRETURN
        3: 10, // PEDSINITIAL
        110: 20, // TRIAGE
        99999: 30, // Special Lab encounter code
        21: 40, // OUTREACHFIELDFU
        17: 50, // ECSTABLE
        117: 1, // RESISTANCECLINIC
        other: 100 // Any other encounter
    };

    var generateNotes = function(encounters, hivSummaries, vitals, endDate) {

        // Make endDate today if not specified
        if (endDate) {
            if (typeof endDate === 'string') {
                try {
                    endDate = Date.parse(endDate);
                } catch (error) {
                    console.log(error);
                }
            }
        } else {
            endDate = moment();
        }

        // Set startIndex to 0 if not passed
        var startIndex = startIndex || 0;

        // Limit to DEFAULT_NO_NOTES notes if not specified
        // (i.e DEFAULT_NO_NOTES encounters going backward)
        var limit = limit || DEFAULT_NO_NOTES;

        if (!hivSummaries || _.isEmpty(hivSummaries)) {
            throw new Error('No summaries returned');
        } else {
            // TODO: Need to determine whether it is wise to fail if others are
            // not available as well.
            var hivModels = hivSummaries;

            // Group the summaries based on date
            var summaryDateGrouped = {};
            _.each(hivModels, function(model) {
                var key = moment(model.encounter_datetime).format('MMM_DD_YYYY');
                model.ordering = encOrder[model.encounter_type] || encOrder.other;
                if (Array.isArray(summaryDateGrouped[key])) {
                    summaryDateGrouped[key].push(model);
                } else {
                    summaryDateGrouped[key] = [model];
                }
            });

            // Sort the groups according to ordering column
            _.each(summaryDateGrouped, function(group) {
                group.sort(function compare(x, y) {
                    return x.ordering - y.ordering;
                });
            });

            // Now pick the most preferred encounter in every group.
            var massagedHivModels = _.map(summaryDateGrouped, function(group) {
                return _.first(group);
            });

            // Deal with vitals.
            var vitalDateGrouped = {};
            if (vitals && !_.isEmpty(vitals)) {
                var vitalModels = vitals;

                // Create a date grouped representation

                _.each(vitalModels, function(model) {
                    var key = moment(model.encounter_datetime).format('MMM_DD_YYYY');
                    vitalDateGrouped[key] = model;
                });
            }

            // Deal with encounters
            var encDateGrouped = {};
            if (encounters && !_.isEmpty(encounters)) {
                // Group encounters by date
                _.each(encounters, function(encounter) {
                    var key = moment(encounter.encounterDatetime).format('MMM_DD_YYYY');
                    if (Array.isArray(encDateGrouped[key])) {
                        encDateGrouped[key].push(encounter);
                    } else {
                        encDateGrouped[key] = [encounter];
                    }
                });
            }

            // Generate notes for each Hiv summary date.
            var notes = [];
            for (var dateKey in summaryDateGrouped) {
                var note = generateNote(_.first(summaryDateGrouped[dateKey]),
                    vitalDateGrouped[dateKey], encDateGrouped[dateKey]);
                notes.push(note);
            }
            return notes;
        }
    }

    /**
     * This method will try to generate note for available data, i.e it won't
     * fail because one of the expected data object is null
     */
    function generateNote(hivSummary, vitals, encounters) {
        
        var noInfo = '';
        var note = {
            visitDate: hivSummary.encounter_datetime,
            scheduled: hivSummary.scheduled_visit,
            providers: [],
            lastViralLoad: {
                value: hivSummary.vl_1,
                date: hivSummary.vl_1_date,
            },
            lastCD4Count: {
                value: hivSummary.cd4_1,
                date: hivSummary.cd4_1_date
            },
            artRegimen: {
                curArvMeds: noInfo,
                curArvLine: noInfo,
                startDate: noInfo
            },
            tbProphylaxisPlan: {
                plan: noInfo,
                startDate: noInfo,
                estimatedEndDate: noInfo
            },
            ccHpi: [],
            assessment: [],
            otherAssessment: [],
            vitals: {
                weight: noInfo,
                height: noInfo,
                bmi: noInfo,
                temperature: noInfo,
                oxygenSaturation: noInfo,
                systolicBp: noInfo,
                diastolicBp: noInfo,
                pulse: noInfo
            },
            rtcDate: hivSummary.rtc_date
        };

        if (vitals && !_.isEmpty(vitals)) {
            // Calculate BMI
            var bmi = noInfo;
            try {
                bmi = math.round(utils.calculateBMI(vitals.weight, vitals.height), 1);
            } catch (err) {
                // Do nothing
            }

            note.vitals = {
                weight: vitals.weight,
                height: vitals.height,
                bmi: bmi,
                temperature: vitals.temp,
                oxygenSaturation: vitals.oxygen_sat,
                systolicBp: vitals.systolic_bp || '',
                diastolicBp: vitals.diastolic_bp || '',
                pulse: vitals.pulse
            };
        }

        //Get the providers & regimens
        if (Array.isArray(encounters) && !_.isEmpty(encounters)) {
            note.providers = _getProviders(encounters);

            // Get CC/HPI & Assessment
            note.ccHpi = _findTextObsValue(encounters, CONCEPT_UUIDS.CC_HPI,
                __findObsWithGivenConcept);

            // Sort ccHpi per obsDatetime
            note.ccHpi.sort(function(ccHpi1, ccHpi2) {
                return ccHpi1 ? moment(ccHpi1.obsDatetime).diff(ccHpi2.obsDatetime) : null;
            });

            note.assessment = _findTextObsValue(encounters, CONCEPT_UUIDS.ASSESSMENT,
                __findObsWithGivenConcept);

            // Get EAC Session 1 notes
            note.s1CognitiveBarriers = _findTextObsValue(encounters, CONCEPT_UUIDS.S1COGNITIVE_BARRIERS,
                __findObsWithGivenConcept);

            note.s1BehavioralBarriers = _findTextObsValue(encounters, CONCEPT_UUIDS.S1BEHAVIORAL_BARRIERS,
                __findObsWithGivenConcept);

            note.s1EmotionalBarriers = _findTextObsValue(encounters, CONCEPT_UUIDS.S1EMOTIONAL_BARRIERS,
                __findObsWithGivenConcept);

            note.s1EconomicBarriers = _findTextObsValue(encounters, CONCEPT_UUIDS.S1ECONOMIC_BARRIERS,
                __findObsWithGivenConcept);

            note.s1AdherencePlan = _findTextObsValue(encounters, CONCEPT_UUIDS.S1ADHERENCE_PLAN,
                __findObsWithGivenConcept);

            note.s2AdherencePlan = _findTextObsValue(encounters, CONCEPT_UUIDS.S2ADHERENCE_PLAN,
                __findObsWithGivenConcept);

            note.s2NewIssues = _findTextObsValue(encounters, CONCEPT_UUIDS.S2NEW_ISSUES,
                __findObsWithGivenConcept);

            note.s2ReferralsFollowup = _findTextObsValue(encounters, CONCEPT_UUIDS.S2REFERRALS_FOLLOWUP,
                __findObsWithGivenConcept);

            note.s2ReviewAdherencePlan = _findTextObsValue(encounters, CONCEPT_UUIDS.S2REVIEW_ADHERENCE_PLAN,
                __findObsWithGivenConcept);

            note.s3AdherencePlan = _findTextObsValue(encounters, CONCEPT_UUIDS.S3ADHERENCE_PLAN,
                __findObsWithGivenConcept);

            note.s3NewIssues = _findTextObsValue(encounters, CONCEPT_UUIDS.S3NEW_ISSUES,
                __findObsWithGivenConcept);

            note.s3ReferralsFollowup = _findTextObsValue(encounters, CONCEPT_UUIDS.S3REFERRALS_FOLLOWUP,
                __findObsWithGivenConcept);

            note.s3RepeatViralLoad = _findTextObsValue(encounters, CONCEPT_UUIDS.S3REPEAT_VIRAL_LOAD,
                __findObsWithGivenConcept);

            note.s3ReviewAdherencePlan = _findTextObsValue(encounters, CONCEPT_UUIDS.S3REVIEW_ADHERENCE_PLAN,
                __findObsWithGivenConcept);

            note.s4DiscussViralLoad = _findTextObsValue(encounters, CONCEPT_UUIDS.S4DISCUSS_VIRAL_LOAD,
                __findObsWithGivenConcept);

            // if(note.s1CognitiveBarriers) {
            //     console.log('NOTES: ', note);
            // }    

            // Sort assessment
            note.assessment.sort(function(ass1, ass2) {
                return moment(ass1.obsDatetime).diff(ass2.obsDatetime);
            });
            note.otherAssessment = _findTextObsValue(encounters, CONCEPT_UUIDS.OTHER_ASSESSMENT,
                __findObsWithGivenConcept);
            // Sort assessment
            note.otherAssessment.sort(function(ass1, ass2) {
                return moment(ass1.obsDatetime).diff(ass2.obsDatetime);
            });

            // Get TB prophylaxis
            note.tbProphylaxisPlan = _constructTBProphylaxisPlan(encounters, hivSummary,
                __findObsWithGivenConcept);

        } else {
            console.log('encounters array is null or empty');
        }

        // Get ART regimen
        if (!_.isEmpty(hivSummary.cur_arv_meds)) {
            // Just use the stuff from Etl
            note.artRegimen = {
                curArvMeds: hivSummary.cur_arv_meds,
                curArvLine: hivSummary.cur_arv_line,
                arvStartDate: hivSummary.arv_start_date
            };
        } else {
            // TODO: Try getting it from encounters.
        }

        return note;
    }

    function _getProviders(openmrsEncounters) {
        var providers = [];
        _.each(openmrsEncounters, function(encModel) {
            var encounterType = encModel.encounterType || {};
            if (encModel.encounterProviders) {
                var multipleProviderPerEncounter =
                    __getProvidersFromEncounterProviders(encModel.encounterProviders,
                        encounterType);
                Array.prototype.push.apply(providers, multipleProviderPerEncounter);
            } else {
                // most likely defined as provider
                var providerObject = encModel.provider || {}; // Staying on safe
                var provider = {
                    uuid: providerObject.uuid || '',
                    name: providerObject.display || '',
                    encounterType: encounterType.display || ''
                };
                if (providerObject.person) {
                    provider.name = providerObject.person.display || provider.name;
                }
                providers.push(provider);
            }
        });

        return _.uniq(providers, false, function(provider) {
            return provider.uuid + provider.encounterType;
        });

        // ****This function is defined within _getProviders function
        function __getProvidersFromEncounterProviders(encProviders, encType) {
            var _providers = [];
            _.each(encProviders, function(encProvider) {
                var provider = encProvider.provider;
                var providerRep = {
                    uuid: provider.uuid || '',
                    name: provider.display || '',
                    encounterType: encType.display || ''
                };
                if (provider.person) {
                    //Update provider name
                    providerRep.name = provider.person.display || providerRep.name;
                }
                _providers.push(providerRep);
            });
            return _providers;
        }
    }

    /*
     * TODO: Make this recursive to be able to search deeper than one level
     */
    function __findObsWithGivenConcept(obsArray, conceptUuid, grouper) {
        var grouper = grouper || false;
        var found = null;
        if (grouper) {
            found = [];
            _.each(obsArray, function(obs) {
                if (obs.groupMembers !== null && obs.concept !== null && obs.concept.uuid === conceptUuid) {
                    found.push(obs);
                }
            });
        } else {
            // Non grouper concepts
            found = _.find(obsArray, function(obs) {
                return (obs.concept !== null && obs.concept.uuid === conceptUuid);
            });
        }
        return found;
    }

    function _findTextObsValue(encArray, conceptUuid, obsfinder) {
        var values = [];

        _.each(encArray, function(enc) {
            var ret = obsfinder(enc.obs, conceptUuid);
            if (ret !== null && !_.isEmpty(ret)) {
                var value = {
                    obsDatetime: ret.obsDatetime || enc.encounterDatetime,
                    encounterType: enc.encounterType.display || '',
                    value: ret.value
                };
                values.push(value);
            }
        });
        return values;
    }

    /**
     * Algorithm:
     * -> Check for existence of tb prophylaxis plan, if found and plan is
     *    continue or start then report and fetch start date.
     * -> if plan is stop then see calculate the duration the patient was on
     *    prophylaxis and fetch reason if available.
     * -> if it is to change the fetch the reasone.
     */
    function _constructTBProphylaxisPlan(encArray, hivSummary, obsfinder) {
        // Find plan.
        var tbProphy = {
            plan: 'Not available',
            estimatedEndDate: 'Unknown',
        };
        var planConceptUuid = CONCEPT_UUIDS.TB_PROPHY_PLAN;
        var found = null;

        _.find(encArray, function(enc) {
            found = obsfinder(enc.obs, planConceptUuid);
            return found !== null && !_.isEmpty(found);
        });

        if (found) {
            tbProphy.plan = found.value.display;
        }

        // Calculate estimated end date of plan (6 months after starting)
        var tempDate = moment(hivSummary.tb_prophylaxis_start_date);
        if (tempDate.isValid()) {
            tbProphy.startDate = hivSummary.tb_prophylaxis_start_date;
            tbProphy.estimatedEndDate =
                moment(hivSummary.tb_prophylaxis_start_date)
                .add(TB_PROPHY_PERIOD, 'months')
                .toDate().toISOString();
        } else {
            tbProphy.startDate = 'Not available';
            tbProphy.estimatedEndDate = 'N/A';
        }
        return tbProphy;
    }

    module.exports = {
        generateNote: generateNote,
        generateNotes: generateNotes
    };
})();
