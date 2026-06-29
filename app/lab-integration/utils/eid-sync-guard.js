const config = require('../../../conf/config');

function isEidSyncAllowed() {
  return process.env.NODE_ENV === 'production' && config.eidSyncOn === true;
}

module.exports = { isEidSyncAllowed };
