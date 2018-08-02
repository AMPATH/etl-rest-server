'use strict';

const dashboards = require('../conf/kibana-dashboards.config.json');

var serviceDefinition = {
    getDashboard: getDashboard
};

module.exports = serviceDefinition;

function getDashboard() {
    return  JSON.parse(JSON.stringify(dashboards));
}
