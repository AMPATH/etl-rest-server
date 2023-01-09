const { Promise } = require('bluebird');
const Boom = require('boom');

try {
  var Hapi = require('hapi');
  var Good = require('good');
  var requestConfig = require('./request-config');
  var https = require('http');
  var config = require('./conf/config');
  var requestConfig = require('./request-config');
  var corsHeaders = require('hapi-cors-headers');
  var _ = require('underscore');
  var moment = require('moment');
  var tls = require('tls');
  var fs = require('fs');
  var routes = require('./etl-routes');
  var elasticRoutes = require('./elastic/routes/care.treatment.routes');
  var Inert = require('inert');
  var Vision = require('vision');
  var HapiSwagger = require('hapi-swagger');
  var Pack = require('./package');
  var hapiAuthorization = require('hapi-authorization');
  var authorizer = require('./authorization/etl-authorizer');
  var cluster = require('cluster');
  var os = require('os');
  var locationAuthorizer = require('./authorization/location-authorizer.plugin');
  var cache = require('./session-cache');
  var numCPUs = os.cpus().length;
  var server = new Hapi.Server({
    connections: {
      //routes: {cors:{origin:["https://amrs.ampath.or.ke:8443"]}}
      routes: {
        cors: {
          additionalHeaders: ['JSNLog-RequestId']
        }
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

  server.connection({
    port: config.etl.port,
    host: config.etl.host,
    tls: tls_config,
    routes: { log: true }
  });

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
            if (res.statusCode === 403) {
              resolve(null);
            }
            try {
              const result = JSON.parse(body);
              console.log('User: ', result);
              //Set current user
              authorizer.setUser(result.user);
              const authorizedLocations = authorizer.getUserAuthorizedLocations(
                result.user.userProperties
              );

              const currentUser = {
                username: result.user.username,
                role: authorizer.isSuperUser()
                  ? authorizer.getAllPrivilegesArray()
                  : authorizer.getCurrentUserPreviliges(),
                authorizedLocations: authorizedLocations
              };
              const validSessionCookie = 'JSESSIONID=' + result.sessionId;
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
            } catch (error) {
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
    sortEndpoints: 'path'
  };

  server.register(
    [
      Inert,
      Vision,
      {
        register: HapiSwagger,
        options: HapiSwaggerOptions
      },
      {
        register: require('hapi-routes'),
        options: {
          dir: `${__dirname}/app/routes`
        }
      },
      {
        register: hapiAuthorization,
        options: {
          roles: authorizer.getAllPrivilegesArray()
        }
      },
      {
        register: Good,
        options: {
          reporters: []
        }
      },
      {
        register: locationAuthorizer,
        options: {}
      }
    ],

    function (err) {
      if (err) {
        console.error(err);
        throw err; // something bad happened loading the plugin
      }

      const getCookieValue = (name) =>
        name.match('(^|;)\\s*JSESSIONID\\s*=\\s*([^;]+)')?.pop() || '';

      const scheme = function (server, options) {
        return {
          authenticate: function (request, reply) {
            const req = request.raw.req;
            const cookieHeader = req.headers.cookie;
            // Extract JSessionID from the cookie
            if (!cookieHeader) {
              return reply(Boom.unauthorized('No cookie header', null));
            }
            const cookie = getCookieValue(cookieHeader);
            if (!cookie) {
              return reply(
                Boom.unauthorized(null, 'Invalid cookie/No cookie set!')
              );
            }
            //Construct valid cookie
            const validCookie = 'JSESSIONID=' + cookie;

            authenticateWithCookie(validCookie).then((data) => {
              if (!data) {
                return reply(
                  Boom.unauthorized('User not authenticated!'),
                  null,
                  {}
                );
              }

              try {
                const result = data;
                console.log('Current user: ', result.currentUser);
                if (result.authenticated === true) {
                  //Authentication successful
                  return reply.continue({
                    isAuthenticated: true,
                    credentials: result.currentUser
                  });
                } else {
                  //Authentication unsuccessful
                  return reply.continue({
                    isAuthenticated: false,
                    credentials: {}
                  });
                }
              } catch (error) {
                console.log('Oop error!', error);
                return reply(
                  Boom.unauthorized('User not authenticated!'),
                  null,
                  {}
                );
              }
            });
          }
        };
      };

      server.auth.scheme('custom', scheme);
      server.auth.strategy('default', 'custom', 'required');

      //Adding routes
      for (var route in routes) {
        try {
          server.route(routes[route]);
        } catch (badThing) {
          console.error(badThing);
        }
      }

      for (var route in elasticRoutes) {
        server.route(elasticRoutes[route]);
      }

      server.on('response', function (request) {
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
              ' \n ' +
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
        //TODO start HAPI server here
        server.start(function () {
          console.log('info', 'Server running at: ' + server.info.uri);
          server.log('info', 'Server running at: ' + server.info.uri);
        });
      }
    }
  );
  module.exports = server;
} catch (error) {
  console.log('error-starting', error);
  throw error;
}
