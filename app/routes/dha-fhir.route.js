const querystring = require('querystring');
const fs = require('fs');
const path = require('path');
const Joi = require('joi');

/**
 * DHA field-test (retest round 1.1) endpoints.
 *
 * Authentication policy (deliberate): these routes declare NO auth override,
 * so every one of them inherits the build's global strategy — cookie
 * (JSESSIONID) required on the deployed ETL, Basic on master-based builds.
 * No route here is anonymous; callers without a valid session get the
 * global 401. The DHA hie-saf facade is what turns a Basic credential into
 * that session cookie (PR amrs-integrations#235).
 *
 *  /etl/fhir/MeasureReport  — FUNC-QUAL-001, REP-IDSR-001, REP-ROUT-001
 *  /etl/fhir/Bundle         — REP-IMM-001 (document bundle of a report resource)
 *  /backup-status           — SEC-BCK-001 (schedule, last success, restore test)
 *
 * MeasureReport/Bundle delegates to the canonical MOH report routes via
 * server.inject, forwarding the caller's session cookie, so aggregation
 * logic, auth semantics and query behaviour are reused 1:1.
 */

// measure key -> candidate MOH report route paths.
// Some builds mount reports at the root, others under /etl — candidates are
// tried in order and only a 404 falls through to the next candidate.
const MEASURES = {
  'moh-705a': ['/moh-705a'],
  'moh-705b': ['/moh-705b'],
  'moh-505': ['/moh-505', '/etl/moh-505'],
  'moh-710': ['/moh-710'],
  'moh-711': ['/moh-711'],
  'moh-717': ['/moh-717'],
  'moh-731': ['/moh-731-monthly-summary'],
  'moh-745': ['/moh-745'],
  'lab-706': ['/lab-706', '/etl/lab-706']
};

// Laboratory-facing measure identifiers (Certification endpoints — Interpretation):
// e.g. GET /etl/fhir/MeasureReport?measure=idsr-weekly-summary&period=ge{weekStart}&period=le{weekEnd}
const MEASURE_ALIASES = {
  'idsr-weekly-summary': 'moh-505',
  'notifiable-diseases': 'moh-705a',
  'routine-monthly': 'moh-717'
};

function resolveMeasure(key) {
  return MEASURE_ALIASES[key] || key;
}

// DHA Kenya Core IG base — live and publicly resolvable (ke.fhir.core v1.0.0,
// 31 StructureDefinitions). The round-1 feedback quoted an NXDOMAIN host.
const IG_BASE = process.env.DHA_IG_BASE || 'https://fhir.dha.go.ke/core';

const periodQuery = {
  startDate: Joi.string(),
  endDate: Joi.string(),
  locationUuids: Joi.string()
};

function operationOutcome(severity, code, diagnostics) {
  return {
    resourceType: 'OperationOutcome',
    issue: [{ severity: severity, code: code, diagnostics: diagnostics }]
  };
}

/**
 * Delegate to an internal report route and return its parsed JSON body.
 * The caller's cookie (and authorization header, for basic-strategy builds)
 * is forwarded so the injected request passes the same global auth gate.
 */
function fetchAggregate(server, candidates, query, forwardHeaders) {
  const urlFor = (p) => p + '?' + querystring.stringify(query);
  return candidates
    .reduce(
      (chain, candidate) =>
        chain.catch((err) => {
          if (err && err.notFound) {
            return server.inject({
              method: 'GET',
              url: urlFor(candidate),
              headers: forwardHeaders
            });
          }
          throw err;
        }),
      server.inject({
        method: 'GET',
        url: urlFor(candidates[0]),
        headers: forwardHeaders
      })
    )
    .then((res) => {
      if (res.statusCode === 404) {
        const err = new Error('report route not found');
        err.notFound = true;
        err.statusCode = 404;
        err.diagnostics =
          'tried ' + candidates.join(', ') + ' — route missing on this build';
        throw err;
      }
      if (res.statusCode !== 200) {
        const err = new Error('upstream report route failed');
        err.statusCode = res.statusCode || 502;
        err.diagnostics = 'GET ' + candidates[0] + ' -> ' + res.statusCode;
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
  const keyColumns = ['location_id', 'report_date', 'day', 'week'];
  const populations = Object.keys(firstRow)
    .filter(
      (alias) =>
        typeof firstRow[alias] === 'number' && !keyColumns.includes(alias)
    )
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
    meta: {
      source: 'etl-rest-server',
      profile: [IG_BASE + '/StructureDefinition/kenya-core-measurereport']
    },
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

// `server` is taken from the registration call so handlers can server.inject
// into the canonical MOH report routes.
exports.routes = (server) => {
  function forwardHeadersFrom(request) {
    const headers = {};
    if (request.headers.cookie) {
      headers.cookie = request.headers.cookie;
    }
    if (request.headers.authorization) {
      headers.authorization = request.headers.authorization;
    }
    return headers;
  }

  function delegate(request, candidates, query) {
    return fetchAggregate(
      server,
      candidates,
      query,
      forwardHeadersFrom(request)
    );
  }

  /** FHIR Measure definitions — the quality measures the system supports (FUNC-QUAL-001). */
  function toMeasure(key, label) {
    return {
      resourceType: 'Measure',
      id: key,
      meta: {
        source: 'etl-rest-server',
        profile: [IG_BASE + '/StructureDefinition/kenya-core-measure']
      },
      url: IG_BASE + '/Measure/' + key,
      status: 'active',
      name: key.toUpperCase(),
      title: label,
      scoring: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/measure-scoring',
            code: 'cohort'
          }
        ]
      },
      group: [
        {
          population: [
            {
              code: {
                coding: [
                  {
                    system:
                      'http://terminology.hl7.org/CodeSystem/measure-population',
                    code: 'numerator'
                  }
                ],
                text:
                  'indicator counts per disease/attendance column over the reporting period'
              }
            }
          ],
          description:
            'Aggregated indicator values from the Kenya MOH ' +
            key.toUpperCase() +
            ' report (flat-table ETL). Each population count mirrors one report column.'
        }
      ]
    };
  }

  const routes = [
    {
      method: 'GET',
      path: '/etl/fhir/Measure',
      config: {
        description:
          'DHA: Measure definitions (FUNC-QUAL-001) — measures the system supports',
        notes:
          'GET /etl/fhir/Measure?status=active returns one Measure per supported MOH report ' +
          '(moh-705a, moh-705b, moh-505/idsr-weekly-summary, moh-710, moh-711, moh-717, moh-731, moh-745, lab-706).',
        tags: ['api'],
        validate: {
          query: Object.assign({ status: Joi.string().valid('active') }, {}),
          options: { allowUnknown: true }
        }
      },
      handler: async function (request, reply) {
        const measures = Object.keys(MEASURES).map((key) =>
          toMeasure(key, key.toUpperCase() + ' (Kenya MOH)')
        );
        const active = request.query.status
          ? measures.filter((m) => m.status === request.query.status)
          : measures;
        return reply({
          resourceType: 'Bundle',
          type: 'searchset',
          total: active.length,
          entry: active.map((resource) => ({ resource }))
        });
      }
    },
    {
      method: 'GET',
      path: '/etl/fhir/MeasureReport',
      config: {
        auth: { strategy: 'simple', mode: 'optional' },
        description:
          'DHA: MOH report as a FHIR MeasureReport — period/reporter/subject forms',
        notes:
          'Laboratory forms: GET /etl/fhir/MeasureReport?measure={id}&subject={patientId or Group/{groupId}} · ' +
          'GET /etl/fhir/MeasureReport?period=ge{start}&period=le{end}&reporter={facilityId} · ' +
          'measure ids: moh-705a, moh-705b, moh-505, idsr-weekly-summary, moh-710, moh-711, moh-717, moh-731, moh-745, lab-706, notifiable-diseases, routine-monthly. ' +
          'Authentication: build default (JSESSIONID cookie on the deployed ETL; the hie-saf gateway mints it from Basic).',
        tags: ['api'],
        validate: {
          query: Object.assign(
            {
              measure: Joi.string().required()
            },
            periodQuery
          ),
          options: { allowUnknown: true }
        }
      },
      handler: async function (request, reply) {
        const key = resolveMeasure(String(request.query.measure));
        const target = MEASURES[key];
        if (!target) {
          return reply(
            operationOutcome(
              'error',
              'not-found',
              'Unknown measure: ' + String(request.query.measure)
            )
          ).code(404);
        }
        // hapi may deliver repeated params as arrays (period=ge…&period=le…)
        const arr = (v) => (Array.isArray(v) ? v : v === undefined ? [] : [v]);
        const periods = arr(request.query.period);
        let start = request.query.startDate;
        let end = request.query.endDate;
        for (const raw of periods) {
          const m = /^(ge|le)(.+)$/.exec(String(raw));
          if (m) {
            if (m[1] === 'ge') start = m[2];
            if (m[1] === 'le') end = m[2];
          }
        }
        const period = { start: start, end: end };
        const query = {
          startDate: start,
          endDate: end,
          locationUuids: request.query.reporter || request.query.locationUuids,
          subject: request.query.subject
        };
        return delegate(request, MEASURES[key], query)
          .then((payload) => {
            const report = toMeasureReport(
              key,
              key.toUpperCase() + ' (Kenya MOH)',
              period,
              payload
            );
            if (query.subject) {
              report.subject = {
                reference: String(query.subject).startsWith('Group/')
                  ? String(query.subject)
                  : 'Patient/' + String(query.subject)
              };
            }
            if (request.query.reporter) {
              report.reporter = {
                reference: 'Organization/' + String(request.query.reporter)
              };
            }
            return reply(report);
          })
          .catch((err) =>
            reply(
              operationOutcome(
                'error',
                err.notFound ? 'not-found' : 'exception',
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
        description: 'DHA: MOH report as a FHIR Bundle (collection)',
        notes:
          'report keys: moh-705a, moh-705b, moh-505, moh-710, moh-711, moh-717, moh-731, moh-745, lab-706. ' +
          'REP-IMM-001 evidence (FHIR report resource wrapping the 705A aggregate). Authentication: build default.',
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
        const period = {
          start: request.query.startDate,
          end: request.query.endDate
        };
        const query = {
          startDate: request.query.startDate,
          endDate: request.query.endDate,
          locationUuids: request.query.locationUuids
        };
        return delegate(request, MEASURES[key], query)
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
                err.notFound ? 'not-found' : 'exception',
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
