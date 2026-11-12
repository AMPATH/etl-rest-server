import {
  getPatientAdmissionHistory,
  getAdmissionRequests,
  getAdmittedPatients,
  getAwaitingDischarge,
  getAdmissionLocations
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
  },
  {
    method: 'GET',
    path: '/etl/admissions/admitted',
    config: {
      handler: async function (request, reply) {
        const locationUuid = request.query.locationUuid
          ? request.query.locationUuid
          : null;
        try {
          const results = await getAdmittedPatients(locationUuid);
          reply({
            results: results
          });
        } catch (error) {
          reply(Boom.badRequest());
        }
      },
      description: 'Get ward admitted patients',
      notes: 'Returns a list of patients admitted to a ward',
      tags: ['api'],
      validate: {}
    }
  },
  {
    method: 'GET',
    path: '/etl/admissions/awaiting-dicharge',
    config: {
      handler: async function (request, reply) {
        const locationUuid = request.query.locationUuid
          ? request.query.locationUuid
          : null;
        try {
          const results = await getAwaitingDischarge(locationUuid);
          reply({
            results: results
          });
        } catch (error) {
          reply(Boom.badRequest());
        }
      },
      description: 'Get patients awaiating discharge',
      notes:
        'Returns a list of patients who have maternity discharge or general discharge',
      tags: ['api'],
      validate: {}
    }
  },
  {
    method: 'GET',
    path: '/etl/admission-locations',
    config: {
      handler: async function (request, reply) {
        let defaultSessionLocationUuid = '18c343eb-b353-462a-9139-b16606e6b6c2'; // location test
        let sessionLocationUuid = null;
        const sessionLocation =
          request.auth.credentials?.sessionLocation || null;
        if (sessionLocation) {
          if (sessionLocation.uuid) {
            sessionLocationUuid = sessionLocation.uuid;
          }
        }
        console.log(`session location uuid`, sessionLocationUuid);
        try {
          const results = await getAdmissionLocations(
            sessionLocationUuid ?? defaultSessionLocationUuid
          );
          reply(results || []);
        } catch (error) {
          reply(Boom.badRequest());
        }
      },
      description:
        'Get patient admission locations with their available bed capacity',
      notes:
        'Returns a list of admission locations with their available bed capacity',
      tags: ['api'],
      validate: {}
    }
  }
];
exports.routes = (server) => server.route(routes);
