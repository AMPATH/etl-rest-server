var
  config = require('../conf/config')
  , cache = require('../session-cache')
  , https = require('http')
  , authorizer = require('./etl-authorizer')

module.exports = {
  validate: validate
}

function validate(username, password, callback) {
  
  try {
      //Openmrs context
      var openmrsAppName = config.openmrs.applicationName || 'amrs';
      var authBuffer = new Buffer(username + ":" + password).toString("base64");
      var options = {
          hostname: config.openmrs.host,
          port: config.openmrs.port,
          path: '/' + openmrsAppName + '/ws/rest/v1/session',
          headers: {
              'Authorization': "Basic " + authBuffer
          }
      };
      var key = '';
      cache.encriptKey(authBuffer, function (hash) {
          key = hash;
          if (cache.getFromToCache(key) === null) {
              if (config.openmrs.https) {
                  https = require('https');
              }
              https.get(options, function (res) {
                  var body = '';
                  res.on('data', function (chunk) {
                      body += chunk;
                  });
                  res.on('end', function () {
                      var result = JSON.parse(body);
                      if (result.authenticated === true) {
                          var user = result.user.username;
                          authorizer.setUser(result.user);
                          authorizer.getUserAuthorizedLocations(result.user.userProperties, function (authorizedLocations) {
                              var currentUser = {
                                  username: username,
                                  role: authorizer.isSuperUser() ?
                                      authorizer.getAllPrivilegesArray() : authorizer.getCurrentUserPreviliges(),
                                  authorizedLocations: authorizedLocations
                              };
                              cache.saveToCache(key, {
                                  result: result,
                                  currentUser: currentUser
                              });
                              callback(null, result.authenticated, currentUser);
                          });
                      } else {
                          console.log('An error occurred while trying to validate user did not authenticate');
                          callback(null, false);
                      }
                  });
              }).on('error', function (error) {
                  //console.log(error);
                  callback(null, false);
              });
          } else {
              var cached = cache.getFromToCache(key);
              authorizer.setUser(cached.result.user);
              cache.saveToCache(key, {
                  result: cached.result,
                  currentUser: cached.currentUser
              });
              callback(null, cached.result.authenticated, cached.currentUser);
          }
      }, function () {
          callback(null, false);
      });
  } catch (ex){
      console.log('An error occurred while trying to validate',ex);
      callback(null, false);
  }
};
