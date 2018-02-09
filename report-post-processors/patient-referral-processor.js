var _ = require('underscore');
var moment = require('moment');

var moduleExport = {
    UngroupResults:UngroupResults,
    groupResultsByLocation: groupResultsByLocation,
    getListOfDistinctStatesFromResult: getListOfDistinctStatesFromResult

};
var res;

module.exports = moduleExport;


function getListOfLocationIdsFromResult(results){
    var locations =[];
    var unique = {};
    for( var i in results ){
        if( typeof(unique[results[i].location_id]) == "undefined"){
            locations.push(results[i].location_id);
        }
        unique[results[i].location_id] = 0;
    }
    return locations;
}
function getListOfDistinctStatesFromResult(results){
    var states =[];
    var unique = {};
    for( var i in res ){
        if( typeof(unique[res[i].state_name]) == "undefined"){
            states.push({
                name: res[i].state_name.split(' ').join('_'),

            });

        }
        unique[res[i].state_name.split(' ').join('_')] = 0;
    }

    return states;

}
function getListOfDStatesFromResult(results){
    var st =[];
    var unique = {};
    for( var i in results ){
        if( typeof(unique[results[i].state]) == "undefined"){
            st.push(results[i].state);

        }
        unique[results[i].state] = 0;
    }
    return st;

}
function UngroupResults(results) {
    return results

}
function groupResultsByLocation(results){
    res = results;
    //stringify
    results=JSON.stringify(results);
    results= JSON.parse(results);

    var finalReport=[];
    var locationIds=getListOfLocationIdsFromResult(results);
    var state = getListOfDStatesFromResult(results);
  //  var data =
    let total = [];
    //construct locations
    _.each(locationIds, function(loc){
        var row={};
        var data = {};
        let total = [];

        _.each(results,  function(result){


            if(loc===result.location_id) {

                    row['locationUuids']=result.locationUuids;
                    row['location']=result.location;
                    row[result.state_name.split(' ').join('_')] =result.counts;
                    row[result.state_name.split(' ').join('_') +'_'+ 'stateUuids'] = result.stateUuids;

               /* _.each(state,  function(st){

                    if(st===result.state) {
                        total.push({
                            state: result.state,
                            stateUuids: result.stateUuids,
                            [result.state_name]:result.counts

                        });
                    }
                });*/

            }
        });
       // row['total'] = total;
        finalReport.push(row);
    });

    return finalReport;
}









