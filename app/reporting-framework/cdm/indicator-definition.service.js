import * as cdmDefinitions from './indicator-definitions.json';
export class IndicatorDefinitionService {
    getDefinitions(indicators){
        console.log('reporting framework', cdmDefinitions);
        return cdmDefinitions.indicatorDefinitions.filter(function (el) {

            return indicators.indexOf(el.name) >= 0;
          });
    }
}
