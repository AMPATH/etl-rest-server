import ConfigService from '../config/config.service';
const mysql = require('promise-mysql');
let connectionPool = undefined;
let MysqlConnectionService = {
  getPool: () => {
    if (connectionPool !== undefined) {
      return connectionPool;
    }
    console.log('calling connection pool');
    connectionPool = mysql.createPool(ConfigService.getConfig().mysql);
    // Raise group_concat_max_len on every pooled connection at creation
    // (lab-706 panel results strings exceed the 1024-byte default and would
    // truncate silently).  Done here instead of per-query so the report
    // execution path stays a single pooled query; mysql queues commands per
    // connection, so the SET is always ordered before any query that
    // connection later runs.
    connectionPool.on('connection', (connection) => {
      connection.query('SET SESSION group_concat_max_len = 100000', () => {});
    });
    return connectionPool;
  }
};

Object.freeze(MysqlConnectionService);
export default MysqlConnectionService;
