var authorizer = require('../../authorization/etl-authorizer');
import { result } from 'underscore';
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

        familyTestingService
          .getPatientContacts(request.query)
          .then((result) => {
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
    method: 'PUT',
    path: '/etl/update-contact',
    config: {
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      handler: function (request, h) {
        try {
          let familyTestingService = new FamilyTestingService();

          familyTestingService.updateContact(request.payload).then((result) => {
            const res = {
              type: 'Success',
              message: 'Contact Updated successfully',
              body: result
            };
            h.response(res);
          });
        } catch (err) {
          h.response(error);
        }
      },
      description: 'Update contact after a successful registration',
      notes: 'Update contact after a successful registration',
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
