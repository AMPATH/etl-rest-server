var authorizer = require('../../authorization/etl-authorizer');
var privileges = authorizer.getAllPrivileges();
var caseManagementData = require('../case-management/case-management')
const routes = [
    {
        method: 'GET',
        path: '/etl/case-management',
        config: {
            plugins: {
                'hapiAuthorization': {
                    role: privileges.canViewPatient
                }
            },
            handler: function (request, reply) {
                let params = {
                    minDefaultPeriod: request.query.minDefaultPeriod,
                    maxDefaultPeriod: request.query.maxDefaultPeriod,
                    minFollowupPeriod: request.query.minFollowupPeriod,
                    maxFollowupPeriod: request.query.maxFollowupPeriod,
                    locationUuid: request.query.locationUuid,
                    hasCaseManager: request.query.hasCaseManager,
                    hasPhoneRTC: request.query.hasPhoneRTC,
                    elevatedVL: request.query.elevatedVL,
                    dueForVl: request.query.dueForVl,
                    caseManagerUuid: request.query.caseManagerUuid,
                    startIndex: request.query.startIndex,
                    limit: request.query.limit
                }
                caseManagementData.getCaseManagementData(params,
                    (result) => {
                        if (result.error) {
                            reply(result);
                        } else {
                            reply(result);
                        }
                    })
            },
            description: 'Case Management Data',
            notes: 'Returns patient list',
            tags: ['api'],
            validate: {
                options: {
                    allowUnknown: true
                },
                params: {}
            }
        }
    },
    {
        method: 'GET',
        path: '/etl/case-managers',
        config: {
            plugins: {
                'hapiAuthorization': {
                    role: privileges.canViewPatient
                }
            },
            handler: function (request, reply) {
                let params = {
                    locationUuid: request.query.locationUuid
                }
                caseManagementData.getCaseManagers(params).then((result) => {
                    reply(result);
                }).catch((error) => {
                    reply(error);
                });
            },
            description: 'List of case management providers filtered by locations',
            notes: 'Returns providers list',
            tags: ['api'],
            validate: {
                options: {
                    allowUnknown: true
                },
                params: {}
            }
        }
    }
]
exports.routes = server => server.route(routes); 