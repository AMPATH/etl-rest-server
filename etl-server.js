var
  Hapi = require('hapi')
  , mysql = require('mysql')
  , Good = require('good')
  , requestConfig = require('./request-config')
  , Basic = require('hapi-auth-basic')
  , config = require('./conf/config')
  , requestConfig = require('./request-config')
  , corsHeaders = require('hapi-cors-headers')
  , _ = require('underscore')
  , moment = require('moment')
  , tls = require('tls')
  , fs = require('fs')
  , etlRoutes = require('./etl-routes')
  , elasticRoutes = require('./elastic/routes/care.treatment.routes')
  , Inert = require('inert')
  , Vision = require('vision')
  , HapiSwagger = require('hapi-swagger')
  , Pack = require('./package')
  , hapiAuthorization = require('hapi-authorization')
  , authorizer = require('./authorization/etl-authorizer')
  , cluster = require('cluster')
  , os = require('os')
  , locationAuthorizer = require('./authorization/location-authorizer.plugin')
  , authValidator = require('./authorization/auth-validator')
  , cache = require('./session-cache')
  , numCPUs = os.cpus().length;

var App = {

  server: null,
  db_pool: null,
  logger: null,
  config,
  start: function() {

    if (config.clusteringEnabled === true && cluster.isMaster) {

      for (var i = 0; i < numCPUs; i++) {
          cluster.fork();
      }

    } else
        App.init();
  },
  init: function() {

    App.config = config;
    App.initDatabase()
      .then(function(pool) {

        App.db_pool = pool;
        App.initServer();
      });
  },
  initServer: function() {

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

    App.server = server;

    var tls_config = false;

    if (config.etl.tls) {
        tls_config = tls.createServer({
            key: fs.readFileSync(config.etl.key),
            cert: fs.readFileSync(config.etl.cert)
        });
    }

    App.server.connection({
        port: config.etl.port,
        host: config.etl.host,
        tls: tls_config
    });

    server.ext('onRequest', function (request, reply) {
        requestConfig.setAuthorization(request.headers.authorization);
        return reply.continue();
    });

    var HapiSwaggerOptions = {

        info: {
            'title': 'REST API Documentation',
            'version': Pack.version,
        },
        tags: [{
            'name': 'patient'
        }, {
            'name': 'location'
        }],
        sortEndpoints: 'path'
    };

    server.register(
      [
        Inert,
        Vision, {
            'register': HapiSwagger,
            'options': HapiSwaggerOptions
        }, {
            register: Basic,
            options: {}
        }, {
            register: hapiAuthorization,
            options: {
                roles: authorizer.getAllPrivilegesArray()
            }
        }, {
            register: Good,
            options: {
                reporters: []
            }
        }, {
            register: locationAuthorizer,
            options: {}
        }
      ],
      function (err) {

        if (err) {
            throw err; // something bad happened loading the plugin
        }

        server.auth.strategy('simple', 'basic', {
            validateFunc: authValidator.validate
        });

        //Adding routes
        var routes = etlRoutes.getRoutes(App);

        for (var route in routes) {
            server.route(routes[route]);
        }

        for (var route in elasticRoutes) {
            server.route(elasticRoutes[route]);
        }

        server.on('response', function (request) {

            if (request.response === undefined || request.response === null) {
                console.log("No response");
            } else {

              var user = '';

              if(request.auth && request.auth.credentials)
                user = request.auth.credentials.username;

                console.log(
                    'Username:',
                    user + '\n' +
                    moment().local().format("YYYY-MM-DD HH:mm:ss") + ': ' + server.info.uri + ': ' + request.method.toUpperCase() + ' ' + request.url.path + ' \n ' + request.response.statusCode
                );
            }
        })

        server.ext('onPreResponse', corsHeaders);
    });

    App.server.start(function () {
        console.log('info', 'Server running at: ' + server.info.uri);
        server.log('info', 'Server running at: ' + server.info.uri);
    });
  },
  initDatabase: function() {

    return new Promise(function(resolve, reject) {
      var pool = mysql.createPool(config.mysql); //TODO - handle connection errors
      resolve(pool);
    });
  },
};

App.start();

module.exports = App;
