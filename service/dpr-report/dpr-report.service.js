import { MultiDatasetPatientlistReport } from '../../app/reporting-framework/multi-dataset-patientlist.report.js';

const moment = require('moment');
const dprSectionDefinitions = require('../../app/reporting-framework/json-reports/dqa/dpr/summaries/dpr-report-columns.json');

const DATE_FORMAT = 'YYYY-MM-DD';
const CSV_IDS = /^[0-9]+(\s*,\s*[0-9]+)*$/;
const CSV_CODES = /^[A-Za-z0-9]+(\s*,\s*[A-Za-z0-9]+)*$/;

export class DprReportService extends MultiDatasetPatientlistReport {
  constructor(reportName, params) {
    super(reportName, DprReportService.buildParams(params));
  }

  static buildParams(query) {
    const q = query || {};
    // Default 12-month cohort ART start window: last month. The 24-month
    // cohort defaults to the same window one year earlier.
    const lastMonth = moment().subtract(1, 'month');
    const m12Start = parseDate(
      q.startDate,
      lastMonth.clone().startOf('month').format(DATE_FORMAT),
      'startDate'
    );
    const m12End = parseDate(
      q.endDate,
      lastMonth.clone().endOf('month').format(DATE_FORMAT),
      'endDate'
    );
    if (m12End.isBefore(m12Start)) {
      throw new Error('endDate must be on or after startDate');
    }
    const m24Start = parseDate(
      q.m24StartDate,
      m12Start.clone().subtract(1, 'year').format(DATE_FORMAT),
      'm24StartDate'
    );
    const m24End = parseDate(
      q.m24EndDate,
      m12End.clone().subtract(1, 'year').format(DATE_FORMAT),
      'm24EndDate'
    );

    const locations = parseCsv(q.locations, CSV_IDS, 'locations');
    const siteCodes = parseCsv(q.siteCodes, CSV_CODES, 'siteCodes');
    const mflCodes = parseCsv(q.mflCodes, CSV_IDS, 'mflCodes');

    let studySitesOnly = locations ? '0' : '1';
    if (q.studySitesOnly === '0' || q.studySitesOnly === '1') {
      studySitesOnly = q.studySitesOnly;
    }

    return {
      m12StartDate: m12Start.format(DATE_FORMAT),
      m12EndDate: m12End.format(DATE_FORMAT),
      m24StartDate: m24Start.format(DATE_FORMAT),
      m24EndDate: m24End.format(DATE_FORMAT),
      m12Label: monthRangeLabel(m12Start, m12End),
      m24Label: monthRangeLabel(m24Start, m24End),
      studySitesOnly,
      locations: locations ? locations.map(Number) : undefined,
      siteCodes,
      mflCodes,
      materializeLimit: 1000000000
    };
  }

  generateReport(additionalParams) {
    const that = this;
    return new Promise((resolve, reject) => {
      super
        .generateReport(additionalParams)
        .then((results) => {
          let rows = [];
          results.forEach((reportItem) => {
            if (
              reportItem.results &&
              reportItem.results.results &&
              reportItem.results.results.results
            ) {
              rows = rows.concat(reportItem.results.results.results);
            }
          });
          if (results.length === 0) {
            return reject(new Error('DPR report failed to run'));
          }
          resolve({
            queriesAndSchemas: results,
            result: rows.map(formatRow),
            sectionDefinitions: dprSectionDefinitions,
            indicatorDefinitions: [],
            params: {
              m12Start: that.params.m12StartDate,
              m12End: that.params.m12EndDate,
              m24Start: that.params.m24StartDate,
              m24End: that.params.m24EndDate,
              studySitesOnly: that.params.studySitesOnly === '1'
            }
          });
        })
        .catch((error) => reject(error));
    });
  }
}

// mysql returns DATE columns as JS Dates at local midnight; serialise them as
// plain YYYY-MM-DD so JSON (UTC) conversion cannot shift the day.
function formatRow(row) {
  const out = {};
  Object.keys(row).forEach((key) => {
    const value = row[key];
    out[key] =
      value instanceof Date ? moment(value).format(DATE_FORMAT) : value;
  });
  return out;
}

function parseDate(value, fallback, name) {
  if (value === undefined || value === null || value === '') {
    return moment(fallback, DATE_FORMAT, true);
  }
  const parsed = moment(String(value).split('T')[0], DATE_FORMAT, true);
  if (!parsed.isValid()) {
    throw new Error(`${name} must be a date in YYYY-MM-DD format`);
  }
  return parsed;
}

// returns an array, or undefined when empty (so the json2sql filter is skipped)
function parseCsv(value, pattern, name) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const str = Array.isArray(value) ? value.join(',') : String(value);
  if (!pattern.test(str)) {
    throw new Error(`${name} must be a comma separated list`);
  }
  return str.replace(/\s/g, '').split(',');
}

// 'June-July 2025', 'June 2025', 'December 2024-January 2025'
function monthRangeLabel(start, end) {
  if (start.isSame(end, 'month')) {
    return end.format('MMMM YYYY');
  }
  const startFormat = start.isSame(end, 'year') ? 'MMMM' : 'MMMM YYYY';
  return `${start.format(startFormat)}-${end.format('MMMM YYYY')}`;
}
