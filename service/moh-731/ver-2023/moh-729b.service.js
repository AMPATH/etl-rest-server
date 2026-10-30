import { BaseMysqlReport } from '../../../app/reporting-framework/base-mysql.report';
import { widenToFacility } from '../../facility-locations/facility-locations.service';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const rowsOf = (report) => {
  const rows = report && report.results && report.results.results;
  return Array.isArray(rows) ? rows : [];
};

/**
 * The current active PrEP clients: each client's latest PrEP visit of the
 * month (the rows come oldest first), unless it discontinued PrEP.
 */
const currentOnPrep = (visits) =>
  latestPerClient(visits).filter(
    (visit) => visit.prep_status !== 'Discontinued'
  );

/** Each client's latest row (the rows come oldest first) */
const latestPerClient = (rows) => {
  const latest = new Map();
  rows.forEach((row) => latest.set(row.person_id, row));
  return [...latest.values()];
};

/**
 * MOH 729B Facility Monthly ARV Patient Summary (F-MAPS) for O3, for the month
 * ending on `endDate`, for the whole facility of the requested locations: one
 * row per client with the form's regimen code --
 *
 * - ART (adult, paediatric and PMTCT mothers): the clients active on ART in
 *   the HIV monthly report dataset, by their current ARVs (and a child's
 *   weight band);
 * - PrEP: the clients seen for PrEP in the month by MOH 731's PrEP section,
 *   at their latest visit, unless they discontinued;
 * - PEP: the clients given PEP in the month by MOH 731's PEP section, at
 *   their latest exposure, by the ARVs prescribed for it;
 * - Hepatitis B patients who are HIV-ve: the HIV-negative clients MOH 731 2.4
 *   counts as HBV positive at ANC in the month, at their latest visit;
 * - TPT HIV Positive: the clients MOH 731 3.4 counts as starting TPT this
 *   month, by the TPT drug started (6H or 3HP).
 *
 * The form counts these rows by code and its linelists list them, so both
 * always agree. Only plain YYYY-MM-DD dates are accepted (as for MOH 731).
 */
export function getMoh729b({ endDate, locations }) {
  if (!ISO_DATE.test(endDate || '')) {
    return Promise.reject(new Error('endDate must be YYYY-MM-DD'));
  }
  /* the route's pre-request step gives location ids as an array or a list */
  const ids = (Array.isArray(locations)
    ? locations
    : String(locations || '').split(',')
  )
    .map(Number)
    .filter(Number.isInteger);
  if (ids.length === 0) {
    return Promise.reject(new Error('No location given'));
  }
  const art = { endDate, locations: ids };
  const tpt = { endDate, locations: [...ids] };
  /* PrEP, PEP and Hepatitis B are counted over the calendar month that ends
     the period */
  const month = { startDate: `${endDate.slice(0, 8)}01`, endDate };
  const prep = { ...month, locations: [...ids] };
  const pep = { ...month, locations: [...ids] };
  const hbv = { ...month, locations: [...ids] };
  return widenToFacility(art, prep, pep, hbv, tpt)
    .then(() =>
      Promise.all([
        new BaseMysqlReport('moh731V2023Moh729b', art).generateReport(),
        new BaseMysqlReport('moh731V2023Moh729bPrep', prep).generateReport(),
        new BaseMysqlReport('moh731V2023Moh729bPep', pep).generateReport(),
        new BaseMysqlReport('moh731V2023Moh729bHbv', hbv).generateReport(),
        new BaseMysqlReport('moh731V2023Moh729bTpt', tpt).generateReport()
      ])
    )
    .then(([artReport, prepReport, pepReport, hbvReport, tptReport]) => [
      ...rowsOf(artReport),
      ...currentOnPrep(rowsOf(prepReport)),
      ...latestPerClient(rowsOf(pepReport)),
      ...latestPerClient(rowsOf(hbvReport)),
      ...rowsOf(tptReport)
    ]);
}
