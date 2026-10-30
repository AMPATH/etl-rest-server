import { BaseMysqlReport } from '../app/reporting-framework/base-mysql.report';
import { widenToFacility } from './facility-locations/facility-locations.service';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * TB presumptive register for O3: one row per TB presumptive encounter (type
 * 331) in the period, for the whole facility of the requested locations, with
 * the register's columns A to R and the investigation outcome (DRTB, DSTB,
 * No TB) worked out from the smear, culture, resistance and x-ray results.
 *
 * Only plain YYYY-MM-DD dates are accepted (as for the MOH 731 registers).
 */
export function getTbPresumptiveRegister({ startDate, endDate, locations }) {
  if (!ISO_DATE.test(startDate || '') || !ISO_DATE.test(endDate || '')) {
    return Promise.reject(
      new Error('startDate and endDate must be YYYY-MM-DD')
    );
  }
  /* the route's pre-request step gives location ids as an array or a list */
  const ids = (Array.isArray(locations)
    ? locations
    : String(locations || '').split(',')
  )
    .map(Number)
    .filter(Number.isInteger);
  const params = { startDate, endDate, locations: ids };
  if (params.locations.length === 0) {
    return Promise.reject(new Error('No location given'));
  }
  return widenToFacility(params)
    .then(() =>
      new BaseMysqlReport('tbPresumptiveRegister', params).generateReport()
    )
    .then((report) => {
      const rows = report && report.results && report.results.results;
      return Array.isArray(rows) ? rows : [];
    });
}
