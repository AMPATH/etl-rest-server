import { BaseMysqlReport } from '../../app/reporting-framework/base-mysql.report';
import { widenToFacility } from '../facility-locations/facility-locations.service';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/* The figures of careTreatmentBase (sections 1.1-1.4), each a 1/0 flag per client */
const INDICATORS = new Set([
  'tx_new',
  'tx_new_cd4_lt_200',
  'tx_new_cd4_ge_200',
  'tx_new_cd4_percent',
  'tx_new_cd4_unknown',
  'tx_new_pregnant',
  'tx_new_breastfeeding',
  'tx_new_tb',
  'tx_new_tpt',
  'tx_curr',
  'tx_curr_lt6m_well',
  'tx_curr_lt6m_advanced',
  'tx_curr_lt6m_stage_unknown',
  'tx_curr_6m_not_established',
  'tx_curr_6m_established',
  'tx_curr_6m_stability_unknown',
  'mmd_1',
  'mmd_2',
  'mmd_3',
  'mmd_4',
  'mmd_5',
  'mmd_6_plus',
  'mmd_unknown',
  'vl_eligible',
  'vl_lt_50',
  'vl_50_199',
  'vl_200_999',
  'vl_ge_1000',
  'vl_none'
]);

const AGE_BANDS = new Set([
  'all',
  'under_1',
  '1_4',
  '5_9',
  '10_14',
  '15_19',
  '20_24',
  '25_29',
  '30_34',
  '35_39',
  '40_44',
  '45_49',
  '50_54',
  '55_59',
  '60_64',
  '65_plus'
]);

const GENDERS = new Set(['all', 'F', 'M']);
const MCH = new Set(['all', '1']);

const rowsOf = (report) => {
  const rows = report && report.results && report.results.results;
  return Array.isArray(rows) ? rows : [];
};

/** The month ending on endDate, at the requested locations (ids, as an array or a list) */
function periodOf({ endDate, locations }) {
  if (!ISO_DATE.test(endDate || '')) {
    throw new Error('endDate must be YYYY-MM-DD');
  }
  /* the route's pre-request step gives location ids as an array or a list */
  const ids = (Array.isArray(locations)
    ? locations
    : String(locations || '').split(',')
  )
    .map(Number)
    .filter(Number.isInteger);
  if (ids.length === 0) {
    throw new Error('No location given');
  }
  return { endDate, locations: ids };
}

/**
 * Care & Treatment and ARV Management, sections 1.1-1.4 (Starting on ART,
 * Current on ART, months of ARVs dispensed and TX_PVLS), for the month ending
 * on endDate, for the whole facility of the requested locations.
 *
 * Returns each figure added up by age band, sex and MCH/PMTCT (careTreatmentAggregate):
 * a few dozen rows however large the facility, which the report adds up into
 * its tables. The clients behind a figure come from getCareAndTreatmentPatientList.
 */
export function getCareAndTreatment(query) {
  let params;
  try {
    params = periodOf(query);
  } catch (error) {
    return Promise.reject(error);
  }
  return widenToFacility(params)
    .then(() =>
      new BaseMysqlReport('careTreatmentAggregate', params).generateReport()
    )
    .then(rowsOf);
}

/**
 * The clients behind one figure of the report: `indicator` (one of its flags),
 * narrowed to an age band, sex and MCH/PMTCT unless they are 'all', a page of
 * `limit` from `startIndex`. These go into the query as text, so each is
 * checked against the known values first.
 */
export function getCareAndTreatmentPatientList(query) {
  let params;
  try {
    params = periodOf(query);
    const { indicator, ageBand = 'all', gender = 'all', mch = 'all' } = query;
    if (!INDICATORS.has(indicator)) {
      throw new Error('Unknown indicator');
    }
    if (!AGE_BANDS.has(ageBand) || !GENDERS.has(gender) || !MCH.has(mch)) {
      throw new Error('Unknown age band, gender or mch');
    }
    Object.assign(params, {
      indicator,
      ageBand,
      gender,
      mch,
      limit: Math.min(Math.max(Number(query.limit) || 500, 1), 5000),
      startIndex: Math.max(Number(query.startIndex) || 0, 0)
    });
  } catch (error) {
    return Promise.reject(error);
  }
  return widenToFacility(params)
    .then(() =>
      new BaseMysqlReport('careTreatmentPatientList', params).generateReport()
    )
    .then(rowsOf);
}
