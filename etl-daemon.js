var Service = require('node-linux').Service;

// Create a new service object
var svc = new Service({
<<<<<<< HEAD
    name:'Etl Server',
    description: 'The nodejs.org etl web server.',
    script: '/home/werick/etl-rest-server/etl-server.js',
    wait: 2,
    grow: .5
  });
=======
  name: 'Etl Server',
  description: 'The nodejs.org etl web server.',
  script: '/home/werick/etl-rest-server/etl-server.js',
  wait: 2,
  grow: .5
});
>>>>>>> 4292ecc... AA-449-fix ci testing bug

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', function() {
<<<<<<< HEAD
    svc.start();
  });
=======
  svc.start();
});
>>>>>>> 4292ecc... AA-449-fix ci testing bug

svc.install();
