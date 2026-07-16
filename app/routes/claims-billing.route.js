import {
  getFacilityBills,
  getPatientFacilityBillDetails,
  getPatientBillPayments,
  getPatientDiagnosis,
  getActiveProviders,
  getFacilityEncounterBills
} from '../../service/claims-and-billing/claims-and-billing.service';
var Boom = require('boom');
const routes = [
  {
    method: 'GET',
    path: '/etl/facility/bills',
    config: {
      handler: async function (request, reply) {
        if (!request.query.locationUuid || !request.query.billingDate) {
          throw new Error('Missing location or billing params');
        }
        const locationUuid = request.query.locationUuid ?? null;
        const billingDate = request.query.billingDate ?? null;
        try {
          const results = await getFacilityBills(locationUuid, billingDate);
          reply({
            results: results
          });
        } catch (error) {
          reply(Boom.badRequest());
        }
      },
      description: 'Get Facility bills',
      notes: 'Returns all facility bills for a date',
      tags: ['api'],
      validate: {}
    }
  },
  {
    method: 'GET',
    path: '/etl/facility/patient/bill',
    config: {
      handler: async function (request, reply) {
        if (
          !request.query.locationUuid ||
          !request.query.billingDate ||
          !request.query.patientUuid
        ) {
          throw new Error('Missing location,billing params');
        }
        const locationUuid = request.query.locationUuid ?? null;
        const billingDate = request.query.billingDate ?? null;
        const patientUuid = request.query.patientUuid ?? null;
        try {
          const results = await getPatientFacilityBillDetails(
            locationUuid,
            billingDate,
            patientUuid
          );
          reply({
            results: results
          });
        } catch (error) {
          reply(Boom.badRequest());
        }
      },
      description: 'Get Patients Facility bills',
      notes: 'Returns all facility bills for a patient for a specific date',
      tags: ['api'],
      validate: {}
    }
  },
  {
    method: 'GET',
    path: '/etl/bill/patient/payment',
    config: {
      handler: async function (request, reply) {
        if (!request.query.billingDate || !request.query.patientUuid) {
          throw new Error('Missing patientId,billigDate params');
        }
        const billingDate = request.query.billingDate ?? null;
        const patientUuid = request.query.patientUuid ?? null;
        try {
          const results = await getPatientBillPayments(
            billingDate,
            patientUuid
          );
          reply({
            results: results
          });
        } catch (error) {
          reply(Boom.badRequest());
        }
      },
      description: 'Get Patients Bill Payments',
      notes: 'Returns all patient bill payments for a bill on a given date',
      tags: ['api'],
      validate: {}
    }
  },
  {
    method: 'GET',
    path: '/etl/patient/diagnosis',
    config: {
      handler: async function (request, reply) {
        if (
          !request.query.visitDate ||
          !request.query.patientUuid ||
          !request.query.locationUuid
        ) {
          throw new Error('Missing patientId,visitDate,locationUuid params');
        }
        console.log('here...');
        const visitDate = request.query.visitDate ?? null;
        const patientUuid = request.query.patientUuid ?? null;
        const locationUuid = request.query.locationUuid ?? null;
        try {
          const results = await getPatientDiagnosis(
            visitDate,
            patientUuid,
            locationUuid
          );
          reply({
            results: results
          });
        } catch (error) {
          console.log({ error });
          reply(Boom.badRequest());
        }
      },
      description: 'Get Patients visit diagnosis',
      notes: 'Returns a patients visit disgnosos',
      tags: ['api'],
      validate: {}
    }
  },
  {
    method: 'GET',
    path: '/etl/providers/licensed',
    config: {
      handler: async function (request, reply) {
        try {
          const results = await getActiveProviders();
          reply({
            results: results
          });
        } catch (error) {
          console.log({ error });
          reply(Boom.badRequest());
        }
      },
      description:
        'Get licensed Providers as well as their speciality and license status details in form of display and uuid',
      notes: 'Returns a list of active providers',
      tags: ['api'],
      validate: {}
    }
  },
  {
    method: 'GET',
    path: '/etl/facility/encounter-bills',
    config: {
      handler: async function (request, reply) {
        if (
          !request.query.locationUuid ||
          !request.query.encounterTypeUuid ||
          !request.query.billingFrom
        ) {
          throw new Error('Missing location, encounter type or billing params');
        }
        const locationUuid = request.query.locationUuid ?? null;
        const billingFrom = request.query.billingFrom ?? null;
        const encounterTypeUuid = request.query.encounterTypeUuid ?? null;

        try {
          const results = await getFacilityEncounterBills(
            locationUuid,
            encounterTypeUuid,
            billingFrom
          );
          reply({
            results: results
          });
        } catch (error) {
          reply(Boom.badRequest());
        }
      },
      description: 'Get Facility encounter bills',
      notes: 'Returns all facility encounter bills for a date',
      tags: ['api'],
      validate: {}
    }
  }
];
exports.routes = (server) => server.route(routes);
