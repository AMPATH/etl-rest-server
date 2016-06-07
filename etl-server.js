var Hapi = require('hapi');
var mysql = require('mysql');
var Good = require('good');
var Basic = require('hapi-auth-basic');
var https = require('http');
var config = require('./conf/config');
var corsHeaders = require('hapi-cors-headers');
var _ = require('underscore');
var tls = require('tls');
var fs = require('fs');
var routes = require('./etl-routes');
var elasticRoutes = require('./elastic/routes/care.treatment.routes');
var Inert = require('inert');
var Vision = require('vision');
var HapiSwagger = require('hapi-swagger');
var Pack = require('./package');
var user ='';
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

server.connection({
  port: config.etl.port,
  host: config.etl.host,
  tls: tls_config
});
var pool = mysql.createPool(config.mysql);

var validate = function(username, password, callback) {

  //Openmrs context
  var options = {
    hostname: config.openmrs.host,
    port: config.openmrs.port,
    path: '/amrs/ws/rest/v1/session',
    headers: {
      'Authorization': "Basic " + new Buffer(username + ":" + password).toString("base64")
    }
  };
  if (config.openmrs.https) {
    https = require('https');
  }
  https.get(options, function(res) {
    var body = '';
    res.on('data', function(chunk) {
      body += chunk;
    });
    res.on('end', function() {
      var  result = JSON.parse(body);
      user = result.user.username;
      callback(null, result.authenticated, {});
    });
  }).on('error', function(error) {
    console.log(error);
    callback(null, false);
  });



};

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


server.register([
    Inert,
    Vision, {
      'register': HapiSwagger,
      'options': HapiSwaggerOptions
    }, {
      register: Basic,
      options: {}
    }, {
      register: Good,
      options: {
        reporters: []
      }
    }
  ],

  function(err) {
    if (err) {
      throw err; // something bad happened loading the plugin
    }
    server.auth.strategy('simple', 'basic', {
      validateFunc: validate
    });

    //Adding routes
    for (var route in routes) {
      server.route(routes[route]);
    }

    for (var route in elasticRoutes) {
      server.route(elasticRoutes[route]);
    }

    server.ext('onPreResponse', corsHeaders);
    server.start(function() {
      server.log('info', 'Server running at: ' + server.info.uri);
    });
    server.on('response', function (request) {
      if (request.response === undefined || request.response.statusCode != 200){
        console.log("there is a problem");
      }else{
        console.log(
            'Username:',
            user +'\n'+
            server.info.uri + ': '
            + request.method.toUpperCase() + ' '
            + request.url.path + ' \n '
            + request.response.statusCode
        );

      }

     })
  });
module.exports = server;
