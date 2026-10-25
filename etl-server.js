const Boom = require('@hapi/boom');

try {
  var Hapi = require('@hapi/hapi');
  var requestConfig = require('./request-config');
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
  var server = Hapi.server({
    host: config.etl.host,
    port: config.etl.port,
    tls: false,
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
    server.options.tls = tls_config;
  }

  if (config.testMode === true) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  const authenticateWithCookie = (cookie) => {
    const contextPath = config.openmrs.applicationName || 'amrs';
    const options = {
      hostname: config.openmrs.host,
      port: config.openmrs.port,
      path: '/' + contextPath + '/ws/rest/v1/session',
      headers: {
        Cookie: cookie
      }
    };

    if (config.openmrs.https) {
      https = require('https');
    }

    return new Promise((resolve, reject) => {
      https
        .get(options, (res) => {
          let body = '';
          //A chunk of data has been received.
          res.on('data', (chunk) => {
            body += chunk;
          });

          // The whole response has been received.
          res.on('end', () => {
            // Handle non-200 status codes
            if (res.statusCode === 403 || res.statusCode === 401) {
              console.log(
                `Authentication failed with status ${res.statusCode}`
              );
              return resolve(null);
            }

            if (res.statusCode !== 200) {
              console.error(`Unexpected status code: ${res.statusCode}`);
              return reject(
                new Error(`OpenMRS returned status ${res.statusCode}`)
              );
            }

            // Check if response is JSON
            const contentType = res.headers['content-type'] || '';
            if (!contentType.includes('application/json')) {
              console.error('Non-JSON response received:', contentType);
              console.error('Response body:', body.substring(0, 200));
              return reject(
                new Error(
                  'Invalid response format from OpenMRS (expected JSON)'
                )
              );
            }

            try {
              const result = JSON.parse(body);
              // Validate user object exists
              if (!result.user) {
                return reject(
                  new Error('User object missing from authentication response')
                );
              }

              // Extract sessionId from cookie if not in response
              let sessionId = result.sessionId;
              if (!sessionId) {
                // Extract JSESSIONID from the cookie parameter (format: "JSESSIONID=xxxxx")
                const cookieMatch = cookie.match(/JSESSIONID=([^;]+)/);
                if (cookieMatch && cookieMatch[1]) {
                  sessionId = cookieMatch[1];
                } else {
                  return reject(
                    new Error(
                      'Session ID missing from authentication response and cookie'
                    )
                  );
                }
              }

              //Set current user
              authorizer.setUser(result.user);
              console.log('Set user, getting authorized locations...');

              // Wrap the callback in try-catch to handle errors
              try {
                authorizer.getUserAuthorizedLocations(
                  result.user.userProperties,
                  (authorizedLocations) => {
                    console.log(
                      'Authorized locations retrieved:',
                      authorizedLocations
                    );
                    try {
                      const currentUser = {
                        username: result.user.username,
                        role: authorizer.isSuperUser()
                          ? authorizer.getAllPrivilegesArray()
                          : authorizer.getCurrentUserPreviliges(),
                        authorizedLocations: authorizedLocations,
                        sessionLocation: result.sessionLocation || null
                      };

                      const validSessionCookie = 'JSESSIONID=' + sessionId;
                      const sessionCookie =
                        res.headers['set-cookie'] &&
                        res.headers['set-cookie'].length > 0
                          ? res.headers['set-cookie'][0]
                          : validSessionCookie;
                      cache.saveToCache(result.user.username, {
                        result: result,
                        currentUser: currentUser,
                        session: sessionCookie
                      });
                      currentUser.session = sessionCookie;
                      requestConfig.setAuthorization(sessionCookie);
                      resolve({
                        authenticated: result.authenticated,
                        currentUser: currentUser
                      });
                    } catch (innerError) {
                      console.error('Error building current user:', innerError);
                      reject(innerError);
                    }
                  }
                );
              } catch (authError) {
                console.error('Error getting authorized locations:', authError);
                reject(authError);
              }
            } catch (error) {
              console.error('Error parsing authentication response:', error);
              reject(error);
            }
          });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
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

  server.validator(require('joi'));

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
    ]);

    const getCookieValue = (name) =>
      name.match(/(^|;)\s*JSESSIONID\s*=\s*([^;]+)/)?.pop() || '';

    const scheme = function (srv, options) {
      return {
        authenticate: function (request, h) {
          const req = request.raw.req;
          const cookieHeader = req.headers.cookie;
          // Extract JSessionID from the cookie
          if (!cookieHeader) {
            return h.unauthenticated(Boom.unauthorized('No cookie header'));
          }
          const cookie = getCookieValue(cookieHeader);
          if (!cookie) {
            return h.unauthenticated(
              Boom.unauthorized(null, 'Invalid cookie/No cookie set!')
            );
          }
          //Construct valid cookie
          const validCookie = 'JSESSIONID=' + cookie;

          return authenticateWithCookie(validCookie)
            .then((data) => {
              if (!data) {
                return h.unauthenticated(
                  Boom.unauthorized('User not authenticated!')
                );
              }

              try {
                const result = data;
                console.log('Current user: ', result.currentUser);
                if (result.authenticated === true) {
                  //Authentication successful
                  return h.authenticated({
                    credentials: result.currentUser
                  });
                } else {
                  //Authentication unsuccessful - reject the request
                  return h.unauthenticated(
                    Boom.unauthorized('User not authenticated!')
                  );
                }
              } catch (error) {
                console.log('Oop error!', error);
                return h.unauthenticated(
                  Boom.unauthorized('User not authenticated!')
                );
              }
            })
            .catch((error) => {
              console.error('Authentication error:', error);
              return h.unauthenticated(
                Boom.unauthorized('Authentication failed!')
              );
            });
        }
      };
    };

    server.auth.scheme('custom', scheme);
    server.auth.strategy('default', 'custom');
    server.auth.default('default');

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
