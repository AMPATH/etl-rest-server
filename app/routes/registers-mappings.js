var authorizer = require('../../authorization/etl-authorizer');
var privileges = authorizer.getAllPrivileges();
var registersmappings = require('../moh-registers/registers-mapping');

const routes = [
  {
    method: 'GET',
    path: '/etl/registers/prepregisterdata',
    config: {
      plugins: {},
      handler: function (request, reply) {
        registersmappings
          .getPrEPRegisterData(request.query)
          .then((result) => {
            console.log('HEI RESULT', JSON.stringify(result));
            reply(result);
          })
          .catch((error) => {
            reply(error);
          });
      },
      description: 'List of facilities with MFL code',
      notes: 'Returns facilities list',
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
    path: '/etl/registers/defaultertracing',
    config: {
      plugins: {},
      handler: function (request, reply) {
        registersmappings
          .getDefaulterTracingRegisterData(request.query)
          .then((result) => {
            reply(result);
          })
          .catch((error) => {
            reply(error);
          });
      },
      description: 'List of facilities with MFL code',
      notes: 'Returns facilities list',
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
    path: '/etl/registers/heiregister',
    config: {
      plugins: {},
      handler: function (request, reply) {
        registersmappings
          .getHEIRegisterData(request.query)
          .then((result) => {
            reply(result);
          })
          .catch((error) => {
            reply(error);
          });
      },
      description: 'List of facilities with MFL code',
      notes: 'Returns facilities list',
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
    path: '/etl/registers/cntregister',
    config: {
      plugins: {},
      handler: function (request, reply) {
        registersmappings
          .getCNTRegisterData(request.query)
          .then((result) => {
            reply(result);
          })
          .catch((error) => {
            reply(error);
          });
      },
      description: 'List of facilities with MFL code',
      notes: 'Returns facilities list',
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
    path: '/etl/registers/ancregister',
    config: {
      plugins: {},
      handler: function (request, reply) {
        registersmappings
          .getANCRegisterData(request.query)
          .then((result) => {
            reply(result);
          })
          .catch((error) => {
            reply(error);
          });
      },
      description: 'List of facilities with MFL code',
      notes: 'Returns facilities list',
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
    path: '/etl/registers/hts-register',
    config: {
      plugins: {},
      handler: function (request, reply) {
        registersmappings
          .getHtsReferrealAndLinkage(request.query)
          .then((result) => {
            reply(result);
          })
          .catch((error) => {
            reply(error);
          });
      },
      description: 'List of facilities with MFL code',
      notes: 'Returns facilities list',
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
    path: '/etl/registers/maternity',
    config: {
      plugins: {},
      handler: function (request, reply) {
        registersmappings
          .getMaternityRegister(request.query)
          .then((result) => {
            reply(result);
          })
          .catch((error) => {
            reply(error);
          });
      },
      description: 'List of facilities with MFL code',
      notes: 'Returns facilities list',
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
    path: '/etl/registers/pncregister',
    config: {
      plugins: {},
      handler: function (request, reply) {
        registersmappings
          .getPncRegister(request.query)
          .then((result) => {
            reply(result);
          })
          .catch((error) => {
            reply(error);
          });
      },
      description: 'List of facilities with MFL code',
      notes: 'Returns facilities list',
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
    path: '/etl/registers/nutrition',
    config: {
      plugins: {},
      handler: function (request, reply) {
        registersmappings
          .getNutritionRegister(request.query)
          .then((result) => {
            reply(result);
            console.log('NUTRITION REGISTER RESULT', JSON.stringify(result));
          })
          .catch((error) => {
            reply(error);
          });
      },
      description: 'List of facilities with MFL code',
      notes: 'Returns facilities list',
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
    path: '/etl/registers/otz-register',
    config: {
      plugins: {},
      handler: function (request, reply) {
        registersmappings
          .getOTZRegisterData(request.query)
          .then((result) => {
            reply(result);
          })
          .catch((error) => {
            reply(error);
          });
      },
      description: 'List of facilities with MFL code',
      notes: 'Returns facilities list',
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
    path: '/etl/registers/moh-731-register',
    config: {
      plugins: {},
      handler: function (request, reply) {
        registersmappings
          .getMOH731Register(request.query)
          .then((result) => {
            reply(result);
          })
          .catch((error) => {
            reply(error);
          });
      },
      description: 'List of facilities with MFL code',
      notes: 'Returns facilities list',
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
