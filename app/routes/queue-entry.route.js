var Boom = require('boom');
import { ServiceEntry } from '../../service/queues/queue-entry/queue-entry.service';
const routes = [
  {
    method: 'GET',
    path: '/etl/queue-entry',
    config: {
      handler: async function (request, reply) {
        const queueService = new ServiceEntry();
        if (request.query.locationUuid && request.query.serviceUuid) {
          const locationUuid = request.query.locationUuid;
          const serviceUuid = request.query.serviceUuid;
          const res = await queueService.getQueueEntriesByLocationAndService(
            locationUuid,
            serviceUuid
          );
          reply({
            data: res
          });
        } else {
          reply(Boom.badData());
        }
      },
      plugins: {},
      description: "Get a location's service queue",
      notes: "Returns a location's service queue",
      tags: ['api']
    }
  },
  {
    method: 'GET',
    path: '/etl/queue-entry/registration',
    config: {
      handler: async function (request, reply) {
        const queueService = new ServiceEntry();
        if (
          request.query.locationUuid &&
          request.query.startDate &&
          request.query.endDate
        ) {
          const locationUuid = request.query.locationUuid;
          const startDate = request.query.startDate;
          const endDate = request.query.endDate;
          const res = await queueService.getQueueEntriesByLocationAndDateRange(
            locationUuid,
            startDate,
            endDate
          );
          reply({
            data: res
          });
        } else {
          reply(Boom.badData());
        }
      },
      plugins: {},
      description: 'Get patient served for a given date range',
      notes: 'Returns a list of patients in a queue on a given date range',
      tags: ['api']
    }
  }
];
exports.routes = (server) => server.route(routes);
