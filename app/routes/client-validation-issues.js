import { ClientValidationIssues } from '../../service/client-validation-service';
const routes = [
  {
    method: 'GET',
    path: '/etl/client_validation',
    config: {
      handler: function (request, reply) {
        let service = new ClientValidationIssues();
        service
          .generateVerificationClients(request.query)
          .then((res) => reply(res))
          .catch((err) => {
            reply(err);
          });
      },
      description: 'Get all Clients with validation issues',
      notes: 'Returns all  clients with validation issues',
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
