const Promise = require('bluebird');
var config = require('../conf/config.json');
var rp = require('../request-config');

export class PatientPrograms {
  getRestResource = (path) => {
    var protocol = config.openmrs.https ? 'https' : 'http';
    var link =
      protocol + '://' + config.openmrs.host + ':' + config.openmrs.port + path;
    return link;
  };

  getPatientPrograms = (patient) => {
    var uri = this.getRestResource(
      '/' + config.openmrs.applicationName + '/ws/rest/v1/programenrollment'
    );
    var queryString = {
      patient: patient.patientUuid,
      v: 'full'
    };
    return new Promise((resolve, reject) => {
      rp.getRequestPromise(queryString, uri)
        .then(function (data) {
          resolve(data);
        })
        .catch(function (err) {
          reject(err);
        });
    });
  };

  async isPatientEnrolledInPrep(patient) {
    let enrolledToPrep = false;
    await this.getPatientPrograms(patient).then((programs) => {
      _.each(programs.results, (p) => {
        if (
          p != null &&
          p.program.uuid === 'c19aec66-1a40-4588-9b03-b6be55a8dd1d'
        ) {
          enrolledToPrep = true;
        }
      });
    });
    return enrolledToPrep;
  }
}
