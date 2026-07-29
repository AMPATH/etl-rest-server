import {
  getPatientAdmissionHistory,
  getAdmissionRequests
} from '../../service/admissions/admissions-service';
var Boom = require('boom');
const routes = [
  {
    method: 'GET',
    path: '/etl/admissions/history/{patientUuid}',
    config: {
      handler: async function (request, reply) {
        const patientUuid = request.params.patientUuid
          ? request.params.patientUuid
          : null;
        try {
          const results = await getPatientAdmissionHistory(patientUuid);
          reply({
            results: results
          });
        } catch (error) {
          reply(Boom.badRequest());
        }
      },
      description: 'Get patient admission history ',
      notes: 'Returns all patient admission history',
      tags: ['api'],
      validate: {}
    }
  },
  {
    method: 'GET',
    path: '/etl/admissions/requests',
    config: {
      handler: async function (request, reply) {
        const locationUuid = request.query.locationUuid
          ? request.query.locationUuid
          : null;
        try {
          const results = await getAdmissionRequests(locationUuid);
          reply({
            results: results
          });
        } catch (error) {
          reply(Boom.badRequest());
        }
      },
      description: 'Get ward admission requests',
      notes: 'Returns a facility admisssion requests',
      tags: ['api'],
      validate: {}
    }
  }
];
exports.routes = (server) => server.route(routes);
