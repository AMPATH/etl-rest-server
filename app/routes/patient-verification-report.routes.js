import { PatientVerificationReport } from '../../service/patient-verification-report';
const routes = [
  {
    method: 'GET',
    path: '/etl/verification-aggregates',
    config: {
      handler: function (request, reply) {
        let service = new PatientVerificationReport();
        service
          .generateAggregates(request.query)
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
  },
  {
    method: 'GET',
    path: '/etl/unverified-clients',
    config: {
      handler: function (request, reply) {
        let service = new PatientVerificationReport();
        service
          .generateUnverifiedClients(request.query)
          .then((res) => reply(res))
          .catch((err) => {
            console.log('ERROR l38', err);
            reply(err);
          });
      },
      description: 'Get all unverified clients ',
      notes: 'Returns all unverified clients',
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
