(function () {
  var rp = require('request-promise');
  var _ = require('underscore');
  var Promise = require('bluebird');
  var config = require('../../conf/config');
  var requestConfig = require('../../request-config');

  var openmrsProtocal = config.openmrs.https ? 'https' : 'http';
  var appName = config.openmrs.applicationName || 'amrs';
  var openmrsBase =
    openmrsProtocal +
    '://' +
    config.openmrs.host +
    ':' +
    config.openmrs.port +
    '/' +
    appName;

  var serviceDefinition = {
    getPatientByUuid: getPatientByUuid,
    getPatientByIdentifier: getPatientByIdentifier,
    getPatientUuidsByIdentifiers: getPatientUuidsByIdentifiers,
    getLatestEncounterFromMostRecentCohortVisit: getLatestEncounterFromMostRecentCohortVisit
  };

  function getPatientByUuid(patientUuid, params) {
    var endPoint = '/ws/rest/v1/patient/' + patientUuid;

    var requestParam = {
      v: params.rep || 'default'
    };

    var url = (params.openmrsBaseUrl || openmrsBase) + endPoint;

    return new Promise(function (resolve, reject) {
      requestConfig
        .getRequestPromise(requestParam, url)
        .then(function (data) {
          resolve(data);
        })
        .catch(function (err) {
          reject(err);
        });
    });
  }

  function getPatientByIdentifier(params) {
    var endPoint = '/ws/rest/v1/patient';

    var requestParam = {
      q: params.q,
      v: params.rep || 'default'
    };

    var url = (params.openmrsBaseUrl || openmrsBase) + endPoint;

    return new Promise(function (resolve, reject) {
      requestConfig
        .getRequestPromise(requestParam, url)
        .then(function (data) {
          resolve(data.results);
        })
        .catch(function (err) {
          reject(err);
        });
    });
  }

  function getPatientUuidsByIdentifiers(identifiersArray, baseUrl) {
    var results = [];
    return Promise.reduce(
      identifiersArray,
      function (previous, identifier) {
        return new Promise(function (resolve, reject) {
          _getPatientUuidByIdentifier(identifier, baseUrl)
            .then(function (value) {
              console.error(
                identifier + ' ' + value.patientUuid + ' reduced to',
                results.length
              );
              if (value.patientUuid) {
                results.push(value);
              }
              resolve(results);
            })
            .catch(function (error) {
              resolve(results);
            });
        });
      },
      0
    );
  }

  function _getPatientUuidByIdentifier(identifier, baseUrl) {
    var param = {
      q: identifier,
      openmrsBaseUrl: baseUrl
    };
    return new Promise(function (resolve, reject) {
      getPatientByIdentifier(param)
        .then(function (response) {
          if (Array.isArray(response)) {
            resolve({
              identifier: identifier,
              patientUuid: response.length > 0 ? response[0].uuid : ''
            });
          } else {
            throw ('Invalid response', response);
          }
        })
        .catch(function (error) {
          console.error('getPatientByIdentifier error', error);
          resolve({
            identifier: identifier,
            hasError: true
          });
        });
    });
  }

  function getLatestEncounterFromMostRecentCohortVisit(patientUuid, params) {
    const endPoint = '/ws/rest/v1/cohortm/cohortmember/';
    const requestParam = {
      patient: patientUuid,
      v: 'custom:(cohort:(cohortVisits))'
    };

    const url = (params?.openmrsBaseUrl || openmrsBase) + endPoint;

    return new Promise(function (resolve, reject) {
      requestConfig
        .getRequestPromise(requestParam, url)
        .then(function (data) {
          try {
            const cohortVisits = data.results.flatMap(
              (result) => result.cohort?.cohortVisits || []
            );

            if (cohortVisits.length === 0) {
              resolve(null);
              return;
            }

            const today = new Date();
            const todayDateString = today.toISOString().split('T')[0];

            const previousVisits = cohortVisits.filter((visit) => {
              const visitDate = new Date(visit.startDate);
              const visitDateString = visitDate.toISOString().split('T')[0];
              return visitDateString !== todayDateString;
            });

            if (previousVisits.length === 0) {
              resolve(null);
              return;
            }

            const mostRecentPreviousVisit = previousVisits.sort(
              (a, b) => new Date(b.startDate) - new Date(a.startDate)
            )[0];

            resolve(mostRecentPreviousVisit);
          } catch (error) {
            reject(`Error processing cohort data: ${error}`);
          }
        })
        .catch(function (err) {
          reject(`API request failed: ${err}`);
        });
    });
  }

  module.exports = serviceDefinition;
})();
