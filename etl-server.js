try {
  var Hapi = require('@hapi/hapi');
  var mysql = require('mysql');
  var requestConfig = require('./request-config');
  var Basic = require('@hapi/basic');
  // var etlBroadcast =require('./etl-broadcast');
  var https = require('http');
  var config = require('./conf/config');

  // Security: squel 5.x does not escape single quotes in values by default
  // (GHSA-4qhx-g9wp-g9m6), so any user-controlled value could break out of
  // the generated SQL. Registering a global String value handler escapes
  // every string value before it is inlined. Note: a custom handler replaces
  // squel's default formatting entirely, so this handler must emit the full
  // SQL literal, including the surrounding quotes.
  require('squel').registerValueHandler('string', function (
    value,
    asParam,
    formattingOptions
  ) {
    if (asParam) {
      return value; // bind parameter: the driver escapes it
    }
    var escaped = String(value).replace(/'/g, "''");
    if (formattingOptions && formattingOptions.dontQuote) {
      return escaped;
    }
    return "'" + escaped + "'";
  });

  var corsHeaders = require('./lib/hapi-cors-headers');
  var _ = require('underscore');
  var moment = require('moment');
  var tls = require('tls');
  var fs = require('fs');
  var routes = require('./etl-routes');
  var elasticRoutes = require('./elastic/routes/care.treatment.routes');
  var Inert = require('@hapi/inert');
  var Vision = require('@hapi/vision');
  var HapiSwagger = require('hapi-swagger');
  var Pack = require('./package');
  var hapiAuthorization = require('hapi-authorization');
  var authorizer = require('./authorization/etl-authorizer');
  var cluster = require('cluster');
  var os = require('os');
  var locationAuthorizer = require('./authorization/location-authorizer.plugin');
  var cache = require('./session-cache');
  var numCPUs = os.cpus().length;
  var authencticated = false;
  var server = Hapi.server({
    host: config.etl.host,
    port: config.etl.port,
    tls: tls_config,
    routes: {
      log: {
        collect: true
      },
      cors: {
        additionalHeaders: ['JSNLog-RequestId']
      }
    }
  });

  var tls_config = false;
  if (config.etl.tls) {
    tls_config = tls.createServer({
      key: fs.readFileSync(config.etl.key),
      cert: fs.readFileSync(config.etl.cert)
    });
  }

  if (config.testMode === true) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  server.events.on('log', function (event, tags) {
    if (tags.info) console.log('info', event.data);
  });

  server.validator(require('joi'));

  var pool = mysql.createPool(config.mysql);

  var validate = async function (request, username, password, h) {
    try {
      //Openmrs context
      var openmrsAppName = config.openmrs.applicationName || 'amrs';
      var authBuffer = Buffer.from(username + ':' + password).toString(
        'base64'
      );
      var options = {
        hostname: config.openmrs.host,
        port: config.openmrs.port,
        path: '/' + openmrsAppName + '/ws/rest/v1/session',
        headers: {
          Authorization: 'Basic ' + authBuffer
        }
      };
      var key = username;
      if (config.openmrs.https) {
        https = require('https');
      }
      var session = cache.getFromToCache(key);
      if (session !== null) {
        options.headers['Cookie'] = session.session;
        delete options.headers.Authorization;
      }
      return new Promise(function (resolve) {
        https
          .get(options, function (res) {
            var body = '';
            res.on('data', function (chunk) {
              body += chunk;
            });
            res.on('end', function () {
              var result;
              try {
                result = JSON.parse(body);
              } catch (err) {
                if (session !== null) {
                  cache.removeFromCache(key);
                  resolve(validate(request, username, password, h));
                } else {
                  return resolve({ isValid: false });
                }
              }
              if (result.authenticated === true) {
                authorizer.setUser(result.user);
                authorizer.getUserAuthorizedLocations(
                  result.user.userProperties,
                  function (authorizedLocations) {
                    var currentUser = {
                      username: username,
                      role: authorizer.isSuperUser()
                        ? authorizer.getAllPrivilegesArray()
                        : authorizer.getCurrentUserPreviliges(),
                      authorizedLocations: authorizedLocations
                    };
                    var sessionCookie =
                      res.headers['set-cookie'] &&
                      res.headers['set-cookie'].length > 0
                        ? res.headers['set-cookie'][0]
                        : session.session;
                    cache.saveToCache(key, {
                      result: result,
                      currentUser: currentUser,
                      session: sessionCookie
                    });
                    currentUser.session = sessionCookie;
                    requestConfig.setAuthorization(sessionCookie);
                    resolve({
                      isValid: true,
                      credentials: currentUser
                    });
                  }
                );
              } else {
                console.log(
                  'An error occurred while trying to validate; user is not authenticated'
                );
                resolve({ isValid: false });
              }
            });
          })
          .on('error', function (error) {
            //console.log(error);
            resolve({ isValid: false });
          });
      });
    } catch (ex) {
      console.log('An error occurred while trying to validate', ex);
      return { isValid: false };
    }
  };

  var HapiSwaggerOptions = {
    info: {
      title: 'REST API Documentation',
      version: Pack.version
    },
    tags: [
      {
        name: 'patient'
      },
      {
        name: 'location'
      }
    ],
    sortEndpoints: 'alpha'
  };

  // hapi 21 asserts validate.params/path on paths without {param} placeholders.
  // These rules were inert under hapi 16 (nothing to validate), so drop them
  // at registration to preserve behavior.
  function sanitizeRoute(route) {
    var opts = route.options || route.config;
    if (opts && opts.validate && !/\{[^}]+\}/.test(route.path)) {
      delete opts.validate.params;
      delete opts.validate.path;
    }
    return route;
  }

  async function main() {
    await server.register([
      Inert,
      Vision,
      {
        plugin: HapiSwagger,
        options: HapiSwaggerOptions
      },
      {
        plugin: require('./lib/hapi-routes-loader'),
        options: {
          dir: `${__dirname}/app/routes`
        }
      },
      Basic,
      {
        plugin: hapiAuthorization,
        options: {
          roles: authorizer.getAllPrivilegesArray()
        }
      },
      {
        plugin: locationAuthorizer,
        options: {}
      }
      // {
      //   'plugin': Nes,
      //   'options': etlBroadcast.getOptions(server)
      // }
    ]);

    server.auth.strategy('simple', 'basic', {
      validate: validate
    });
    server.auth.default('simple');

    //Adding routes
    for (var route in routes) {
      try {
        server.route(sanitizeRoute(routes[route]));
      } catch (badThing) {
        console.error(badThing);
      }
    }

    for (var route in elasticRoutes) {
      server.route(sanitizeRoute(elasticRoutes[route]));
    }

    server.events.on('response', function (request) {
      if (request.response === undefined || request.response === null) {
        console.log('No response');
      } else {
        var user = '';
        if (request.auth && request.auth.credentials)
          user = request.auth.credentials.username;
        console.log(
          'Username:',
          user +
            '\n' +
            moment().local().format('YYYY-MM-DD HH:mm:ss') +
            ': ' +
            server.info.uri +
            ': ' +
            request.method.toUpperCase() +
            ' ' +
            request.url.path +
            ': ' +
            request.response.statusCode
        );
      }
    });

    server.ext('onPreResponse', corsHeaders);

    if (config.clusteringEnabled === true && cluster.isMaster) {
      for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
      }

      cluster.on('exit', function (worker, code, signal) {
        //refork the cluster
        //cluster.fork();
      });
    } else {
      await server.start();
      console.log('info', 'Server running at: ' + server.info.uri);
      server.log('info', 'Server running at: ' + server.info.uri);
    }
  }

  main().catch(function (err) {
    console.error('error-starting', err);
    throw err;
  });
  module.exports = server;
} catch (error) {
  console.log('error-starting', error);
  throw error;
}
