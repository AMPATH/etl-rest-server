var authorizer = require('../../authorization/etl-authorizer');
var privileges = authorizer.getAllPrivileges();
var registersmappings = require('../moh-registers/registers-mapping');

const routes = [
  {
    method: 'GET',
    path: '/etl/registers/prepregisterdata',
    options: {
      plugins: {},
      handler: function (request, h) {
        return new Promise(async function (resolve) {
          var reply = function (payload) {
            return resolve(payload);
          };

          registersmappings
            .getPrEPRegisterData(request.query)
            .then((result) => {
              console.log('HEI RESULT', JSON.stringify(result));
              reply(result);
            })
            .catch((error) => {
              reply(error);
            });
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
    options: {
      plugins: {},
      handler: function (request, h) {
        return new Promise(async function (resolve) {
          var reply = function (payload) {
            return resolve(payload);
          };

          registersmappings
            .getDefaulterTracingRegisterData(request.query)
            .then((result) => {
              reply(result);
            })
            .catch((error) => {
              reply(error);
            });
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
    options: {
      plugins: {},
      handler: function (request, h) {
        return new Promise(async function (resolve) {
          var reply = function (payload) {
            return resolve(payload);
          };

          registersmappings
            .getHEIRegisterData(request.query)
            .then((result) => {
              reply(result);
            })
            .catch((error) => {
              reply(error);
            });
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
    options: {
      plugins: {},
      handler: function (request, h) {
        return new Promise(async function (resolve) {
          var reply = function (payload) {
            return resolve(payload);
          };

          registersmappings
            .getCNTRegisterData(request.query)
            .then((result) => {
              reply(result);
            })
            .catch((error) => {
              reply(error);
            });
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
    options: {
      plugins: {},
      handler: function (request, h) {
        return new Promise(async function (resolve) {
          var reply = function (payload) {
            return resolve(payload);
          };

          registersmappings
            .getANCRegisterData(request.query)
            .then((result) => {
              reply(result);
            })
            .catch((error) => {
              reply(error);
            });
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
    options: {
      plugins: {},
      handler: function (request, h) {
        return new Promise(async function (resolve) {
          var reply = function (payload) {
            return resolve(payload);
          };

          registersmappings
            .getHtsReferrealAndLinkage(request.query)
            .then((result) => {
              reply(result);
            })
            .catch((error) => {
              reply(error);
            });
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
    options: {
      plugins: {},
      handler: function (request, h) {
        return new Promise(async function (resolve) {
          var reply = function (payload) {
            return resolve(payload);
          };

          registersmappings
            .getMaternityRegister(request.query)
            .then((result) => {
              reply(result);
            })
            .catch((error) => {
              reply(error);
            });
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
    options: {
      plugins: {},
      handler: function (request, h) {
        return new Promise(async function (resolve) {
          var reply = function (payload) {
            return resolve(payload);
          };

          registersmappings
            .getPncRegister(request.query)
            .then((result) => {
              reply(result);
            })
            .catch((error) => {
              reply(error);
            });
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
    options: {
      plugins: {},
      handler: function (request, h) {
        return new Promise(async function (resolve) {
          var reply = function (payload) {
            return resolve(payload);
          };

          registersmappings
            .getNutritionRegister(request.query)
            .then((result) => {
              reply(result);
              console.log('NUTRITION REGISTER RESULT', JSON.stringify(result));
            })
            .catch((error) => {
              reply(error);
            });
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
    options: {
      plugins: {},
      handler: function (request, h) {
        return new Promise(async function (resolve) {
          var reply = function (payload) {
            return resolve(payload);
          };

          registersmappings
            .getOTZRegisterData(request.query)
            .then((result) => {
              reply(result);
            })
            .catch((error) => {
              reply(error);
            });
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
    options: {
      plugins: {},
      handler: function (request, h) {
        return new Promise(async function (resolve) {
          var reply = function (payload) {
            return resolve(payload);
          };

          registersmappings
            .getMOH731Register(request.query)
            .then((result) => {
              reply(result);
            })
            .catch((error) => {
              reply(error);
            });
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
