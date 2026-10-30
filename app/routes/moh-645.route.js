'use strict';

var Boom = require('boom');
var etlHelpers = require('../../etl-helpers.js');
import { Moh645Service } from '../../service/moh-645/moh-645.service';

const REPORT_NAME = 'MOH-645-report';

function buildParams(request) {
  let requestParams = Object.assign({}, request.query, request.params);
  return etlHelpers.getReportParams(
    REPORT_NAME,
    ['startDate', 'endDate', 'locationUuids'],
    requestParams
  ).requestParams;
}

const routes = [
  {
    method: 'GET',
    path: '/moh-645-report',
    config: {
      auth: false,
      handler: function (request, reply) {
        if (!request.query.locationUuids) {
          return reply({ error: 'locationUuids is required' }).code(400);
        }
        const moh645Service = new Moh645Service(
          REPORT_NAME,
          buildParams(request)
        );
        moh645Service
          .generateReport()
          .then((result) => {
            reply(result);
          })
          .catch((error) => {
            reply(error);
          });
      },
      description: 'Get MOH-645 monthly malaria commodities summary',
      notes:
        'Column C (AL/artesunate dispensed), AL weight-band patient counts, and malaria diagnostics totals',
      tags: ['api', 'moh-645'],
      validate: {
        options: { allowUnknown: true }
      }
    }
  },
  {
    method: 'GET',
    path: '/moh-645-report/patient-list',
    config: {
      auth: false,
      handler: function (request, reply) {
        if (!request.query.locationUuids) {
          return reply({ error: 'locationUuids is required' }).code(400);
        }
        const moh645Service = new Moh645Service(
          REPORT_NAME,
          buildParams(request)
        );
        moh645Service
          .getPatientListReport(request.query)
          .then((results) => {
            reply(results);
          })
          .catch((err) => {
            reply(Boom.internal('An error occured', err));
          });
      },
      description: 'MOH-645 AL/artesunate dispense patient list',
      notes:
        'Returns patients dispensed AL 20/120 or artesunate 60mg with same-day malaria test flags',
      tags: ['api', 'moh-645'],
      validate: {
        options: { allowUnknown: true }
      }
    }
  }
];

exports.routes = (server) => server.route(routes);
