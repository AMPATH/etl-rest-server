import mergeByKey from 'array-merge-by-key';
const _ = require('lodash');
_.mixin({
  /*
   * @groupByComposite
   *
   * Groups an array of objects by multiple properties. Uses _.groupBy under the covers,
   * to group by a composite key, generated from the list of provided keys.
   *
   * @param {Object[]} collection - the array of objects.
   * @param {string[]} keys - one or more property names to group by.
   * @param {string} [delimiter=-] - a delimiter used in the creation of the composite key.
   *
   * @returns {Object} - the composed aggregate object.
   */
  groupByComposite: (collection, keys, delimiter = '__') =>
    _.groupBy(collection, (item) => {
      const compositeKey = [];
      _.each(keys, (key) => compositeKey.push(`${key}__${item[key]}`));
      return compositeKey.join(delimiter);
    })
});
export default class ReportProcessorHelpersService {
  tranform(data, options) {
    const initialGrouped = this.groupBy(
      data,
      options.joinColumn,
      options.joinColumn,
      'children'
    );
    let result = [];
    for (let w of initialGrouped) {
      let grouped = _.groupByComposite(w.children, options.use);
      let final = {};
      for (let p in grouped) {
        let group = grouped[p];
        for (let g of group) {
          for (let i in g) {
            if (
              !(
                options.use.includes(i) ||
                options.joinColumn.includes(i) ||
                options.skip.includes(i)
              )
            ) {
              let dc = '';
              if (p) {
                dc = `dc__${p}__`;
              }
              final[`${dc}${i}`] = g[i];
            } else if (
              options.joinColumn.includes(i) ||
              options.skip.includes(i)
            ) {
              final[`${i}`] = g[i];
            }
          }
        }
      }
      result.push(final);
    }
    return result;
  }

  joinDataSets(joinColumn, dataset1, dataset2) {
    return mergeByKey(joinColumn, dataset1, dataset2);
  }

  groupBy(
    dataToGroupOn,
    fieldNameToGroupOn,
    fieldNameForGroupName,
    fieldNameForChildren
  ) {
    let result = _.chain(dataToGroupOn)
      .groupBy(fieldNameToGroupOn)
      .toPairs()
      .map(function (currentItem) {
        return _.zipObject(
          [fieldNameForGroupName, fieldNameForChildren],
          currentItem
        );
      })
      .value();
    return result;
  }

  aggregateDataSets(dataset = [], concatIntFields = [], distinctFields = []) {
    let obj = {};
    for (let i = 0; i < dataset.length; i++) {
      for (let [key, value] of Object.entries(dataset[i])) {
        if (Object.hasOwn(obj, key)) {
          if (!distinctFields.includes(key)) {
            obj[key] +=
              (typeof obj[key] === 'string' &&
                obj[key] !== '' &&
                isNaN(obj[key])) ||
              concatIntFields.includes(key)
                ? ',' + value
                : Number(value);
          }
        } else {
          obj[key] = value;
        }
      }
    }
    return [obj];
  }
}
