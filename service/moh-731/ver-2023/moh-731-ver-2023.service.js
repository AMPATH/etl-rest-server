const Promise = require('bluebird');
import { MultiDatasetPatientlistReport } from '../../../app/reporting-framework/multi-dataset-patientlist.report.js';
import ReportProcessorHelpersService from '../../../app/reporting-framework/report-processor-helpers.service.js';
import { widenToFacility } from '../../facility-locations/facility-locations.service';
import { MOH731Service } from '../../moh-731.service';

/* Some MOH 731 (ver-2023) figures compare against the period's bounds inside a
   column expression -- e.g. ART started by the end of the period -- where the
   query generator substitutes {startDate}/{endDate} as text rather than binding
   them. Dates are therefore only accepted as plain YYYY-MM-DD, so nothing but a
   date can reach the SQL that way. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function assertValidPeriod(...paramSets) {
  paramSets.forEach((params) => {
    ['startDate', 'endDate'].forEach((key) => {
      if (params && params[key] !== undefined && !ISO_DATE.test(params[key])) {
        throw new Error(`Invalid ${key}: expected YYYY-MM-DD`);
      }
    });
  });
}

/**
 * MOH 731 (Ver. July 2023) for the O3 report endpoints (app/routes/3x-reports.route.js).
 *
 * Kept apart from MOH731Service, which the production POC routes (etl-routes.js)
 * also use, so nothing here changes how those behave. On top of it, this:
 * - reports the whole facility of the requested location
 *   (service/facility-locations);
 * - accepts only YYYY-MM-DD dates (see above);
 * - pages patient lists on limit / startIndex -- the schemas page on
 *   limitParam / offSetParam, which were never set, so every request returned
 *   the whole list and a client paging through it never reached a short page;
 * - passes a failed report back to the caller instead of leaving the request
 *   hanging.
 */
export class MOH731Ver2023Service extends MOH731Service {
  generateReport(additionalParams) {
    const that = this;
    return new Promise((resolve, reject) => {
      assertValidPeriod(this.params, additionalParams);
      /* linelists come through here too, so they read the same locations */
      widenToFacility(this.params, additionalParams)
        .then(() =>
          MultiDatasetPatientlistReport.prototype.generateReport.call(
            this,
            additionalParams
          )
        )
        .then((results) => {
          if (additionalParams && additionalParams.type === 'patient-list') {
            resolve(results);
            return;
          }
          let finalResult = [];
          const reportProcessorHelpersService = new ReportProcessorHelpersService();
          for (let result of results) {
            if (
              result.report &&
              result.report.reportSchemas &&
              result.report.reportSchemas.main &&
              result.report.reportSchemas.main.transFormDirectives.joinColumn
            ) {
              finalResult = reportProcessorHelpersService.joinDataSets(
                that.params[
                  result.report.reportSchemas.main.transFormDirectives
                    .joinColumnParam
                ] ||
                  result.report.reportSchemas.main.transFormDirectives
                    .joinColumn,
                finalResult,
                result.results.results.results
              );
            }
          }
          resolve({
            result: finalResult
          });
        }, reject);
    });
  }

  generatePatientListReport(reportParams) {
    try {
      assertValidPeriod(this.params, reportParams);
    } catch (error) {
      return Promise.reject(error);
    }
    reportParams.limitParam = Number(reportParams.limit);
    reportParams.offSetParam = Number(reportParams.startIndex) || 0;
    return super.generatePatientListReport(reportParams);
  }
}
