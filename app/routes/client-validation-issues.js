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
            console.log('ERROR l13', err);
            reply(err);
          });
      },
      description: 'Get all verification aggregates ',
      notes: 'Returns all verification aggregates',
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
