import QueryService from '../../app/database-access/query.service';
import { widenToFacility } from '../facility-locations/facility-locations.service';

/**
 * Quality Improvement report: for a period (a month, or any dates from
 * startDate to endDate), at the whole facility of the requested locations, the
 * clients who need an action -- one list per indicator, and its count.
 *
 * Indicators of events (tests, screenings, contacts, infants' ages) read the
 * period itself. Those of a client's status on ART read the HIV monthly
 * dataset, which holds it at each month's end, so they read the month that
 * the period ends in -- or, while that month is not in the dataset yet, the
 * latest month that is (the status month, returned with the counts).
 *
 * Each indicator is a query giving one row per client (or, for PNS, per
 * contact) with `person_id`, `location_id` and its own detail columns. Its
 * values are named in the SQL and bound, so nothing from the request is put
 * into the query as text:
 * - `:L` the facility's location ids
 * - `:S`, `:E` and `:E_END` the period's first day, last day and last moment
 * - `:MS`, `:M` and `:M_END` the same for the status month
 */

/* from the HIV monthly dataset: on ART at the end of the month the period ends in */
const TX_CURR = `etl.hiv_monthly_report_dataset_frozen h
  WHERE h.endDate = :M AND h.location_id IN (:L)
    AND h.status = 'active' AND h.on_art_this_month = 1`;

/* each HEI's latest HIV encounter on or before the period's end, at the facility */
const HEI_LATEST = `etl.flat_hei_summary f
  WHERE f.location_id IN (:L) AND f.encounter_datetime <= :E_END
    AND (f.next_encounter_datetime_hiv IS NULL OR f.next_encounter_datetime_hiv > :E_END)`;

/* ... of those still in care: neither dead nor transferred out */
const HEI_AS_AT_END = `${HEI_LATEST}
    AND f.death_date IS NULL AND COALESCE(f.transfer_out, 0) <> 1`;

const HEI_COLUMNS = `SELECT f.person_id, f.location_id, DATE(f.birth_date) AS birth_date,
      DATE(f.encounter_datetime) AS last_visit_date`;

/* an HTS result of this encounter */
const hivResult = (alias, result) =>
  `EXISTS (SELECT 1 FROM amrs.obs r WHERE r.encounter_id = ${alias}.encounter_id
     AND r.concept_id = 1357 AND r.value_coded = ${result} AND r.voided = 0)`;

const obsOf = (alias, concept, values) =>
  `EXISTS (SELECT 1 FROM amrs.obs o WHERE o.encounter_id = ${alias}.encounter_id
     AND o.concept_id = ${concept} AND o.value_coded IN (${values}) AND o.voided = 0)`;

const PNS_RELATIONSHIPS = `'PARTNER-SPOUSE', 'PARTNER-OTHER', 'FELLOW-WIFE', 'INTRAVENOUS DRUG USE'`;

/* tested HIV positive in the period */
const NEW_POSITIVES = `
    SELECT e.patient_id AS person_id, MAX(e.location_id) AS location_id, DATE(MAX(e.encounter_datetime)) AS test_date
    FROM amrs.encounter e
    WHERE e.encounter_type IN (296, 297) AND e.voided = 0 AND e.location_id IN (:L)
      AND e.encounter_datetime BETWEEN :S AND :E_END
      AND ${hivResult('e', 703)}`;

/* ... with no linkage form and not enrolled in HIV care by its end */
const NOT_LINKED = `
      AND NOT EXISTS (SELECT 1 FROM amrs.encounter l WHERE l.patient_id = e.patient_id
        AND l.encounter_type = 290 AND l.voided = 0 AND l.encounter_datetime <= :E_END)
      AND NOT EXISTS (SELECT 1 FROM amrs.patient_program pp WHERE pp.patient_id = e.patient_id
        AND pp.program_id = 1 AND pp.voided = 0 AND pp.date_enrolled <= :E_END)`;

/* pregnant or breastfeeding women screened in the period: HIV negative, high or very high behaviour risk */
const HIGH_RISK_PBFW = `
    SELECT e.patient_id AS person_id, MAX(e.location_id) AS location_id,
      DATE(MAX(e.encounter_datetime)) AS screening_date
    FROM amrs.encounter e
    JOIN amrs.person p ON p.person_id = e.patient_id AND p.gender = 'F'
    WHERE e.encounter_type = 295 AND e.voided = 0 AND e.location_id IN (:L)
      AND e.encounter_datetime BETWEEN :S AND :E_END
      AND ${hivResult('e', 664)}
      AND ${obsOf('e', 12389, '12390, 9078')}
      AND (${obsOf('e', 8351, '1065')} OR ${obsOf('e', 2056, '1065')})`;

/* ... with no PrEP visit from 90 days before the screening to the period's end */
const NOT_ON_PREP = `
      AND NOT EXISTS (SELECT 1 FROM amrs.encounter pr WHERE pr.patient_id = e.patient_id
        AND pr.encounter_type IN (133, 134, 262, 263, 292, 303) AND pr.voided = 0
        AND pr.encounter_datetime BETWEEN DATE_SUB(e.encounter_datetime, INTERVAL 90 DAY) AND :E_END)`;

/* each client once, however many tests or screenings they had */
const BY_CLIENT = `
    GROUP BY e.patient_id`;

/* on ART, seen in the month while due for a viral load */
const VISITED_DUE_FOR_VL = `
    SELECT h.person_id, h.location_id, DATE(h.encounter_date) AS last_visit_date,
      h.vl_1 AS last_vl, DATE(h.vl_1_date) AS last_vl_date
    FROM ${TX_CURR}
      AND h.visit_this_month = 1 AND h.due_for_vl_this_month = 1`;

/* on ART, unsuppressed (>= 200) on a viral load taken over 2 weeks before the month's end */
const UNSUPPRESSED = `
    SELECT h.person_id, h.location_id, h.vl_1 AS last_vl, DATE(h.vl_1_date) AS last_vl_date,
      DATEDIFF(:M, h.vl_1_date) AS days_since_vl
    FROM ${TX_CURR} AND h.vl_in_past_year = 1 AND h.vl_1 >= 200
      AND h.vl_1_date <= DATE_SUB(:M, INTERVAL 14 DAY)`;

/* infants 6-8 weeks old at some time in the period */
const HEI_6_TO_8_WEEKS = `
    ${HEI_COLUMNS}
    FROM ${HEI_AS_AT_END}
      AND f.birth_date BETWEEN DATE_SUB(:S, INTERVAL 8 WEEK) AND DATE_SUB(:E, INTERVAL 6 WEEK)`;

/* infants who turned 24 months in the period, whatever became of them */
const HEI_24_MONTHS = `
    ${HEI_COLUMNS}
    FROM ${HEI_LATEST}
      AND f.birth_date BETWEEN DATE_SUB(:S, INTERVAL 24 MONTH) AND DATE_SUB(:E, INTERVAL 24 MONTH)`;

/* the Quality Improvement report's indicators */
export const INDICATORS = {
  /* tested HIV positive in the period, with no linkage form and not enrolled in HIV care by its end */
  'hiv-positive-not-linked': NEW_POSITIVES + NOT_LINKED + BY_CLIENT,

  /* high risk negative pregnant or breastfeeding women with no PrEP visit */
  'high-risk-pbf-not-on-prep': HIGH_RISK_PBFW + NOT_ON_PREP + BY_CLIENT,

  /* sexual and needle-sharing partners elicited by the period's end whose HIV
     status is neither recorded nor tested */
  'pns-undocumented-status': `
    SELECT t.patient_id AS person_id, t.location_id, t.fm_name AS contact_name,
      t.relationship_type AS relationship, t.fm_age AS contact_age, t.fm_gender AS contact_sex,
      t.fm_phone AS contact_phone, DATE(t.date_elicited) AS date_elicited
    FROM etl.flat_family_testing t
    WHERE t.location_id IN (:L) AND t.date_elicited <= :E_END
      AND t.relationship_type IN (${PNS_RELATIONSHIPS})
      AND COALESCE(t.fm_status, '') NOT IN ('NEGATIVE', 'POSITIVE')
      AND COALESCE(t.test_result, 0) NOT IN (664, 703)`,

  /* seen while due for a viral load, with none ordered or resulted in the month */
  'missed-vl-testing': `${VISITED_DUE_FOR_VL}
      AND COALESCE(h.has_vl_this_month, 0) = 0
      AND NOT EXISTS (SELECT 1 FROM etl.flat_hiv_summary_v15b v WHERE v.person_id = h.person_id
        AND v.vl_order_date BETWEEN :MS AND :M_END)`,

  'viral-load-200-plus': `
    SELECT h.person_id, h.location_id, h.vl_1 AS last_vl, DATE(h.vl_1_date) AS last_vl_date
    FROM ${TX_CURR} AND h.vl_in_past_year = 1 AND h.vl_1 >= 200`,

  'viral-load-1000-plus': `
    SELECT h.person_id, h.location_id, h.vl_1 AS last_vl, DATE(h.vl_1_date) AS last_vl_date
    FROM ${TX_CURR} AND h.vl_in_past_year = 1 AND h.vl_1 >= 1000`,

  /* unsuppressed for over 2 weeks with no enhanced adherence session since the sample */
  'delayed-eac': `${UNSUPPRESSED}
      AND NOT EXISTS (SELECT 1 FROM amrs.encounter a WHERE a.patient_id = h.person_id
        AND a.encounter_type = 279 AND a.voided = 0
        AND a.encounter_datetime BETWEEN h.vl_1_date AND :M_END)`,

  /* missed their appointment, by 1-30 days at the month's end */
  'recent-defaulters': `
    SELECT h.person_id, h.location_id, DATE(h.encounter_date) AS last_visit_date,
      DATE(h.rtc_date) AS rtc_date, h.days_since_rtc_date AS days_missed
    FROM ${TX_CURR} AND h.days_since_rtc_date BETWEEN 1 AND 30`,

  /* on ART, aged 10-19, not enrolled in OTZ at the month's end */
  'adolescent-not-in-otz': `
    SELECT h.person_id, h.location_id, DATE(h.encounter_date) AS last_visit_date
    FROM ${TX_CURR} AND FLOOR(h.age) BETWEEN 10 AND 19
      AND NOT EXISTS (SELECT 1 FROM amrs.patient_program pp WHERE pp.patient_id = h.person_id
        AND pp.program_id = 53 AND pp.voided = 0 AND pp.date_enrolled <= :M
        AND (pp.date_completed IS NULL OR pp.date_completed > :M))`,

  /* 6-8 weeks old in the period with no DNA PCR result by its end */
  'hei-without-dna-pcr': `${HEI_6_TO_8_WEEKS}
      AND NOT (COALESCE(f.hiv_dna_pcr_1_date <= :E_END, 0) = 1)`,

  /* HEIs in care under 2 years with no mother linked */
  'hei-not-linked-to-mother': `
    ${HEI_COLUMNS}
    FROM ${HEI_AS_AT_END}
      AND f.hei_outcome IS NULL AND f.birth_date > DATE_SUB(:E, INTERVAL 24 MONTH)
      AND f.mother_person_id IS NULL
      AND NOT EXISTS (SELECT 1 FROM amrs.relationship r WHERE r.person_b = f.person_id
        AND r.relationship = 2 AND r.voided = 0)`,

  /* HEIs 2 years and over, still in care, with no final outcome (the whole backlog) */
  'hei-without-outcome': `
    ${HEI_COLUMNS}
    FROM ${HEI_AS_AT_END}
      AND f.hei_outcome IS NULL AND f.birth_date <= DATE_SUB(:E, INTERVAL 24 MONTH)`
};

/**
 * The Case Surveillance report's cards: each a gap (the clients needing the
 * action) out of the clients it applies to, for the period. Most gaps are the
 * Quality Improvement indicators above.
 */
export const CASE_SURVEILLANCE = {
  'not-linked': {
    numerator: 'hiv-positive-not-linked',
    denominator: 'cs-new-positives'
  },
  'pbfw-not-on-prep': {
    numerator: 'high-risk-pbf-not-on-prep',
    denominator: 'cs-high-risk-pbfw'
  },
  'delayed-eac': { numerator: 'delayed-eac', denominator: 'cs-unsuppressed' },
  'missed-vl': {
    numerator: 'missed-vl-testing',
    denominator: 'cs-visited-due-for-vl'
  },
  'hei-without-pcr': {
    numerator: 'hei-without-dna-pcr',
    denominator: 'cs-hei-6-8-weeks'
  },
  'hei-without-outcome': {
    numerator: 'cs-hei-24-months-without-outcome',
    denominator: 'cs-hei-24-months'
  }
};

/* the Case Surveillance figures that are not Quality Improvement indicators */
const CASE_SURVEILLANCE_INDICATORS = {
  'cs-new-positives': NEW_POSITIVES + BY_CLIENT,
  'cs-high-risk-pbfw': HIGH_RISK_PBFW + BY_CLIENT,
  'cs-unsuppressed': UNSUPPRESSED,
  'cs-visited-due-for-vl': VISITED_DUE_FOR_VL,
  'cs-hei-6-8-weeks': HEI_6_TO_8_WEEKS,
  'cs-hei-24-months': HEI_24_MONTHS,
  /* turned 24 months in the period, neither dead, transferred out nor given an outcome */
  'cs-hei-24-months-without-outcome': `${HEI_24_MONTHS}
      AND f.hei_outcome IS NULL AND f.death_date IS NULL AND COALESCE(f.transfer_out, 0) <> 1`
};

/* every list a report can open */
const ALL_INDICATORS = { ...INDICATORS, ...CASE_SURVEILLANCE_INDICATORS };

/* the named values (see the top) -> bound values */
function bind(sql, { locations, startDate, endDate, statusMonth }) {
  const named = {
    L: locations,
    S: startDate,
    E: endDate,
    E_END: `${endDate} 23:59:59`,
    MS: `${statusMonth.slice(0, 7)}-01`,
    M: statusMonth,
    M_END: `${statusMonth} 23:59:59`
  };
  const values = [];
  const text = sql.replace(/:(E_END|M_END|MS|L|S|E|M)\b/g, (match, name) => {
    values.push(named[name]);
    return '?';
  });
  return [text, values];
}

/* YYYY-MM-DD -> the last day of its month, YYYY-MM-DD */
function lastDayOfMonth(date) {
  const [year, month] = date.split('-').map(Number);
  const day = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${date.slice(0, 7)}-${String(day).padStart(2, '0')}`;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The period from startDate (the first of endDate's month when absent) to
 * endDate, at the requested locations (ids, as an array or a list)
 */
function periodOf({ startDate, endDate, locations }) {
  const start = startDate || `${String(endDate).slice(0, 7)}-01`;
  if (!ISO_DATE.test(endDate || '') || !ISO_DATE.test(start)) {
    throw new Error('startDate and endDate must be YYYY-MM-DD');
  }
  if (start > endDate) {
    throw new Error('startDate must be on or before endDate (YYYY-MM-DD)');
  }
  const ids = (Array.isArray(locations)
    ? locations
    : String(locations || '').split(',')
  )
    .map(Number)
    .filter(Number.isInteger);
  if (ids.length === 0) {
    throw new Error('No location given');
  }
  return { startDate: start, endDate, locations: ids };
}

const run = (sql, params) =>
  new QueryService().executeQuery(...bind(sql, params));

const CACHE_MS = 10 * 60 * 1000;
let latestMonth = null;

/* the last month in the HIV monthly dataset, YYYY-MM-DD; looked up every 10 minutes at most */
function latestStatusMonth() {
  if (!latestMonth || latestMonth.expires < Date.now()) {
    const result = Promise.resolve(
      new QueryService().executeQuery(
        `SELECT DATE_FORMAT(MAX(endDate), '%Y-%m-%d') AS month FROM etl.hiv_monthly_report_dataset_frozen`
      )
    ).then((rows) => rows[0].month);
    latestMonth = { result, expires: Date.now() + CACHE_MS };
    result.catch(() => {
      latestMonth = null;
    });
  }
  return latestMonth.result;
}

/* the period, the facility's locations and the status month, ready to bind */
function prepare(query) {
  let params;
  try {
    params = periodOf(query);
  } catch (error) {
    return Promise.reject(error);
  }
  return Promise.all([widenToFacility(params), latestStatusMonth()]).then(
    ([, latest]) => {
      const monthEnd = lastDayOfMonth(params.endDate);
      params.statusMonth = latest && latest < monthEnd ? latest : monthEnd;
      return params;
    }
  );
}

/* the counts of these indicators for the period, side by side, with the status month */
function countsOf(indicators, query) {
  return prepare(query).then((params) =>
    Promise.all(
      indicators.map((indicator) =>
        run(
          `SELECT COUNT(*) AS n FROM (${ALL_INDICATORS[indicator]}) q`,
          params
        ).then((rows) => [indicator, Number(rows[0].n)])
      )
    ).then((entries) => ({
      statusMonth: params.statusMonth,
      counts: Object.fromEntries(entries)
    }))
  );
}

/**
 * Every Quality Improvement indicator's count for the period:
 * `{ statusMonth, counts: { indicator: count } }`
 */
export function getQualityImprovement(query) {
  return countsOf(Object.keys(INDICATORS), query);
}

/**
 * Every Case Surveillance card for the period, as `{ statusMonth, cards: { card:
 * { numerator, denominator, numeratorIndicator, denominatorIndicator } } }`;
 * each indicator's clients come from getQualityImprovementPatientList.
 */
export function getCaseSurveillance(query) {
  const indicators = [
    ...new Set(
      Object.values(CASE_SURVEILLANCE).flatMap((card) => [
        card.numerator,
        card.denominator
      ])
    )
  ];
  return countsOf(indicators, query).then(({ statusMonth, counts }) => ({
    statusMonth,
    cards: Object.fromEntries(
      Object.entries(CASE_SURVEILLANCE).map(
        ([card, { numerator, denominator }]) => [
          card,
          {
            numerator: counts[numerator],
            denominator: counts[denominator],
            numeratorIndicator: numerator,
            denominatorIndicator: denominator
          }
        ]
      )
    )
  }));
}

/**
 * The clients of one indicator, a page of `limit` from `startIndex`, with
 * their names and identifiers.
 */
export function getQualityImprovementPatientList(query) {
  try {
    if (
      !Object.prototype.hasOwnProperty.call(ALL_INDICATORS, query.indicator)
    ) {
      throw new Error('Unknown indicator');
    }
  } catch (error) {
    return Promise.reject(error);
  }
  const limit = Math.min(Math.max(Number(query.limit) || 500, 1), 5000);
  const startIndex = Math.max(Number(query.startIndex) || 0, 0);
  const identifier = (
    type
  ) => `(SELECT pi.identifier FROM amrs.patient_identifier pi
    WHERE pi.patient_id = q.person_id AND pi.identifier_type = ${type} AND pi.voided = 0
    ORDER BY pi.preferred DESC, pi.patient_identifier_id DESC LIMIT 1)`;
  const sql = `SELECT q.*, p.uuid AS patient_uuid,
      CONCAT_WS(' ', pn.given_name, pn.middle_name, pn.family_name) AS full_name,
      ${identifier(28)} AS ccc_number, ${identifier(8)} AS amrs_number,
      ${identifier(38)} AS hei_number, ${identifier(44)} AS prep_number,
      p.gender, TIMESTAMPDIFF(YEAR, p.birthdate, :E) AS age, l.name AS location
    FROM (${ALL_INDICATORS[query.indicator]}) q
    JOIN amrs.person p ON p.person_id = q.person_id
    LEFT JOIN amrs.person_name pn ON pn.person_name_id = (SELECT pn2.person_name_id
      FROM amrs.person_name pn2 WHERE pn2.person_id = q.person_id AND pn2.voided = 0
      ORDER BY pn2.preferred DESC, pn2.person_name_id DESC LIMIT 1)
    LEFT JOIN amrs.location l ON l.location_id = q.location_id
    ORDER BY full_name, q.person_id
    LIMIT ${limit} OFFSET ${startIndex}`;
  return prepare(query).then((params) => run(sql, params));
}
