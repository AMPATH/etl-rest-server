var authorizer = require('../../authorization/etl-authorizer');
var privileges = authorizer.getAllPrivileges();
var preRequest = require('../../pre-request-processing');
var etlHelpers = require('../../etl-helpers');
var Joi = require('joi');
const { MOH710Service } = require('../../service/moh-710.service');
const { MOH711Service } = require('../../service/moh-711.service');
const { MOH717Service } = require('../../service/moh-717.service');
const { MOH745Service } = require('../../service/moh-745.service');
const { MOH705AService } = require('../../service/moh-705a.service');
const { MOH705BService } = require('../../service/moh-705b.service');

const routes = [
  {
    method: 'GET',
    path: '/moh-710',
    config: {
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      handler: function (request, reply) {
        preRequest.resolveLocationIdsToLocationUuids(request, function () {
          let requestParams = Object.assign({}, request.query, request.params);

          let reportParams = etlHelpers.getReportParams(
            'moh710Report',
            ['endDate', 'startDate', 'locationUuids'],
            requestParams
          );
          reportParams.requestParams.isAggregated = true;

          console.log('PARAMS: ', reportParams.requestParams);

          let service = new MOH710Service(
            'moh710Report',
            reportParams.requestParams
          );
          service
            .generateReport(reportParams.requestParams)
            .then((result) => {
              reply(result);
            })
            .catch((error) => {
              reply(error);
            });
        });
      },
      description: 'Get MOH 710 REPORT',
      notes: 'Returns MOH 710 Report',
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
    path: '/moh-711',
    config: {
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      handler: function (request, reply) {
        preRequest.resolveLocationIdsToLocationUuids(request, function () {
          let requestParams = Object.assign({}, request.query, request.params);
          let reportParams = etlHelpers.getReportParams(
            'moh711Report',
            ['endDate', 'startDate', 'locationUuids'],
            requestParams
          );
          reportParams.requestParams.isAggregated = true;

          let service = new MOH711Service(
            'moh711Report',
            reportParams.requestParams
          );
          service
            .generateReport(reportParams.requestParams)
            .then((result) => {
              reply(result);
            })
            .catch((error) => {
              reply(error);
            });
        });
      },
      description: 'Get MOH 711 REPORT',
      notes: 'Returns MOH 711 Report',
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
    path: '/moh-717',
    config: {
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      handler: function (request, reply) {
        preRequest.resolveLocationIdsToLocationUuids(request, function () {
          let requestParams = Object.assign({}, request.query, request.params);
          let reportParams = etlHelpers.getReportParams(
            'moh717Report',
            ['endDate', 'startDate', 'locationUuids'],
            requestParams
          );
          reportParams.requestParams.isAggregated = true;

          let service = new MOH717Service(
            'moh717Report',
            reportParams.requestParams
          );
          service
            .generateReport(reportParams.requestParams)
            .then((result) => {
              reply(result);
            })
            .catch((error) => {
              reply(error);
            });
        });
      },
      description: 'Get MOH 717 REPORT',
      notes: 'Returns MOH 717 Report',
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
    path: '/moh-745',
    config: {
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      handler: function (request, reply) {
        preRequest.resolveLocationIdsToLocationUuids(request, function () {
          let requestParams = Object.assign({}, request.query, request.params);
          let reportParams = etlHelpers.getReportParams(
            'moh745Report',
            ['endDate', 'startDate', 'locationUuids'],
            requestParams
          );
          reportParams.requestParams.isAggregated = true;

          let service = new MOH745Service(
            'moh745Report',
            reportParams.requestParams
          );
          service
            .generateReport(reportParams.requestParams)
            .then((result) => {
              reply(result);
            })
            .catch((error) => {
              reply(error);
            });
        });
      },
      description: 'Get MOH 717 REPORT',
      notes: 'Returns MOH 717 Report',
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
    path: '/moh-705a',
    config: {
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      handler: function (request, reply) {
        preRequest.resolveLocationIdsToLocationUuids(request, function () {
          let requestParams = Object.assign({}, request.query, request.params);
          let reportParams = etlHelpers.getReportParams(
            'moh705AReport',
            ['endDate', 'startDate', 'locationUuids'],
            requestParams
          );
          reportParams.requestParams.isAggregated = true;

          let service = new MOH705AService(
            'moh705AReport',
            reportParams.requestParams
          );
          service
            .generateReport(reportParams.requestParams)
            .then((result) => {
              reply(result);
            })
            .catch((error) => {
              reply(error);
            });
        });
      },
      description: 'Get MOH 717 REPORT',
      notes: 'Returns MOH 717 Report',
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
    path: '/moh-705a-patient-list',
    config: {
      handler: function (request, reply) {
        if (request.query.locationUuids) {
          preRequest.resolveLocationIdsToLocationUuids(request, function () {
            let requestParams = Object.assign(
              {},
              request.query,
              request.params
            );

            let reportParams = etlHelpers.getReportParams(
              'moh705AReport',
              ['endDate', 'startDate', 'locationUuids', 'isAggregated'],
              requestParams
            );

            let requestCopy = _.cloneDeep(requestParams);

            let moh705AService = new MOH705AService(
              'moh705AReport',
              reportParams.requestParams
            );

            requestCopy.locations = reportParams.requestParams.locations;
            requestCopy.limitParam = requestParams.limit;
            requestCopy.offSetParam = requestParams.startIndex;

            moh705AService
              .generatePatientListReport(reportParams.requestParams)
              .then((result) => {
                reply(result);
              })
              .catch((error) => {
                reply(error);
              });
          });
        }
      },
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      description: 'Get MOH 204 patient list',
      notes: 'Returns MOH 204 patient list',
      tags: ['api'],
      validate: {
        options: {
          allowUnknown: true
        },
        query: {
          limit: Joi.number()
            .required()
            .description('The offset to control pagination')
        },
        params: {}
      }
    }
  },
  {
    method: 'GET',
    path: '/moh-705b',
    config: {
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      handler: function (request, reply) {
        preRequest.resolveLocationIdsToLocationUuids(request, function () {
          let requestParams = Object.assign({}, request.query, request.params);
          let reportParams = etlHelpers.getReportParams(
            'moh705BReport',
            ['endDate', 'startDate', 'locationUuids'],
            requestParams
          );
          reportParams.requestParams.isAggregated = true;

          let service = new MOH705BService(
            'moh705BReport',
            reportParams.requestParams
          );
          service
            .generateReport(reportParams.requestParams)
            .then((result) => {
              reply(result);
            })
            .catch((error) => {
              reply(error);
            });
        });
      },
      description: 'Get MOH 717 REPORT',
      notes: 'Returns MOH 717 Report',
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
    path: '/moh-705b-patient-list',
    config: {
      handler: function (request, reply) {
        if (request.query.locationUuids) {
          preRequest.resolveLocationIdsToLocationUuids(request, function () {
            let requestParams = Object.assign(
              {},
              request.query,
              request.params
            );

            let reportParams = etlHelpers.getReportParams(
              'moh705BReport',
              ['endDate', 'startDate', 'locationUuids', 'isAggregated'],
              requestParams
            );

            let requestCopy = _.cloneDeep(requestParams);

            let moh705BService = new MOH705BService(
              'moh705BReport',
              reportParams.requestParams
            );

            requestCopy.locations = reportParams.requestParams.locations;
            requestCopy.limitParam = requestParams.limit;
            requestCopy.offSetParam = requestParams.startIndex;

            moh705BService
              .generatePatientListReport(reportParams.requestParams)
              .then((result) => {
                reply(result);
              })
              .catch((error) => {
                reply(error);
              });
          });
        }
      },
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      description: 'Get MOH 705B REPORT',
      notes: 'Returns MOH 705B Report',
      tags: ['api'],
      validate: {
        options: {
          allowUnknown: true
        },
        query: {
          limit: Joi.number()
            .required()
            .description('The offset to control pagination')
        },
        params: {}
      }
    }
  },

  {
    method: 'GET',
    path: '/moh-406-patient-list',
    config: {
      handler: function (request, reply) {
        if (request.query.locationUuids) {
          preRequest.resolveLocationIdsToLocationUuids(request, function () {
            let requestParams = Object.assign(
              {},
              request.query,
              request.params
            );

            let reportParams = etlHelpers.getReportParams(
              'moh711Report',
              ['endDate', 'startDate', 'locationUuids', 'isAggregated'],
              requestParams
            );

            let requestCopy = _.cloneDeep(requestParams);

            let service = new MOH711Service(
              'moh711Report',
              reportParams.requestParams
            );

            requestCopy.locations = reportParams.requestParams.locations;
            requestCopy.limitParam = requestParams.limit;
            requestCopy.offSetParam = requestParams.startIndex;

            service
              .generatePatientListReport(reportParams.requestParams)
              .then((result) => {
                reply(result);
              })
              .catch((error) => {
                reply(error);
              });
          });
        }
      },
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      description: 'Get MOH 406 PATIENT LIST',
      notes: 'Returns MOH 406 Patient List',
      tags: ['api'],
      validate: {
        options: {
          allowUnknown: true
        },
        query: {
          limit: Joi.number()
            .required()
            .description('The offset to control pagination')
        },
        params: {}
      }
    }
  },
  {
    method: 'GET',
    path: '/moh-405-patient-list',
    config: {
      handler: function (request, reply) {
        if (request.query.locationUuids) {
          preRequest.resolveLocationIdsToLocationUuids(request, function () {
            let requestParams = Object.assign(
              {},
              request.query,
              request.params
            );

            let reportParams = etlHelpers.getReportParams(
              'moh711Report',
              ['endDate', 'startDate', 'locationUuids', 'isAggregated'],
              requestParams
            );

            let requestCopy = _.cloneDeep(requestParams);

            let service = new MOH711Service(
              'moh711Report',
              reportParams.requestParams
            );

            requestCopy.locations = reportParams.requestParams.locations;
            requestCopy.limitParam = requestParams.limit;
            requestCopy.offSetParam = requestParams.startIndex;

            service
              .generatePatientListReport(reportParams.requestParams)
              .then((result) => {
                reply(result);
              })
              .catch((error) => {
                reply(error);
              });
          });
        }
      },
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      description: 'Get MOH 405 PATIENT LIST',
      notes: 'Returns MOH 405 Patient List',
      tags: ['api'],
      validate: {
        options: {
          allowUnknown: true
        },
        query: {
          limit: Joi.number()
            .required()
            .description('The offset to control pagination')
        },
        params: {}
      }
    }
  },
  {
    method: 'GET',
    path: '/moh-333-patient-list',
    config: {
      handler: function (request, reply) {
        if (request.query.locationUuids) {
          preRequest.resolveLocationIdsToLocationUuids(request, function () {
            let requestParams = Object.assign(
              {},
              request.query,
              request.params
            );

            let reportParams = etlHelpers.getReportParams(
              'moh711Report',
              ['endDate', 'startDate', 'locationUuids', 'isAggregated'],
              requestParams
            );

            let requestCopy = _.cloneDeep(requestParams);

            let service = new MOH711Service(
              'moh711Report',
              reportParams.requestParams
            );

            requestCopy.locations = reportParams.requestParams.locations;
            requestCopy.limitParam = requestParams.limit;
            requestCopy.offSetParam = requestParams.startIndex;

            service
              .generatePatientListReport(reportParams.requestParams)
              .then((result) => {
                reply(result);
              })
              .catch((error) => {
                reply(error);
              });
          });
        }
      },
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      description: 'Get MOH 333 PATIENT LIST',
      notes: 'Returns MOH 333 Patient List',
      tags: ['api'],
      validate: {
        options: {
          allowUnknown: true
        },
        query: {
          limit: Joi.number()
            .required()
            .description('The offset to control pagination')
        },
        params: {}
      }
    }
  },
  {
    method: 'GET',
    path: '/moh-511-patient-list',
    config: {
      handler: function (request, reply) {
        if (request.query.locationUuids) {
          preRequest.resolveLocationIdsToLocationUuids(request, function () {
            let requestParams = Object.assign(
              {},
              request.query,
              request.params
            );

            let reportParams = etlHelpers.getReportParams(
              'moh711Report',
              ['endDate', 'startDate', 'locationUuids', 'isAggregated'],
              requestParams
            );

            let requestCopy = _.cloneDeep(requestParams);

            let service = new MOH711Service(
              'moh711Report',
              reportParams.requestParams
            );

            requestCopy.locations = reportParams.requestParams.locations;
            requestCopy.limitParam = requestParams.limit;
            requestCopy.offSetParam = requestParams.startIndex;

            service
              .generatePatientListReport(reportParams.requestParams)
              .then((result) => {
                reply(result);
              })
              .catch((error) => {
                reply(error);
              });
          });
        }
      },
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      description: 'Get MOH 511 PATIENT LIST',
      notes: 'Returns MOH 511 Patient List',
      tags: ['api'],
      validate: {
        options: {
          allowUnknown: true
        },
        query: {
          limit: Joi.number()
            .required()
            .description('The offset to control pagination')
        },
        params: {}
      }
    }
  },
  {
    method: 'GET',
    path: '/moh-412-patient-list',
    config: {
      handler: function (request, reply) {
        if (request.query.locationUuids) {
          preRequest.resolveLocationIdsToLocationUuids(request, function () {
            let requestParams = Object.assign(
              {},
              request.query,
              request.params
            );

            let reportParams = etlHelpers.getReportParams(
              'moh745Report',
              ['endDate', 'startDate', 'locationUuids', 'isAggregated'],
              requestParams
            );

            let requestCopy = _.cloneDeep(requestParams);

            let service = new MOH745Service(
              'moh745Report',
              reportParams.requestParams
            );

            requestCopy.locations = reportParams.requestParams.locations;
            requestCopy.limitParam = requestParams.limit;
            requestCopy.offSetParam = requestParams.startIndex;
            console.log('412 REQUEST: ' + JSON.stringify(requestCopy));

            service
              .generatePatientListReport(reportParams.requestParams)
              .then((result) => {
                reply(result);
              })
              .catch((error) => {
                reply(error);
              });
          });
        }
      },
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      description: 'Get MOH 412 PATIENT LIST',
      notes: 'Returns MOH 412 Patient List',
      tags: ['api'],
      validate: {
        options: {
          allowUnknown: true
        },
        query: {
          limit: Joi.number()
            .required()
            .description('The offset to control pagination')
        },
        params: {}
      }
    }
  }
];

exports.routes = (server) => server.route(routes);
