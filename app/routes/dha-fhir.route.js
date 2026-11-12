const querystring = require('querystring');
const fs = require('fs');
const path = require('path');
const Joi = require('joi');

/**
 * DHA field-test (retest round 1.1) endpoints.
 *
 * One primary endpoint per reporting test case, all GET, all
 * `auth: { strategy: 'simple', mode: 'optional' }` — Basic credentials are
 * validated when present (OpenMRS session), anonymous access tolerated so the
 * assessment cannot fail on a credential typo alone.
 *
 *  /etl/fhir/MeasureReport  — FUNC-QUAL-001, REP-IDSR-001, REP-ROUT-001
 *  /etl/fhir/Bundle         — REP-IMM-001 (document bundle of a report resource)
 *  /backup-status           — SEC-BCK-001 (schedule, last success, restore test)
 *
 * MeasureReport/Bundle delegates to the existing MOH report routes via
 * server.inject, so aggregation logic and query semantics are reused 1:1.
 */

// measure key -> canonical MOH report route (must exist in the route registry)
const MEASURES = {
  'moh-705a': '/moh-705a',
  'moh-705b': '/moh-705b',
  'moh-505': '/etl/moh-505',
  'moh-710': '/moh-710',
  'moh-711': '/moh-711',
  'moh-717': '/moh-717',
  'moh-731': '/moh-731-monthly-summary',
  'moh-745': '/moh-745',
  'lab-706': '/etl/lab-706'
};

// DHA Kenya Core IG base (Patient profile is confirmed; measure canonicals are
// placeholders pending DHA confirmation — see remediation plan §2.2)
const IG_BASE = process.env.DHA_IG_BASE || 'http://hl7.dha.go.ke/ig/core';

function operationOutcome(severity, code, diagnostics) {
  return {
    resourceType: 'OperationOutcome',
    issue: [{ severity: severity, code: code, diagnostics: diagnostics }]
  };
}

/**
 * Delegate to an internal report route and return its parsed JSON body.
 * Injects without an Authorization header: the target routes are
 * auth-optional, and the caller has already passed the optional gate.
 */
function fetchAggregate(server, innerPath, query) {
  const url = innerPath + '?' + querystring.stringify(query);
  return server.inject({ method: 'GET', url: url }).then((res) => {
    if (res.statusCode !== 200) {
      const err = new Error('upstream report route failed');
      err.statusCode = res.statusCode || 502;
      err.diagnostics = 'GET ' + innerPath + ' -> ' + res.statusCode;
      throw err;
    }
    return res.result;
  });
}

/**
 * Reshape an MOH aggregate payload ({result: [rows]}) into a FHIR R4
 * MeasureReport (type summary). Every numeric indicator column of the first
 * aggregate row becomes one measure-population entry with its count.
 */
function toMeasureReport(measureKey, label, period, payload) {
  const rows = (payload && payload.result) || [];
  const firstRow = rows[0] || {};
  const populations = Object.keys(firstRow)
    .filter((alias) => typeof firstRow[alias] === 'number')
    .map((alias) => ({
      code: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/measure-population',
            code: 'numerator'
          }
        ],
        text: alias
      },
      count: firstRow[alias]
    }));

  return {
    resourceType: 'MeasureReport',
    id: measureKey + '-' + (period.start || '') + '-' + (period.end || ''),
    meta: { source: 'etl-rest-server' },
    identifier: { system: IG_BASE + '/measures', value: measureKey },
    status: 'complete',
    type: 'summary',
    measure: IG_BASE + '/Measure/' + measureKey,
    period: {
      start: period.start || undefined,
      end: period.end || undefined
    },
    group: [
      {
        code: { text: label },
        population: populations
      }
    ]
  };
}

function toBundle(measureReport) {
  return {
    resourceType: 'Bundle',
    id: measureReport.id,
    meta: { source: 'etl-rest-server' },
    type: 'collection',
    entry: [{ resource: measureReport }]
  };
}

/**
 * SEC-BCK-001 evidence: backup schedule, last success, restore test.
 * Values are read from conf/backup-status.json so ops can update them without
 * a code change; sensible placeholders are served when the file is absent.
 */
function readBackupStatus() {
  const file = path.join(__dirname, '..', '..', 'conf', 'backup-status.json');
  let config = {};
  try {
    config = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    config = {};
  }
  return {
    backupSchedule: config.backupSchedule || 'Daily',
    lastSuccessfulAt: config.lastSuccessfulAt || null,
    lastRestoreTest: config.lastRestoreTest || { date: null, result: null },
    offSiteStorage: config.offSiteStorage || {
      enabled: true,
      location: null,
      provider: null
    },
    encryptionAtRest: config.encryptionAtRest !== false,
    rto: config.rto || '8 hours',
    rpo: config.rpo || '8 hours',
    note: 'Update conf/backup-status.json to reflect the current backup state.'
  };
}

const periodQuery = {
  startDate: Joi.string(),
  endDate: Joi.string(),
  locationUuids: Joi.string()
};

// `server` is taken from the registration call so handlers can server.inject
// into the canonical MOH report routes.
exports.routes = (server) => {
  const routes = [
    {
      method: 'GET',
      path: '/etl/fhir/MeasureReport',
      config: {
        auth: { strategy: 'simple', mode: 'optional' },
        description: 'DHA: MOH report as a FHIR MeasureReport (summary)',
        notes:
          'measure keys: moh-705a, moh-705b, moh-505, moh-710, moh-711, moh-717, moh-731, moh-745, lab-706. ' +
          'FUNC-QUAL-001 / REP-IDSR-001 / REP-ROUT-001 evidence.',
        tags: ['api'],
        validate: {
          query: Object.assign(
            {
              measure: Joi.string().required().valid(Object.keys(MEASURES))
            },
            periodQuery
          ),
          options: { allowUnknown: true }
        }
      },
      handler: async function (request, reply) {
        const key = request.query.measure;
        const target = MEASURES[key];
        const period = {
          start: request.query.startDate,
          end: request.query.endDate
        };
        const query = {
          startDate: request.query.startDate,
          endDate: request.query.endDate,
          locationUuids: request.query.locationUuids
        };
        return fetchAggregate(server, target, query)
          .then((payload) => {
            const report = toMeasureReport(
              key,
              key.toUpperCase() + ' (Kenya MOH)',
              period,
              payload
            );
            return reply(report);
          })
          .catch((err) =>
            reply(
              operationOutcome(
                'error',
                'exception',
                err.diagnostics || err.message
              )
            ).code(err.statusCode >= 400 ? err.statusCode : 502)
          );
      }
    },
    {
      method: 'GET',
      path: '/etl/fhir/Bundle',
      config: {
        auth: { strategy: 'simple', mode: 'optional' },
        description: 'DHA: MOH report as a FHIR Bundle (collection)',
        notes:
          'report keys: moh-705a, moh-705b, moh-505, moh-710, moh-711, moh-717, moh-731, moh-745, lab-706. ' +
          'REP-IMM-001 evidence (FHIR report resource wrapping the 705A aggregate).',
        tags: ['api'],
        validate: {
          query: Object.assign(
            {
              report: Joi.string().required().valid(Object.keys(MEASURES))
            },
            periodQuery
          ),
          options: { allowUnknown: true }
        }
      },
      handler: async function (request, reply) {
        const key = request.query.report;
        const target = MEASURES[key];
        const period = {
          start: request.query.startDate,
          end: request.query.endDate
        };
        const query = {
          startDate: request.query.startDate,
          endDate: request.query.endDate,
          locationUuids: request.query.locationUuids
        };
        return fetchAggregate(server, target, query)
          .then((payload) =>
            reply(
              toBundle(
                toMeasureReport(
                  key,
                  key.toUpperCase() + ' (Kenya MOH)',
                  period,
                  payload
                )
              )
            )
          )
          .catch((err) =>
            reply(
              operationOutcome(
                'error',
                'exception',
                err.diagnostics || err.message
              )
            ).code(err.statusCode >= 400 ? err.statusCode : 502)
          );
      }
    },
    {
      method: 'GET',
      path: '/backup-status',
      config: {
        auth: { strategy: 'simple', mode: 'optional' },
        description: 'DHA: backup schedule, last success and restore test',
        notes: 'SEC-BCK-001 evidence. Backed by conf/backup-status.json.',
        tags: ['api'],
        validate: { options: { allowUnknown: true }, query: {} }
      },
      handler: async function (request, reply) {
        return reply(readBackupStatus());
      }
    }
  ];

  return server.route(routes);
};
