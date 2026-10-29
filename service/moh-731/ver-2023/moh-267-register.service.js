import { BaseMysqlReport } from '../../../app/reporting-framework/base-mysql.report';
import { widenToFacility } from '../../facility-locations/facility-locations.service';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * MOH 267 PrEP daily activity register for O3: one row per PrEP visit, the same
 * visits as MOH 731 1.3 to 1.5 (its datasets, PrEP rules and one visit per
 * client per day), for the whole facility of the requested locations, with the
 * register's columns and the flags its summary tables count.
 *
 * Only plain YYYY-MM-DD dates are accepted (as for MOH 731).
 */
export function getMoh267Register({ startDate, endDate, locations }) {
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
      new BaseMysqlReport('moh731V2023Moh267Register', params).generateReport()
    )
    .then((report) => {
      const rows = report && report.results && report.results.results;
      return Array.isArray(rows) ? rows : [];
    });
}
