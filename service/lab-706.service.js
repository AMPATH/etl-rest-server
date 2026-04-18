import { BaseMysqlReport } from '../app/reporting-framework/base-mysql.report';

export class Lab706Service extends BaseMysqlReport {
  constructor(reportName, params) {
    super(reportName, params);
  }

  generateReport(additionalParams) {
    return super.generateReport(additionalParams).then((results) => {
      return {
        queriesAndSchemas: results,
        result: results.results.results,
        indicatorDefinitions: []
      };
    });
  }
}
