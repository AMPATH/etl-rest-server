'use strict';

var Boom = require('boom');
var etlHelpers = require('../../etl-helpers.js');
import { Moh643Service } from '../../service/moh-643/moh-643.service';

const REPORT_NAME = 'MOH-643-report';

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
    path: '/moh-643-report',
    config: {
      auth: false,
      handler: function (request, reply) {
        if (!request.query.locationUuids) {
          return reply({ error: 'locationUuids is required' }).code(400);
        }
        const moh643Service = new Moh643Service(
          REPORT_NAME,
          buildParams(request)
        );
        moh643Service
          .generateReport()
          .then((result) => {
            reply(result);
          })
          .catch((error) => {
            reply(error);
          });
      },
      description: 'Get MOH-643 monthly laboratory commodities summary',
      notes:
        'Number of tests done and total quantity used (1 test = 1 unit) from etl.flat_moh_706_report',
      tags: ['api', 'moh-643'],
      validate: {
        options: { allowUnknown: true }
      }
    }
  },
  {
    method: 'GET',
    path: '/moh-643-report/patient-list',
    config: {
      auth: false,
      handler: function (request, reply) {
        if (!request.query.locationUuids) {
          return reply({ error: 'locationUuids is required' }).code(400);
        }
        const moh643Service = new Moh643Service(
          REPORT_NAME,
          buildParams(request)
        );
        moh643Service
          .getPatientListReport(request.query)
          .then((results) => {
            reply(results);
          })
          .catch((err) => {
            reply(Boom.internal('An error occured', err));
          });
      },
      description: 'MOH-643 laboratory commodity patient list',
      notes:
        'One row per patient; test counts on the line sum to the monthly cell',
      tags: ['api', 'moh-643'],
      validate: {
        options: { allowUnknown: true }
      }
    }
  }
];

exports.routes = (server) => server.route(routes);
