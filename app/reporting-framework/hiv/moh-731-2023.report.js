import { MultiDatasetPatientlistReport } from '../multi-dataset-patientlist.report';
import { Promise } from 'bluebird';
const Moment = require('moment');

/**
 * MOH 731 (Ver. July 2023).
 *
 * Reads the same monthly dataset the 2017 report reads; what changed is the age
 * banding on the form, which the report's base dataset carries.
 *
 * A section is aggregated separately from the others and the aggregations run
 * concurrently, so the report costs the slowest section rather than the sum of
 * them, and a caller that wants one section pays for one section.
 */

/**
 * Aggregation schemas behind each numbered section of the form. A section reads
 * more than one where its sub sections do not share a source: section 3 counts
 * treatment off the monthly dataset and nutrition off the observations, so it
 * cannot be one pass however it is written.
 */
const SECTION_REPORTS = {
  3: ['Moh7312023Section3Aggregation', 'Moh7312023NutritionAggregation']
};

/**
 * Schemas used when drilling into a box rather than reading the report. These
 * carry the disaggregation as columns, which is what lets a dc__ indicator name
 * a single cell of the form and be turned into a filter on the base.
 */
const SECTION_PATIENT_LIST_REPORTS = {
  3: ['Moh7312023Section3PatientList', 'Moh7312023NutritionAggregation']
};

export class Moh7312023Report extends MultiDatasetPatientlistReport {
  constructor(reportName, params) {
    if (params.isAggregated) {
      params.excludeParam = ['location_id'];
      params.joinColumnParam = 'join_location';
    }
    // Defaults to the frozen dataset; determineMohReportSourceTables settles it
    // against the last released month before the query is built.
    params.hivMonthlyDatasetSource = 'etl.hiv_monthly_report_dataset_frozen';
    // The clinical detail a patient list is read with. Only the patient list
    // base joins this, so counting never pays for it.
    // The latest CD4 of either kind. A lateral flow is a CD4 result, so a
    // patient who has had one is not a patient with no CD4 done; taking the
    // most recent row of either kind keeps the two on the same footing.
    params.cd4DataSource =
      '(SELECT fli.person_id, fli.cd4_count, fli.cd4_lateral_flow, fli.test_datetime AS cd4_test_datetime FROM etl.flat_labs_and_imaging fli INNER JOIN (SELECT person_id, MAX(test_datetime) AS latest_cd4_datetime FROM etl.flat_labs_and_imaging WHERE cd4_count IS NOT NULL OR cd4_lateral_flow IS NOT NULL GROUP BY person_id) latest ON latest.person_id = fli.person_id AND latest.latest_cd4_datetime = fli.test_datetime WHERE fli.cd4_count IS NOT NULL OR fli.cd4_lateral_flow IS NOT NULL)';
    super(reportName, params);
    this.requestedSections = Moh7312023Report.resolveSections(params.sections);
  }

  /**
   * Sections the caller asked for, defaulting to all of them. Unknown sections
   * are dropped rather than failing the request, so a frontend can ask for a
   * section this build does not implement yet without breaking.
   */
  static resolveSections(requested) {
    const known = Object.keys(SECTION_REPORTS);
    if (!requested) {
      return known;
    }
    const asked = String(requested)
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const wanted = asked.filter((s) => known.indexOf(s) !== -1);
    return wanted.length > 0 ? wanted : known;
  }

  /**
   * Only the aggregations for the requested sections are initialised, so an
   * unwanted section is never queried.
   */
  _intializeReportHandlers() {
    const that = this;
    const schemas = this.patientListMode
      ? SECTION_PATIENT_LIST_REPORTS
      : SECTION_REPORTS;
    this.reportHandlers = [];
    this.requestedSections.forEach((section) => {
      schemas[section].forEach((schema) => {
        that.reportHandlers.push(that.getReportHandler(schema, that.params));
      });
    });
  }

  /**
   * Drilling into a box reads the disaggregated schemas rather than the flat
   * ones the report is built from, since only they name the cell being asked
   * about.
   */
  generatePatientListReport(indicators) {
    this.patientListMode = true;
    return super.generatePatientListReport(indicators);
  }

  async generateReport(additionalParams) {
    await this.determineMohReportSourceTables();

    const startedAt = Date.now();
    const results = await super.generateReport(additionalParams);

    if (additionalParams && additionalParams.type === 'patient-list') {
      return results;
    }

    const sections = {};
    // Counted so a section built from several aggregations is not reported as
    // whole when only some of them came back.
    const returned = {};
    results.forEach((entry) => {
      const section = this.sectionOf(entry);
      if (!section) {
        return;
      }
      const rows = this.rowsOf(entry);
      if (this.params.isAggregated === true && rows.length > 0) {
        rows[0].location = 'Multiple Locations...';
      }
      // A section may be built from more than one aggregation; they are folded
      // onto the location they share so the caller sees one row per location.
      returned[section] = (returned[section] || 0) + 1;
      const merged = {
        result: this.mergeOnLocation(
          (sections[section] || {}).result || [],
          rows
        )
      };
      // ?debug=true returns what each part of the section actually ran and how
      // much came back, so an empty or all null section can be told apart from
      // a query that did not run.
      if (this.params.debug) {
        merged.debug = ((sections[section] || {}).debug || []).concat([
          {
            schema: entry.report && entry.report.reportName,
            rows: rows.length,
            columns: rows.length > 0 ? Object.keys(rows[0]) : [],
            sql: entry.results && entry.results.sqlQuery
          }
        ]);
      }
      sections[section] = merged;
    });

    // A section that did not come back whole is said to be incomplete rather
    // than left reading as zero, so a partial answer is never taken for a full
    // one. Whatever did arrive is still returned alongside the error.
    this.requestedSections.forEach((section) => {
      const expected = SECTION_REPORTS[section].length;
      const got = returned[section] || 0;
      if (got === expected) {
        return;
      }
      sections[section] = {
        result: (sections[section] || {}).result || [],
        error:
          got === 0
            ? 'section query failed'
            : got + ' of ' + expected + ' parts of this section returned'
      };
    });

    return {
      sections: sections,
      sectionsRequested: this.requestedSections,
      ms: Date.now() - startedAt,
      isReleased:
        this.params.hivMonthlyDatasetSource ===
        'etl.hiv_monthly_report_dataset_frozen'
    };
  }

  /** The section an executed handler belongs to, by its schema name. */
  sectionOf(entry) {
    const name = entry && entry.report && entry.report.reportName;
    const match = Object.keys(SECTION_REPORTS).filter(
      (section) => SECTION_REPORTS[section].indexOf(name) !== -1
    );
    return match.length > 0 ? match[0] : null;
  }

  /**
   * Folds a further aggregation's rows onto the ones already collected for a
   * section, matching on location. A location one aggregation saw and another
   * did not still gets its row, carrying only what was measured for it.
   */
  mergeOnLocation(existing, incoming) {
    const byLocation = new Map();
    const order = [];
    [existing, incoming].forEach((rows) => {
      rows.forEach((row) => {
        const key = row.location_id != null ? row.location_id : row.location;
        if (!byLocation.has(key)) {
          byLocation.set(key, {});
          order.push(key);
        }
        Object.assign(byLocation.get(key), row);
      });
    });
    return order.map((key) => byLocation.get(key));
  }

  rowsOf(entry) {
    const rows =
      entry &&
      entry.results &&
      entry.results.results &&
      entry.results.results.results;
    return Array.isArray(rows) ? rows : [];
  }

  /**
   * The monthly dataset is frozen up to the last released month and live after
   * it; a report that ends within the frozen window reads the frozen copy.
   */
  determineMohReportSourceTables() {
    const self = this;
    return new Promise((resolve, reject) => {
      self
        .getSqlRunner()
        .executeQuery('select * from etl.moh_731_last_release_month')
        .then((results) => {
          const lastReleasedMonth = results[0]['last_released_month'];
          self.params.hivMonthlyDatasetSource = Moment(
            lastReleasedMonth
          ).isSameOrAfter(Moment(self.params.endDate))
            ? 'etl.hiv_monthly_report_dataset_frozen'
            : 'etl.hiv_monthly_report_dataset_v1_2';
          resolve(self.params.hivMonthlyDatasetSource);
        })
        .catch((error) => {
          console.error('MOH 731 2023: error reading released month', error);
          reject(error);
        });
    });
  }
}
