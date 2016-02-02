var Service = require('node-linux').Service;

// Create a new service object
var svc = new Service({
<<<<<<< HEAD
    name:'Etl Server',
    script: require('path').join('/home/werick/etl-rest-server/etl-server.js')
  });

// Listen for the "uninstall" event so we know when it's done.
svc.on('uninstall', function() {
    console.log('Uninstall complete.');
    console.log('The service exists: ', svc.exists);
  });
=======
  name: 'Etl Server',
  script: require('path').join('/home/werick/etl-rest-server/etl-server.js')
});

// Listen for the "uninstall" event so we know when it's done.
svc.on('uninstall', function() {
  console.log('Uninstall complete.');
  console.log('The service exists: ', svc.exists);
});
>>>>>>> 4292ecc... AA-449-fix ci testing bug

// Uninstall the service.
svc.uninstall();
