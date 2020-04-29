var authorizer = require('../../authorization/etl-authorizer');
var resolveLocationUuidToId = require('../../location/resolve-location-uuid-to-id');
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
                    minDefaultPeriod : request.query.minDefaultPeriod,
                    maxDefaultPeriod : request.query.maxDefaultPeriod
                }
                caseManagementData.getCaseManagementData(params).then((result) => {
                    reply(result);
                }).catch((error) => {
                    reply(error);
                });
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
    }
]
exports.routes = server => server.route(routes); 