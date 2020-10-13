(function () {
  var rp = require('../../request-config');
  var _ = require('underscore');
  var Promise = require('bluebird');
  var config = require("../../conf/config");

  var serviceDefinition = {
    getPatientVisits: getPatientVisits
  };



  function getPatientVisits(patientUuid) {
    var uri = getBaseUrl();
    var queryString = {
      v: 'custom:(uuid,startDatetime,stopDatetime)',
      patient: patientUuid
    }
    return new Promise(function (resolve, reject) {
      rp.getRequestPromise(queryString, uri)
        .then(function (response) {
          resolve(response.results);
        })
        .catch(function (error) {
          reject(error);
        })
    });
  
  
  }

  function getBaseUrl() {
    var link = config.openmrs.host + ':' + config.openmrs.port + '/' + config.openmrs.applicationName + '/ws/rest/v1/visit';
    if (config.openmrs.https === true) {
      link = 'https://' + link;
    } else {
      link = 'http://' + link;
    }
    return link;
  }

  module.exports = serviceDefinition;
})();

