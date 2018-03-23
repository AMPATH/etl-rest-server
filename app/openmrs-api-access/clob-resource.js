var rp = require('request-promise');
var _ = require('underscore');
var Promise = require('bluebird');
var config = require("../config/config.service");
var requestConfig = require('../../request-config');
var fs = require("fs");
import ConfigService from '../config/config.service';

var openmrsProtocal = ConfigService.getConfig().openmrs.https ? 'https' : 'http';
var appName = ConfigService.getConfig().applicationName || 'amrs';
var openmrsBase = openmrsProtocal + '://' + ConfigService.getConfig().openmrs.host + ':'
    + ConfigService.getConfig().openmrs.port + '/' + appName;

var serviceDefinition = {
    getReportStoreClobDataByUuid: getReportStoreClobDataByUuid,
    uploadReportSchemaToAMRS: uploadReportSchemaToAMRS
};
var authorizationHeader = '';

module.exports = serviceDefinition;

function getReportStoreClobDataByUuid(clobUuid) {
    var endPoint = '/ws/rest/v1/clobdata/' + clobUuid;

    var queryString = {
        v: 'full'
    };

    var url = ( openmrsBase) + endPoint;

    return new Promise(function (resolve, reject) {
        requestConfig.getRequestPromise(queryString, url)
            .then(function (data) {
                resolve(data);
            })
            .catch(function (err) {
                reject(err);
            });
    });

}

function uploadReportSchemaToAMRS() {

    return new Promise(function (resolve, reject) {
        var endPoint = '/ws/rest/v1/clobdata' ;
        var options = {
            headers: {
                'authorization' : authorizationHeader
            }
        };
        var req = rp.post( openmrsBase + endPoint,options);
        var form = req.form();
        form.append('file', fs.createReadStream("buffer"), {
            filename: 'file',
            contentType: 'application/json'

        });

        resolve( req);
    }).catch((error) => {

            reject(error);
        });

}

