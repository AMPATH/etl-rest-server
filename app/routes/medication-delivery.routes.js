const {
  MedicationDeliveryService
} = require('../../service/medication-delivery-list.service');
const Boom = require('boom');

const routes = [
  {
    method: 'GET',
    path: '/etl/medication-delivery-list',
    config: {
      plugins: {},
      handler: function (request, reply) {
        const { locationUuids, startDate, endDate } = request.query;

        // Validate required parameters
        if (!startDate || !endDate) {
          return reply(
            new Boom(400, 'Missing required parameters: startDate and endDate')
          );
        }

        // Validate date format (basic validation)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
          return reply(new Boom(400, 'Invalid date format. Use YYYY-MM-DD'));
        }

        // Validate that startDate is not after endDate
        if (new Date(startDate) > new Date(endDate)) {
          return reply(new Boom(400, 'startDate cannot be after endDate'));
        }

        const medicationDeliveryService = new MedicationDeliveryService();
        medicationDeliveryService
          .getMedicationDeliveryList(locationUuids, startDate, endDate)
          .then(function (medicationDeliveryList) {
            reply(medicationDeliveryList);
          })
          .catch(function (error) {
            reply(new Boom(500, 'Internal server error.', '', '', error));
          });
      },
      description: 'Get medication delivery list',
      notes:
        'Returns the list of patients with their medication delivery status for a given date range. Requires uuid, startDate, and endDate query parameters.',
      tags: ['api']
    }
  }
];

exports.routes = (server) => server.route(routes);
