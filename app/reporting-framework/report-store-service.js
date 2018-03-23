/*jshint -W003, -W097, -W117, -W026 */
'use strict';

var Promise = require('bluebird');
var squel = require('squel');
var _ = require('underscore');
_ = require('lodash');
var moment = require('moment');
var connection = require('../../dao/connection/mysql-connection-service');
var authorizer = require('../../authorization/etl-authorizer');
var clobResourceService = require('../openmrs-api-access/clob-resource');
import MysqlConnectionService from '../database-access/mysql-connection.service';
import QueryService from '../database-access/query.service';

var def = {
    getReportStore: getReportStore,
    voidReportStore: voidReportStore,
    updateReportStore: updateReportStore,
    createReportStore: createReportStore,
    getReportStoreByNameAndVersion: getReportStoreByNameAndVersion,
    getReportStoreByName:getReportStoreByName,
    fetchReportSchema:fetchReportSchema,
    createReportStoreVersionIds:createReportStoreVersionIds
};

module.exports = def;

function getReportStore(reportStoreId) {
    var runner = getSqlRunner();
    return new Promise(function (resolve, reject) {
        var query = squel.select()
            .field('rs.report_store_id')
            .field('rs.name')
            .field('rs.voided')
            .field('rs.version')
            .field('rs.published')
            .field('rs.clob_uuid')
            .from('etl.report_store', 'rs')
            .where('rs.report_store_id = ?', reportStoreId)
            .toString();
        runner.executeQuery(query)
            .then((results) => {
                resolve( results);
            })
            .catch((error) => {
                reject(error)
            });

    })
        .catch((error)=>{

        });
}

function voidReportStore(ReportStoreId) {
    var runner = getSqlRunner();
    var query = squel.update()
        .table('etl.report_store')
        .set('voided', 1)
        .set('date_voided', squel.fval('NOW()'))
        .set('voided_by', getCurrentUserIdSquel())
        .where('report_store_id = ?', ReportStoreId)
        .toString();
        return new Promise(function (resolve, reject) {
            runner.executeQuery(query)
                .then((results) => {
                    resolve( results);
                })
                .catch((error) => {
                    reject(error)
                });

    }).catch((error) =>{

        })  ;

}

function createReportStore(newReportStore) {
    return new Promise(function (resolve, reject) {
        var requiredFieldsCheck = hasRequireReportStoreFields(newReportStore);

        if (!requiredFieldsCheck.isValid) {
            return reject(requiredFieldsCheck);
        }
                validateCreatePayload(newReportStore)
                    .then(function (validationStatus) {
                        if (validationStatus.isValid === false) {
                            reject(validationStatus);
                        } else {


                                var runner = getSqlRunner();
                                var query = squel.insert()
                                    .into('etl.report_store')
                                    .set('report_store_id')
                                    .set('name', newReportStore.name)
                                    .set('version', newReportStore.version)
                                    .set('published', 1)
                                    .set('clob_uuid', newReportStore.clob_uuid)
                                    .set('date_created', squel.fval('NOW()'))
                                    .set('creator', getCurrentUserIdSquel())
                                    .set('voided', 0)
                                    .toString();
                                runner.executeQuery(query)
                                    .then((results) => {
                                        resolve( results);
                                    })
                                    .catch((error) => {
                                        reject(error)
                                    });


                        }

                    })
                    .catch((err) => {
                        error(err);
                    });
    });
}

function updateReportStore(reportStoreId, newReportStore) {
    return new Promise(function (resolve, reject) {
        validateUpdatePayload(newReportStore)
            .then(function (validationStatus) {
                if (validationStatus.isValid === false) {
                    reject(validationStatus);
                } else {
                    var runner = getSqlRunner();
                    var query = squel.update()
                        .table('etl.report_store')
                        .set('published', newReportStore.published)
                        .set('date_changed', squel.fval('NOW()'))
                        .set('changed_by', getCurrentUserIdSquel())
                        .where('report_store_id = ?', reportStoreId)
                        .toString();
                    runner.executeQuery(query)
                        .then((results) => {
                            resolve( results);
                        })
                        .catch((error) => {
                            reject(error)
                        });
                }

            })
            .catch((err) => {
                error(err);
            });
    });
}

function findReportStore(clobUuid, voided) {
    return new Promise(function (resolve, reject) {
        var runner = getSqlRunner();
        var query = squel.select()
            .field('rs.report_store_id')
            .field('rs.clob_id')
            .field('rs.name')
            .field('c.uuid')
            .field('rs.voided')
            .from('etl.report_store', 'rs')
            .join('amrs.clob_datatype_storage', 'c', 'rs.clob_uuid = c.uuid')
            .where('rs.clob_uuid = ?', clobUuid)
            .where('rs.voided = ?', voided)
            .toString();
        runner.executeQuery(query)
            .then((results) => {
                resolve( results);
            })
            .catch((error) => {
                reject(error)
            });
    })
        .catch((err) => {
            error(err);
        });
}

function resolveUuidsToIds(reportStorePayload) {

    return new Promise(function (resolve, reject) {
        getClobId(reportStorePayload.clob_uuid)
            .then(function (clobId) {
                reportStorePayload.clob_id = clobId;
                resolve(reportStorePayload);
    
            })
            .catch(function (error) {
                console.error(err);
                reject(error);
            })
    });
}

function getClobId(clobUuid) {
    return new Promise(function (resolve, reject) {
        MysqlConnectionService.getPool()
            .then(function (conn) {
                var query = squel.select()
                    .field('c.id')
                    .from('amrs.clob_datatype_storage', 'c')
                    .where('c.uuid = ?', clobUuid)
                    .toString();

                conn.query(query, {}, function (err, rows, fields) {
                    if (err) {
                        reject('Error querying server');
                    }
                    else {
                        if (rows.length > 0) {
                            resolve(rows[0]['id']);
                        } else {
                            resolve(undefined);
                        }
                    }
                    conn.release();
                });
            })
            .catch(function (err) {
                reject('Error establishing connection to MySql Server');
            });
    });
}

function createReportStoreVersionIds() {
    var runner = getSqlRunner();
    var query = squel.insert()
        .into('etl.report_store_version')
        .set('version_id')
        .set('date_created', squel.fval('NOW()'))
        .set('creator', getCurrentUserIdSquel())
        .toString();
    return new Promise(function (resolve, reject) {
        runner.executeQuery(query)
            .then((results) => {
                resolve( results);
            })
            .catch((error) => {
                reject(error)
            });
    })
        .catch((err) => {
            error(err);
        });

}

function getReportStoreByNameAndVersion(name, version) {
    return new Promise(function (resolve, reject) {
        var runner = getSqlRunner();
        var query = squel.select()
            .field('rs.report_store_id')
            .field('rs.name')
            .field('rs.voided')
            .field('rs.version')
            .field('rs.published')
            .field('rs.clob_uuid')
            .from('etl.report_store', 'rs')
            .where('rs.name = ?', name)
            .where('rs.version = ?', version)
            .toString();
        runner.executeQuery(query)
            .then((results) => {
                resolve( results);
            })
            .catch((error) => {
                reject(error)
            });
    })
    .catch((err) => {
        error(err);
    });
}

function getCurrentUserIdSquel() {
    return squel.select().field('MAX(user_id)')
        .from('amrs.users').where('uuid = ?', authorizer.getUser().uuid);
}


function validateUpdatePayload(reportStorePayload) {
    return new Promise(function (resolve, reject) {
        var validationErrors = {
            isValid: true,
            errors: []
        };

        resolve(validationErrors);
    });
}

function validateCreatePayload(reportStorePayload) {
    return new Promise(function (resolve, reject) {
        var validationErrors = {
            isValid: true,
            errors: []
        };

        if (!reportStorePayload.clob_uuid) {
            validationErrors.isValid = false;
            validationErrors.errors.push({
                field: 'clob',
                error: 'clob does not exist.'
            });
        }

        if (validationErrors.errors.length > 1) {
            return resolve(validationErrors);
        }
        findReportStore(
            reportStorePayload.clob_uuid, 0)
            .then(function (results) {
                if (results.length > 0) {
                    validationErrors.isValid = false;
                    validationErrors.errors.push({
                        field: 'report store details',
                        error: 'Duplicate record exists.'
                    });
                }
                resolve(validationErrors);
            })
            .catch(function (error) {
                reject('An error occured while trying to validate report store  payload',error);
            })
    });
}

function hasRequireReportStoreFields(newReportStorePayload) {
    var validationResult = {
        isValid: true,
        errors: []
    };
    if (_.isEmpty(newReportStorePayload.name)) {
        validationResult.isValid = false;
        validationResult.errors.push({
            field: 'name',
            message: 'name is required'
        });
    }

    if (_.isEmpty(newReportStorePayload.clob_uuid)) {
        validationResult.isValid = false;
        validationResult.errors.push({
            field: 'clob_uuid',
            message: 'clobUuid is required'
        });
    }

    return validationResult;
}

function selectMaxReportVersionPublished(r) {

    return new Promise(function (resolve, reject) {
        var maxId = Math.max.apply(Math, r.map(function(o){

            return o.version }));
       var report = _.filter(r, function(o) {
            if(o.version === maxId)
                return o;
        });
        resolve( report);
    })
    .catch((error) => {

        reject(error);
    })
}

function getReportStoreByName(name) {
    var runner = getSqlRunner();
    var query = squel.select()
        .field('report_store_id')
        .field('rs.name')
        .field('rs.voided')
        .field('rs.version')
        .field('rs.published')
        .field('rs.clob_uuid')
        .from('etl.report_store', 'rs')
        .where('rs.published = ?', 1)
        .where('rs.name = ?', name)
        .toString();

    return new Promise(function (resolve, reject) {
        runner.executeQuery(query)
            .then((results) => {
                selectMaxReportVersionPublished(results)
                    .then((r)=>{
                        resolve( r);
                    })
            })
            .catch((error) => {
                reject(error)
            });
    })
      .catch((error) => {

          reject(error);
      });
}

function getSqlRunner() {
    return new QueryService();
}

function getSubReports(schema) {
    let results = [];

    if (_.isEmpty(schema.uses)) {
        return new Promise(function (resolve, reject) {
            var report = {[schema.name]: schema};
            resolve(report);

        }).catch((error) => {
            reject(error);
        });

    }


    if (schema.uses) {

        _.each(schema.uses, (report) => {
            var reportName = report.name;
            var reportVersion = report.version;
            console.log('reportVersion', reportVersion, reportName);
            if(reportName && reportVersion) {
                results.push( new Promise(function (resolve, reject) {

                    getReportStoreByNameAndVersion(reportName,reportVersion)
                        .then((result) => {
                            console.log('result', result);
                            var uuid = result[0].clob_uuid;
                            console.log('uuid', uuid)
                            clobResourceService.getReportStoreClobDataByUuid(uuid)
                                .then((res) => {
                                    //    console.log('res===',res);
                                    var foundImports = {
                                        [report.name]: res
                                    };
                                    resolve(foundImports);

                                })
                                .catch((error) => {
                                    reject(error)
                                })


                        })

                }));

            }

            else{
                results.push( new Promise(function (resolve, reject) {

                    getReportStoreByName(reportName)
                        .then((result) => {
                            console.log('result', result);
                            var uuid = result[0].clob_uuid;
                            clobResourceService.getReportStoreClobDataByUuid(uuid)
                                .then((res) => {
                                    var foundImports = {
                                        [report.name]: res
                                    };
                                    resolve(foundImports);

                                })
                                .catch((error) =>{
                                    reject(error)
                                })

                        })

                }));

            }




        });

        results.push({
            [schema.name]: schema
        });
        return Promise.all(results)
}

}


function fetchReportSchema(name, version) {

    if(name && version) {
        return new Promise(function (resolve, reject) {
            getReportStoreByNameAndVersion(name, version)
                .then((results) => {
                    var uuid = results[0].clob_uuid;
                    clobResourceService.getReportStoreClobDataByUuid(uuid)
                        .then((res) => {
                            getSubReports(res)
                                .then((r) =>{
                                    resolve( r);
                                });


                        }).catch((error)=>{
                        reject(error)
                    });


                })
                .catch((error) => {
                    reject(error)
                });

        });

    }

     if(name) {
       return new Promise(function (resolve, reject) {
           getReportStoreByName(name)
               .then((results) => {
                   var uuid = results[0].clob_uuid;
                   clobResourceService.getReportStoreClobDataByUuid(uuid)
                       .then((res) => {
                           getSubReports(res)
                               .then((r) =>{
                                   resolve( r);
                               });

                       }).catch((error)=>{
                       reject(error)
                   });


               })
               .catch((error) => {
                   reject(error)
               });

       });
   }



}
