(function () {
  var rp = require('../../request-config');
  var _ = require('underscore');
  var Promise = require('bluebird');
  var config = require("../../conf/config");

  var serviceDefinition = {
      getPersonAttributes: getPersonAttributes
  };



  function getPersonAttributes(patientUuid) {
  
    var uri = getBaseUrl() + '/' + patientUuid;
    var queryString = {
      v: 'custom:(attributes:(uuid,display,value,attributeType:(uuid,display))'
    }
    return new Promise(function (resolve, reject) {
      rp.getRequestPromise(queryString, uri)
        .then(function (response) {
          resolve(response.attributes);
        })
        .catch(function (error) {
          reject(error);
        })
    });
  
  }

  function getBaseUrl() {
    var link = config.openmrs.host + ':' + config.openmrs.port + '/' + config.openmrs.applicationName + '/ws/rest/v1/person';
    if (config.openmrs.https === true) {
      link = 'https://' + link;
    } else {
      link = 'http://' + link;
    }
    return link;
  }

  module.exports = serviceDefinition;
})();

