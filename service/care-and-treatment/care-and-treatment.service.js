import { BaseMysqlReport } from '../../app/reporting-framework/base-mysql.report';
import { widenToFacility } from '../facility-locations/facility-locations.service';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/* The figures of careTreatmentBase (sections 1.1-1.7 and PMTCT VL tracking), each a 1/0 flag per client */
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
  'vl_none',
  'ti',
  'rtt',
  'rtt_lt3',
  'rtt_3_5',
  'rtt_3_5_cd4_lt_200',
  'rtt_3_5_cd4_ge_200',
  'rtt_3_5_cd4_percent',
  'rtt_3_5_cd4_unknown',
  'rtt_6_plus',
  'rtt_6_plus_cd4_lt_200',
  'rtt_6_plus_cd4_ge_200',
  'rtt_6_plus_cd4_percent',
  'rtt_6_plus_cd4_unknown',
  'ml_total',
  'ml_iit_lt3',
  'ml_iit_3_5',
  'ml_iit_6_plus',
  'ml_to',
  'ml_stopped',
  'ml_died',
  'ml_unknown',
  'cod_tb',
  'cod_cancer',
  'cod_hiv',
  'cod_other_hiv',
  'cod_other_natural',
  'cod_non_natural',
  'cod_unknown',
  'pmtct_pregnant_vl',
  'pmtct_pregnant_known_lt_50',
  'pmtct_pregnant_known_50_199',
  'pmtct_pregnant_known_200_999',
  'pmtct_pregnant_known_ge_1000',
  'pmtct_pregnant_new_lt_50',
  'pmtct_pregnant_new_50_199',
  'pmtct_pregnant_new_200_999',
  'pmtct_pregnant_new_ge_1000',
  'pmtct_bf_vl',
  'pmtct_bf_known_lt_50',
  'pmtct_bf_known_50_199',
  'pmtct_bf_known_200_999',
  'pmtct_bf_known_ge_1000',
  'pmtct_bf_new_lt_50',
  'pmtct_bf_new_50_199',
  'pmtct_bf_new_200_999',
  'pmtct_bf_new_ge_1000',
  'pmtct_other_vl',
  'pmtct_other_known_lt_50',
  'pmtct_other_known_50_199',
  'pmtct_other_known_200_999',
  'pmtct_other_known_ge_1000',
  'pmtct_other_new_lt_50',
  'pmtct_other_new_50_199',
  'pmtct_other_new_200_999',
  'pmtct_other_new_ge_1000'
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
 * Care & Treatment and ARV Management, sections 1.1-1.7 (Starting on ART,
 * Current on ART, months of ARVs dispensed, TX_PVLS, transfers in and TX_RTT,
 * TX_ML, the causes of death and PMTCT VL tracking), for the month ending
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
