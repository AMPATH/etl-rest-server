import { BasePatientListGen } from 'ampath-json-query-gen';
import { Json2Sql } from 'ampath-json2sql';
import { Promise } from 'bluebird';
import { BaseMysqlReport } from './base-mysql.report';

export class PatientlistMysqlReport extends BaseMysqlReport {
  constructor(reportName, params) {
    super(reportName, params);
  }

  generatePatientListReport(indicators, options) {
    // 1. Fetch report schema
    // 2. Determine the aggregate, base
    // 3. Fetch the template report
    // 4. Generate patient list json query
    // 5. Generate report sql using json2sql
    // 6. Execute sql statement using sql generator
    const that = this;
    return new Promise((resolve, error) => {
      // fetch reports
      that
        .fetchReportSchema(that.reportName)
        .then((reportSchemas) => {
          that.reportSchemas = reportSchemas;
          // consolidate params and indicators
          indicators = that.consolidateParamsAndIndicators(
            that.params,
            indicators
          );

          // determine patient list seed schemas
          let aggs = this.determineBaseAndAggrSchema(
            that.reportSchemas,
            indicators
          );
          if (aggs.length > 0) {
            // console.log('Potential schemas with supplied indicators', aggs.length);
            that.plSchemasRaw = this.determineBaseAndAggrSchema(
              that.reportSchemas,
              indicators
            )[0];
          }
          if (
            that.plSchemasRaw &&
            that.plSchemasRaw.aggregate &&
            that.plSchemasRaw.base
          ) {
            that
              .fetchPatientListTemplate(that.plSchemasRaw.aggregate)
              .then((template) => {
                that.plTemplate = template.main;
                let generated = that.generatePatientListJsonQuery(
                  that.plSchemasRaw.aggregate,
                  that.plSchemasRaw.base,
                  that.plTemplate,
                  that.params
                );
                // console.log('GENERATED', generated.generated.filters, that.params);
                // if (this.hasEmptyDynamicExpressions(generated) && aggs.length > 1) {
                //     for (let i = 1; i < aggs.length; i++) {
                //         that.plSchemasRaw = this.determineBaseAndAggrSchema(that.reportSchemas, indicators)[i];
                //         generated =
                //             that.generatePatientListJsonQuery(that.plSchemasRaw.aggregate, that.plSchemasRaw.base,
                //                 that.plTemplate, that.params);
                //         if (!this.hasEmptyDynamicExpressions(generated)) {
                //             break;
                //         }
                //     }

                // }
                // let aggregateDatasets = that.fetchReportSchema(that.reportSchemas);

                // assign all reports
                that.generatedPL = {
                  main: generated.generated
                };
                let combined = Object.assign(
                  that.reportSchemas,
                  that.generatedPL
                );
                that.generatedPL = combined;

                // console.log('Potential schemas with supplied indicators', JSON.stringify(combined));
                that.modifiedParam = generated.params;
                // generate and run query
                that
                  .runPatientListQuery(
                    that.generatedPL,
                    that.modifiedParam,
                    options
                  )
                  .then((run) => {
                    that.reportQuery = run.sqlQuery;
                    that.queryResults = run.results;
                    resolve({
                      schemas: that.reportSchemas,
                      generatedSchemas: that.generatedPL,
                      sqlQuery: that.reportQuery,
                      results: that.queryResults,
                      totalCount: run.totalCount
                    });
                  })
                  .catch((err) => {
                    error(err);
                  });
              })
              .catch((err) => {
                console.error('Error fetching patientlist template', err);
                error(err);
              });
          } else {
            error('Not a patientlist report');
          }
        })
        .catch((err) => {
          error(err);
        });
    });
  }

  // The patient list groups by patient before LIMIT/OFFSET applies, and the
  // template joins (identifiers, contacts, addresses...) fan out per patient,
  // so every page used to cost as much as the whole list. Page the patient ids
  // over the filtering tables alone, then join the template for that page only.
  runPatientListQuery(schemas, params, options) {
    const main = schemas.main;
    const keyColumn = this.getPagingKeyColumn(main, params);
    const countRows = !!(options && options.countRows);
    const fullRun = () =>
      this.runQuery(schemas, params).then((run) => {
        const counted = countRows
          ? this.runRowCount(schemas, params).catch((err) => {
              // the list itself is unaffected; only the pager's exact
              // total is lost
              console.error('Patient list count query failed', err);
              return undefined;
            })
          : Promise.resolve(undefined);
        return counted.then((total) => ({
          sqlQuery: run.sqlQuery,
          results: run.results,
          totalCount: total
        }));
      });
    if (!keyColumn) {
      return fullRun();
    }

    const keySchema = this.cloneJsonSchema(main);
    keySchema.sources = this.getSourcesNeededForFilters(main);
    keySchema.columns = [
      { type: 'simple_column', alias: 'person_id', column: keyColumn }
    ];
    keySchema.groupBy = { columns: [keyColumn] };
    keySchema.orderBy = { columns: [{ column: keyColumn, order: 'asc' }] };

    // the total only changes with the filters, so count it with the first page
    let countRun = Promise.resolve(null);
    if (!(params[main.paging.offSetParam] > 0)) {
      const countSchema = this.cloneJsonSchema(keySchema);
      countSchema.columns = [
        {
          type: 'derived_column',
          alias: 'total',
          expressionType: 'simple_expression',
          expressionOptions: {
            expression: 'COUNT(DISTINCT ' + keyColumn + ')'
          }
        }
      ];
      delete countSchema.groupBy;
      delete countSchema.orderBy;
      delete countSchema.paging;
      countRun = this.runQuery(
        Object.assign({}, schemas, { main: countSchema }),
        params
      );
    }

    const keyRun = this.runQuery(
      Object.assign({}, schemas, { main: keySchema }),
      params
    );

    return Promise.all([keyRun, countRun]).then(
      ([keys, count]) => {
        const totalCount = count ? count.results.results[0].total : undefined;
        const personIds = keys.results.results.map((row) => row.person_id);
        if (personIds.length === 0) {
          return {
            sqlQuery: keys.sqlQuery,
            results: { results: [] },
            totalCount: totalCount
          };
        }

        const pageSchema = this.cloneJsonSchema(main);
        delete pageSchema.paging;
        pageSchema.orderBy = { columns: [{ column: keyColumn, order: 'asc' }] };
        pageSchema.filters = pageSchema.filters || {
          conditionJoinOperator: 'and',
          conditions: []
        };
        pageSchema.filters.conditions.push({
          filterType: 'tableColumns',
          conditionExpression: keyColumn + ' in ?',
          parameterName: 'pagePersonIds'
        });
        return this.runQuery(
          Object.assign({}, schemas, { main: pageSchema }),
          Object.assign(
            {},
            params,
            this.getPageDataSources(params, personIds),
            { pagePersonIds: personIds }
          )
        ).then((page) => ({
          sqlQuery: keys.sqlQuery + ';\n' + page.sqlQuery,
          results: page.results,
          totalCount: totalCount
        }));
      },
      (err) => {
        // a filter on a column of a dropped join, say; the full query still works
        console.error(
          'Patient list key paging failed, running full query',
          err
        );
        return fullRun();
      }
    );
  }

  // The pager needs the exact number of unpaginated rows, but counting the
  // generated statement itself re-runs every per-row column subquery for
  // every register row in the period. The joins and filters alone decide
  // which rows match, so COUNT(*) over them gives the same total.
  runRowCount(schemas, params) {
    const countSchema = this.buildRowCountSchema(schemas.main);
    if (!countSchema) {
      return Promise.resolve(undefined);
    }
    return this.runQuery(
      Object.assign({}, schemas, { main: countSchema }),
      params
    ).then((count) => {
      const row = count.results.results[0];
      return row ? row.total : undefined;
    });
  }

  buildRowCountSchema(main) {
    const groupBy = main.groupBy;
    const singleGroupColumn =
      groupBy &&
      Array.isArray(groupBy.columns) &&
      groupBy.columns.length === 1 &&
      !groupBy.groupParam
        ? groupBy.columns[0]
        : null;
    // HAVING filters groups through aggregates the count select no longer
    // carries, and multi-key or parametric grouping has no single DISTINCT
    // key to count.
    if (main.having || (groupBy && !singleGroupColumn)) {
      return null;
    }
    // Joins stay: a 1:N LEFT JOIN legitimately multiplies list rows, so
    // dropping the ones no filter reads would undercount the pages.
    const countSchema = this.cloneJsonSchema(main);
    countSchema.columns = [
      {
        type: 'derived_column',
        alias: 'total',
        expressionType: 'simple_expression',
        expressionOptions: {
          expression: singleGroupColumn
            ? 'COUNT(DISTINCT ' + singleGroupColumn + ')'
            : 'COUNT(*)'
        }
      }
    ];
    delete countSchema.groupBy;
    delete countSchema.orderBy;
    delete countSchema.paging;
    return countSchema;
  }

  // A derived source the page joins (latest viral load, say) is otherwise
  // worked out for every patient, and again for each row the identifier and
  // address joins fan a patient out to. A report can give a version of such a
  // source for the page's patients only, with <<pagePersonIds>> where the ids go.
  getPageDataSources(params, personIds) {
    const templates =
      (this.params && this.params.pageDataSources) ||
      params.pageDataSources ||
      {};
    const ids = personIds.map((id) => Number(id));
    if (ids.some((id) => !Number.isInteger(id))) {
      return {};
    }
    const sources = {};
    Object.keys(templates).forEach((param) => {
      sources[param] = templates[param].replace(
        /<<pagePersonIds>>/g,
        ids.join(',')
      );
    });
    return sources;
  }

  runQuery(schemas, params) {
    // json2sql fills <<param>> source tables in place, so give it a copy
    const copy = Object.assign({}, schemas, {
      main: this.cloneJsonSchema(schemas.main)
    });
    return this.generateReportQuery(copy, params).then((sqlQuery) => {
      //allow 'null' as parameter value
      sqlQuery = sqlQuery.replace(/\'null\'/g, 'null');
      return this.executeReportQuery(sqlQuery)
        .then((results) => ({ sqlQuery: sqlQuery, results: results }))
        .catch((err) => {
          console.error(sqlQuery);
          throw err;
        });
    });
  }

  // Paging by key only gives the same rows when the list is one row per
  // patient, in no other order, with a page size asked for.
  getPagingKeyColumn(schema, params) {
    if (!schema.paging || schema.orderBy || !schema.groupBy) {
      return null;
    }
    if (!(params[schema.paging.limitParam] >= 0)) {
      return null;
    }
    const groupBy = schema.groupBy;
    if (groupBy.groupParam && (params[groupBy.groupParam] || []).length > 0) {
      return null;
    }
    if (
      !Array.isArray(groupBy.columns) ||
      groupBy.columns.length !== 1 ||
      !/^\w+\.person_id$/.test(groupBy.columns[0])
    ) {
      return null;
    }
    return groupBy.columns[0];
  }

  // The base table and INNER JOINs decide which patients are listed, and so
  // does a LEFT JOIN that a filter (or a kept join) refers to. The rest only
  // add columns.
  getSourcesNeededForFilters(schema) {
    const referencesAlias = (text, alias) =>
      new RegExp('\\b' + alias + '\\.').test(text);
    const isOptional = (source) =>
      source.join &&
      source.join.type &&
      source.join.type.toUpperCase() === 'LEFT';

    const kept = new Set(
      schema.sources.filter((s) => !isOptional(s)).map((s) => s.alias)
    );
    let neededText = JSON.stringify([
      schema.filters,
      schema.sources
        .filter((s) => kept.has(s.alias) && s.join)
        .map((s) => s.join.joinCondition)
    ]);
    let grew = true;
    while (grew) {
      grew = false;
      schema.sources.forEach((source) => {
        if (
          !kept.has(source.alias) &&
          referencesAlias(neededText, source.alias)
        ) {
          kept.add(source.alias);
          neededText += JSON.stringify(source.join.joinCondition);
          grew = true;
        }
      });
    }
    return this.cloneJsonSchema(
      schema.sources.filter((s) => kept.has(s.alias))
    );
  }

  fetchPatientListTemplate(aggregateReport) {
    if (
      aggregateReport.dynamicJsonQueryGenerationDirectives &&
      aggregateReport.dynamicJsonQueryGenerationDirectives
        .patientListGenerator &&
      aggregateReport.dynamicJsonQueryGenerationDirectives.patientListGenerator
        .useTemplate
    ) {
      let name =
        aggregateReport.dynamicJsonQueryGenerationDirectives
          .patientListGenerator.useTemplate;
      let version =
        aggregateReport.dynamicJsonQueryGenerationDirectives
          .patientListGenerator.useTemplateVersion;
      return this.fetchReportSchema(name, version);
    } else {
      console.log('Invalid aggregate report. Missing template directives.');
    }

    return Promise.reject(
      'Invalid aggregate report. Missing template directives.'
    );
  }

  determineBaseAndAggrSchema(schemas, indicators) {
    // console.log('finding aggregate report with indicators', indicators);
    let aggs = this.getAggregateWithIndicator(schemas, indicators);

    let found = [];

    aggs.forEach((agg) => {
      let s = {
        aggregate: agg,
        base: schemas[agg.uses[0].name]
      };
      // console.log('added base agg pair', agg);
      found.push(s);
    });
    return found;
  }

  getAggregateWithIndicator(schemas, indicators) {
    let found = [];
    for (let s in schemas) {
      // console.log('schema:',schemas[s]);
      if (schemas[s].dynamicJsonQueryGenerationDirectives) {
        if (this.schemaHasColumns(schemas[s], indicators)) {
          found.push(schemas[s]);
        }
      }
    }
    // console.log('found with agg indicator', found);
    return found;
  }

  schemaHasColumns(schema, columns) {
    // console.log('schema has columns', schema, columns);
    let foundAll = true;
    if (columns && columns.forEach) {
      columns.forEach((column) => {
        let found = false;
        for (let i = 0; i < schema.columns.length; i++) {
          let col = schema.columns[i];

          if (
            col.alias === column ||
            col.column === column ||
            (typeof col.column === 'string' &&
              col.column.slice(col.column.indexOf('.') + 1)) === column
          ) {
            // console.log('found', column, col);
            found = true;
            break;
          }
        }

        if (!found) {
          foundAll = false;
        }
      });
    } else {
      foundAll = false;
    }

    return foundAll;
  }

  generatePatientListJsonQuery(
    aggregateSchema,
    baseSchema,
    tempateSchema,
    params
  ) {
    let gen = this.getPatientListGenerator(
      aggregateSchema,
      baseSchema,
      tempateSchema,
      params
    );
    return gen.generatePatientListSchema();
  }

  getPatientListGenerator(aggregateSchema, baseSchema, tempateSchema, params) {
    return new BasePatientListGen(
      baseSchema,
      aggregateSchema,
      tempateSchema,
      params
    );
  }

  consolidateParamsAndIndicators(params, indicators) {
    let consolidatedIndicators = [];
    indicators.forEach((indicator) => {
      let generatedParams = [];
      if (this.isDynamicallyCreatedIndicator(indicator)) {
        let extracted = this.extractIndicators(indicator);
        for (let o in extracted) {
          generatedParams.push({ key: o, value: extracted[o] });
          consolidatedIndicators.push(o);
        }
      } else {
        generatedParams.push({ key: indicator, value: 1 });
        consolidatedIndicators.push(indicator);
      }

      generatedParams.forEach((paramValue) => {
        if (
          params[paramValue.key] === undefined ||
          params[paramValue.key] === null
        ) {
          params[paramValue.key] =
            paramValue.value === null ? 1 : paramValue.value;
        }
      });
    });
    return consolidatedIndicators;
  }

  addIndicatorsToParams(param, indicators) {
    indicators.forEach((element) => {
      if (param[element] === undefined) {
        param[element] = 1;
      }
    });
  }

  extractIndicators(indicator) {
    let split = indicator.split('__');

    let indicators = {};

    for (let i = 1; i < split.length; i++) {
      if (this.isEven(i)) {
        indicators[split[i - 1]] = split[i];
      } else {
        indicators[split[i]] = null;
      }
    }

    return indicators;
  }

  // hack to take care of mis-matched schemas for an indicator
  hasEmptyDynamicExpressions(generated) {
    let hasEmpty = false;
    if (
      generated.generated.filters &&
      generated.generated.filters.conditions.length > 0
    ) {
      generated.generated.filters.conditions.forEach((condition) => {
        if (
          condition.dynamicallyGenerated &&
          condition.filterType === 'tableColumns' &&
          condition.conditionExpression === ''
        ) {
          hasEmpty = true;
        }
      });
    }
    return hasEmpty;
  }

  isEven(n) {
    return n % 2 == 0;
  }

  isOdd(n) {
    return Math.abs(n % 2) == 1;
  }

  isDynamicallyCreatedIndicator(indicator) {
    return indicator.startsWith('dc__');
  }
}
