var authorizer = require('../../authorization/etl-authorizer');
import { FamilyTestingService } from '../family-history/family-history.service';
var privileges = authorizer.getAllPrivileges();
const routes = [
    {
        method: 'GET',
        path: '/etl/family-history-patient-list',
        config: {
            plugins: {
                hapiAuthorization: {
                    role: privileges.canViewClinicDashBoard
                }
            },
            handler: function (request, reply) {
                let familyTestingService = new FamilyTestingService();

                familyTestingService.getPatientList(request.query).then((result) => {
                    if (result.error) {
                        reply(result);
                    } else {
                        reply(result);
                    }
                });
            },
            description: 'Family testing patient list',
            notes: 'Family testing patient list',
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
        path: '/etl/patient-family-history',
        config: {
            plugins: {
                hapiAuthorization: {
                    role: privileges.canViewClinicDashBoard
                }
            },
            handler: function (request, reply) {
                let familyTestingService = new FamilyTestingService();

                familyTestingService.getPatientFamilyHistory(request.query).then((result) => {
                    if (result.error) {
                        reply(result);
                    } else {
                        reply(result);
                    }
                });
            },
            description: 'Family testing patient list',
            notes: 'Family testing patient list',
            tags: ['api'],
            validate: {
                options: {
                    allowUnknown: true
                },
                params: {}
            }
        }
    }
];
exports.routes = (server) => server.route(routes);
