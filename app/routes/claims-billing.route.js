import {
  getFacilityBills,
  getPatientFacilityBillDetails,
  getPatientBillPayments
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
  }
];
exports.routes = (server) => server.route(routes);
