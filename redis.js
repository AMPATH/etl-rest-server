const redis =  require('redis');
const Promise = require('bluebird');
const config  = require('./conf/config');
Promise.promisifyAll(redis.RedisClient.prototype);

module.exports =redis.createClient(config.redis);