var authorizer = require('../../authorization/etl-authorizer');
var privileges = authorizer.getAllPrivileges();
var preRequest = require('../../pre-request-processing');
var etlHelpers = require('../../etl-helpers');
var Joi = require('joi');
const { MOH710Service } = require('../../service/moh-710.service');
const { MOH711Service } = require('../../service/moh-711.service');
const { MOH717Service } = require('../../service/moh-717.service');
const { MOH705AService } = require('../../service/moh-705a.service');
const { MOH705BService } = require('../../service/moh-705b.service');
// MOH 731 (Ver. July 2023) for these O3 routes; the production POC routes keep MOH731Service
const {
  MOH731Ver2023Service: MOH731Service
} = require('../../service/moh-731/ver-2023/moh-731-ver-2023.service');
const { MOH745Service } = require('../../service/moh-745/moh-745.service');
const {
  getMoh362Register
} = require('../../service/moh-731/ver-2023/moh-362-register.service');
const {
  getMoh267Register
} = require('../../service/moh-731/ver-2023/moh-267-register.service');
const {
  getMoh729b
} = require('../../service/moh-731/ver-2023/moh-729b.service');
const {
  getPresumptiveTbRegister
} = require('../../service/tb-registers/presumptive-tb-register.service');
const {
  getTbPresumptiveRegister
} = require('../../service/tb-presumptive-register.service');

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
    path: '/moh-717-patient-list',
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
            ['endDate', 'startDate', 'locationUuids', 'isAggregated'],
            requestParams
          );
          reportParams.requestParams.limitParam = requestParams.limit;
          reportParams.requestParams.offSetParam = requestParams.startIndex;

          let service = new MOH717Service(
            'moh717Report',
            reportParams.requestParams
          );
          service
            .generatePatientListReport(reportParams.requestParams)
            .then((result) => {
              reply(result);
            })
            .catch((error) => {
              reply(error);
            });
        });
      },
      description: 'Get MOH 717 (204A / 204B) patient list',
      notes: 'Returns MOH 717 204A/204B patient list for an indicator',
      tags: ['api'],
      validate: {
        options: {
          allowUnknown: true
        },
        query: {
          limit: Joi.number().required()
        },
        params: {}
      }
    }
  },
  {
    method: 'GET',
    path: '/moh-745',
    config: {
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
          const reportName = request.query.reportName;
          preRequest.resolveLocationIdsToLocationUuids(request, function () {
            let requestParams = Object.assign(
              {},
              request.query,
              request.params
            );

            let reportParams = etlHelpers.getReportParams(
              reportName,
              ['endDate', 'startDate', 'locationUuids', 'isAggregated'],
              requestParams
            );

            let requestCopy = _.cloneDeep(requestParams);

            let service = new MOH711Service(
              reportName,
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
          const reportName = request.query.reportName;
          preRequest.resolveLocationIdsToLocationUuids(request, function () {
            let requestParams = Object.assign(
              {},
              request.query,
              request.params
            );

            let reportParams = etlHelpers.getReportParams(
              reportName,
              ['endDate', 'startDate', 'locationUuids', 'isAggregated'],
              requestParams
            );

            let requestCopy = _.cloneDeep(requestParams);

            let service = new MOH711Service(
              reportName,
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
          const reportName = request.query.reportName;
          preRequest.resolveLocationIdsToLocationUuids(request, function () {
            let requestParams = Object.assign(
              {},
              request.query,
              request.params
            );

            let reportParams = etlHelpers.getReportParams(
              reportName,
              ['endDate', 'startDate', 'locationUuids', 'isAggregated'],
              requestParams
            );

            let requestCopy = _.cloneDeep(requestParams);

            let service = new MOH711Service(
              reportName,
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
            const reportName = request.query.reportName;
            let requestParams = Object.assign(
              {},
              request.query,
              request.params
            );

            let reportParams = etlHelpers.getReportParams(
              reportName,
              ['endDate', 'startDate', 'locationUuids', 'isAggregated'],
              requestParams
            );

            let requestCopy = _.cloneDeep(requestParams);

            let service = new MOH711Service(
              reportName,
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
      description: 'Get MOH 510 PATIENT LIST',
      notes: 'Returns MOH 510 Patient List',
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
          request.query.reportName = 'moh745Report';
          preRequest.resolveLocationIdsToLocationUuids(request, function () {
            let requestParams = Object.assign(
              {},
              request.query,
              request.params
            );

            let requestCopy = _.cloneDeep(requestParams);
            let reportParams = etlHelpers.getReportParams(
              request.query.reportName,
              ['startDate', 'endDate', 'locationUuids', 'locations'],
              requestParams
            );
            requestCopy.locations = reportParams.requestParams.locations;
            let report = 'moh745Report';
            let moh745Service = new MOH745Service(report, requestCopy);

            moh745Service
              .getPatientListReport(requestParams)
              .then((results) => {
                reply(results);
              })
              .catch((err) => {
                reply(Boom.internal('An error occured', err));
              });
          });
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
  },
  {
    method: 'GET',
    path: '/moh-731-monthly-summary',
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
              'moh731MonthlyReport',
              ['endDate', 'startDate', 'locationUuids'],
              requestParams
            );

            reportParams.requestParams.isAggregated = true;

            let moh731Service = new MOH731Service(
              'moh731MonthlyReport',
              reportParams.requestParams
            );

            moh731Service
              .generateReport(reportParams.requestParams)
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
      description: 'Get MOH 731 REPORT',
      notes: 'Returns MOH 731 Report',
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
    path: '/moh-731-monthly-summary-patient-list',
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
              'moh731MonthlyReport',
              ['endDate', 'startDate', 'locationUuids', 'isAggregated'],
              requestParams
            );

            let requestCopy = _.cloneDeep(requestParams);

            let moh731Service = new MOH731Service(
              'moh731MonthlyReport',
              reportParams.requestParams
            );

            requestCopy.locations = reportParams.requestParams.locations;
            requestCopy.limitParam = requestParams.limit;
            requestCopy.offSetParam = requestParams.startIndex;
            delete reportParams.requestParams['gender'];

            moh731Service
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
      description: 'Get MOH 731 REPORT',
      notes: 'Returns MOH 731 Report',
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
    path: '/prep-patient-list',
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
              'moh731MonthlyReport',
              ['endDate', 'startDate', 'locationUuids', 'isAggregated'],
              requestParams
            );

            let requestCopy = _.cloneDeep(requestParams);

            let moh731Service = new MOH731Service(
              'moh731MonthlyReport',
              reportParams.requestParams
            );

            requestCopy.locations = reportParams.requestParams.locations;
            requestCopy.limitParam = requestParams.limit;
            requestCopy.offSetParam = requestParams.startIndex;
            // delete reportParams.requestParams['gender'];

            moh731Service
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
      description: 'Get MOH 731 REPORT',
      notes: 'Returns MOH 731 Report',
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
    path: '/moh-510-patient-list',
    config: {
      handler: function (request, reply) {
        if (request.query.locationUuids) {
          const reportName = request.query.reportName;
          preRequest.resolveLocationIdsToLocationUuids(request, function () {
            let requestParams = Object.assign(
              {},
              request.query,
              request.params
            );

            let reportParams = etlHelpers.getReportParams(
              reportName,
              ['endDate', 'startDate', 'locationUuids', 'isAggregated'],
              requestParams
            );

            let requestCopy = _.cloneDeep(requestParams);

            let service = new MOH710Service(
              reportName,
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
      description: 'Get MOH 510 PATIENT LIST',
      notes: 'Returns MOH 510 Patient List',
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
    path: '/moh-362-register',
    config: {
      handler: function (request, reply) {
        preRequest.resolveLocationIdsToLocationUuids(request, function () {
          getMoh362Register({
            startDate: request.query.startDate,
            endDate: request.query.endDate,
            locations: request.query.locations || []
          })
            .then((rows) => reply(rows))
            .catch((error) => {
              const message = (error && error.message) || String(error);
              reply({ error: message }).code(
                /YYYY-MM-DD|No location/.test(message) ? 400 : 500
              );
            });
        });
      },
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      description: 'Get the MOH 362 HTS lab, referral and linkage register',
      notes:
        'Returns one row per HTS client tested in the period, for the whole facility of the location',
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
    path: '/moh-267-register',
    config: {
      handler: function (request, reply) {
        preRequest.resolveLocationIdsToLocationUuids(request, function () {
          getMoh267Register({
            startDate: request.query.startDate,
            endDate: request.query.endDate,
            locations: request.query.locations || []
          })
            .then((rows) => reply(rows))
            .catch((error) => {
              const message = (error && error.message) || String(error);
              reply({ error: message }).code(
                /YYYY-MM-DD|No location/.test(message) ? 400 : 500
              );
            });
        });
      },
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      description: 'Get the MOH 267 PrEP daily activity register',
      notes:
        'Returns one row per PrEP visit in the period (the MOH 731 PrEP visits), for the whole facility of the location',
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
    path: '/moh-729b',
    config: {
      handler: function (request, reply) {
        preRequest.resolveLocationIdsToLocationUuids(request, function () {
          getMoh729b({
            endDate: request.query.endDate,
            locations: request.query.locations || []
          })
            .then((rows) => reply(rows))
            .catch((error) => {
              const message = (error && error.message) || String(error);
              reply({ error: message }).code(
                /YYYY-MM-DD|No location/.test(message) ? 400 : 500
              );
            });
        });
      },
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      description: 'Get the MOH 729B F-MAPS clients on ART by regimen code',
      notes:
        'Returns one row per client active on ART in the month ending on endDate, with the form regimen code, for the whole facility of the location',
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
    path: '/tb-presumptive-register',
    config: {
      handler: function (request, reply) {
        preRequest.resolveLocationIdsToLocationUuids(request, function () {
          getTbPresumptiveRegister({
            startDate: request.query.startDate,
            endDate: request.query.endDate,
            locations: request.query.locations || []
          })
            .then((rows) => reply(rows))
            .catch((error) => {
              const message = (error && error.message) || String(error);
              reply({ error: message }).code(
                /YYYY-MM-DD|No location/.test(message) ? 400 : 500
              );
            });
        });
      },
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      description: 'Get the TB presumptive register',
      notes:
        'Returns one row per TB presumptive encounter in the period, with the register columns A to R, for the whole facility of the location',
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
    path: '/presumptive-tb-register',
    config: {
      handler: function (request, reply) {
        preRequest.resolveLocationIdsToLocationUuids(request, function () {
          getPresumptiveTbRegister({
            startDate: request.query.startDate,
            endDate: request.query.endDate,
            locations: request.query.locations || []
          })
            .then((rows) => reply(rows))
            .catch((error) => {
              const message = (error && error.message) || String(error);
              reply({ error: message }).code(
                /YYYY-MM-DD|No location/.test(message) ? 400 : 500
              );
            });
        });
      },
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      description: 'Get the Presumptive TB Register',
      notes:
        'Returns one row per TB encounter (331) in the period, for the whole facility of the location, in the register columns',
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
    path: '/moh-512-patient-list',
    config: {
      handler: function (request, reply) {
        if (request.query.locationUuids) {
          const reportName = request.query.reportName;
          preRequest.resolveLocationIdsToLocationUuids(request, function () {
            let requestParams = Object.assign(
              {},
              request.query,
              request.params
            );

            let reportParams = etlHelpers.getReportParams(
              reportName,
              ['endDate', 'startDate', 'locationUuids', 'isAggregated'],
              requestParams
            );

            let requestCopy = _.cloneDeep(requestParams);

            let service = new MOH711Service(
              reportName,
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
      description: 'Get MOH 512 PATIENT LIST',
      notes: 'Returns MOH 512 Patient List',
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
    path: '/tb-patient-list',
    config: {
      handler: function (request, reply) {
        if (request.query.locationUuids) {
          const reportName = request.query.reportName;
          preRequest.resolveLocationIdsToLocationUuids(request, function () {
            let requestParams = Object.assign(
              {},
              request.query,
              request.params
            );

            let reportParams = etlHelpers.getReportParams(
              reportName,
              ['endDate', 'startDate', 'locationUuids', 'isAggregated'],
              requestParams
            );

            let requestCopy = _.cloneDeep(requestParams);

            let service = new MOH711Service(
              reportName,
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
      description: 'Get MOH TB PATIENT LIST',
      notes: 'Returns MOH TB Patient List',
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
    path: '/moh-413-patient-list',
    config: {
      handler: function (request, reply) {
        if (request.query.locationUuids) {
          const reportName = request.query.reportName;
          preRequest.resolveLocationIdsToLocationUuids(request, function () {
            let requestParams = Object.assign(
              {},
              request.query,
              request.params
            );

            let reportParams = etlHelpers.getReportParams(
              reportName,
              ['endDate', 'startDate', 'locationUuids', 'isAggregated'],
              requestParams
            );

            let requestCopy = _.cloneDeep(requestParams);

            let service = new MOH710Service(
              reportName,
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
      description: 'Get MOH 413 PATIENT LIST',
      notes: 'Returns MOH 413 Patient List',
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
    path: '/moh-407-patient-list',
    config: {
      handler: function (request, reply) {
        if (request.query.locationUuids) {
          const reportName = request.query.reportName;
          preRequest.resolveLocationIdsToLocationUuids(request, function () {
            let requestParams = Object.assign(
              {},
              request.query,
              request.params
            );

            let reportParams = etlHelpers.getReportParams(
              reportName,
              ['endDate', 'startDate', 'locationUuids', 'isAggregated'],
              requestParams
            );

            let requestCopy = _.cloneDeep(requestParams);

            let service = new MOH711Service(
              reportName,
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
      description: 'Get MOH 407 PATIENT LIST',
      notes: 'Returns MOH 407 Patient List',
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
