'use strict';
/**
 * This is a hapi js plugin that extends the route end points to allow
 * location based authorization. Rewritten for the hapi 17+/21 plugin API;
 * all location-authorization logic is preserved from the hapi 16 original.
 */
// External modules
var Boom = require('@hapi/boom');
var Hoek = require('@hapi/hoek');
var _ = require('underscore');

var pluginName = 'openmrsLocationAuthorizer';
var internals = {
  defaults: {
    locationParameter: [
      {
        type: 'params', //can be in either query or params so you have to specify
        name: 'uuid' //name of the location parameter
      }
    ]
  }
};

/**
 * Registers the plugin
 *
 * @param server
 * @param options
 */
exports.plugin = {
  name: pluginName,
  version: '1.0.0',
  register: function (server, options) {
    var settings = Hoek.applyToDefaults(internals.defaults, options || {});

    server.bind({
      config: settings
    });

    // Validate the server options on the routes
    server.ext('onPreStart', internals.validateRoutes);
    server.ext('onPreHandler', internals.onPreHandler);
  }
};

/**
 * Runs on server start and validates that every route that has openmrsLocationAuthorizer params is valid
 *
 * @param server
 */
internals.validateRoutes = function (server) {
  var routes = server.table();

  // Loop through each route
  routes.forEach(function (route) {
    var locationAuthorizerParams = route.settings.plugins[pluginName]
      ? route.settings.plugins[pluginName]
      : false;

    // If there are openmrsLocationAuthorizer params and are not disabled by using "false", validate em
    if (locationAuthorizerParams !== false) {
      // If there is a default auth
      if (server.auth.settings.default) {
        // If there is also an auth on the route, make sure it's not false or null
        if (route.settings.auth !== undefined) {
          // Make sure that there is either a default auth being set, or that there is an auth specified on every route with locationAuthorizer plugin params
          Hoek.assert(
            route.settings.auth !== null && route.settings.auth !== false,
            'openmrsLocationAuthorizer can be enabled only for secured route'
          );
        }
      }
      // Else there is no default auth set, so validate each route's auth
      else {
        // Make sure that there is either a default auth being set, or that there is an auth specified on every route with locationAuthorizer plugin params
        Hoek.assert(
          route.settings.auth &&
            route.settings.auth !== null &&
            route.settings.auth !== false,
          'openmrsLocationAuthorizer can be enabled only for secured route'
        );
      }
    }
  });
};

/**
 * Checks if openmrsLocationAuthorizer is active for the current route and execute the necessary steps accordingly.
 *
 * @param request
 * @param h
 */
internals.onPreHandler = function (request, h) {
  // Ignore OPTIONS requests
  if (request.route.method === 'options') {
    return h.continue;
  }

  var params;
  try {
    // Check if the current route is openmrsLocationAuthorizer enabled
    params = internals.getRouteParams(request);
  } catch (err) {
    return Boom.badRequest(err.message);
  }

  // if openmrsLocationAuthorizer is enabled, get the user
  if (params) {
    var user = request.auth.credentials;
    var routeSettings = request.route.settings.plugins[pluginName] || {
      locationParameter: [],
      exemptedParameter: [],
      aggregateReport: []
    };
    if (user.authorizedLocations.length > 0) {
      var unAuthorisedOperationalLocations = [];
      var unAuthorisedAggregateLocations = [];
      var isExempted = false;
      var isAggregate = false;

      //check for exemptions
      isExempted = _.some(routeSettings.exemptedParameter || [], function (
        routeSetting
      ) {
        var passedExemptedValue =
          request[routeSetting.type][routeSetting.name] || '';
        return passedExemptedValue === routeSetting.value;
      });

      //check if passedParam is aggregate
      isAggregate = _.some(routeSettings.aggregateReport || [], function (
        routeSetting
      ) {
        var passedParamValue =
          request[routeSetting.type][routeSetting.name] || '';
        return passedParamValue === routeSetting.value;
      });

      if (isExempted === false) {
        if (isAggregate === true) {
          //get all the selected locations that this user is not authorised to fetch data
          _.each(routeSettings.locationParameter, function (routeSetting) {
            var passedLocations =
              request[routeSetting.type][routeSetting.name] || 'All';
            if (passedLocations === 'All') {
              //this means the user did not limit request parameters to any locations
              //therefore check if user is allowed to access all location
              var isAuthorised = _.some(user.authorizedLocations, function (
                authorizedLocation
              ) {
                if (authorizedLocation.type === 'aggregate')
                  return authorizedLocation.uuid === '*';
              });
              if (!isAuthorised) unAuthorisedAggregateLocations.push('All');
            } else {
              _.each(passedLocations.split(','), function (passedLocation) {
                if (passedLocation.length > 0) {
                  //validate passedLocation is a uuid
                  //determine if user is authorised
                  var isAuthorised = _.some(user.authorizedLocations, function (
                    authorizedLocation
                  ) {
                    if (authorizedLocation.type === 'aggregate') {
                      if (authorizedLocation.uuid === '*') return true;
                      return authorizedLocation.uuid == passedLocation;
                    }
                  });
                  //if not authorised then push the unauthorised locations
                  if (!isAuthorised)
                    unAuthorisedAggregateLocations.push(passedLocation);
                }
              });
            }
          });
        } else {
          //get all the selected locations that this user is not authorised to fetch data
          _.each(routeSettings.locationParameter, function (routeSetting) {
            var passedLocations =
              request[routeSetting.type][routeSetting.name] || 'All';
            if (passedLocations === 'All') {
              //this means the user did not limit request parameters to any locations
              //therefore check if user is allowed to access all location
              var isAuthorised = _.some(user.authorizedLocations, function (
                authorizedLocation
              ) {
                if (authorizedLocation.type === 'operational')
                  return authorizedLocation.uuid === '*';
              });
              if (!isAuthorised) unAuthorisedOperationalLocations.push('All');
            } else {
              _.each(passedLocations.split(','), function (passedLocation) {
                if (passedLocation.length > 0) {
                  //validate passedLocation is a uuid
                  //determine if user is authorised
                  var isAuthorised = _.some(user.authorizedLocations, function (
                    authorizedLocation
                  ) {
                    if (authorizedLocation.type === 'operational') {
                      if (authorizedLocation.uuid === '*') return true;
                      return authorizedLocation.uuid == passedLocation;
                    }
                  });
                  //if not authorised then push the unauthorised locations
                  if (!isAuthorised)
                    unAuthorisedOperationalLocations.push(passedLocation);
                }
              });
            }
          });
        }
      }
      //if any of the passed location is unauthorised then boom.forbidden() else continue
      if (unAuthorisedOperationalLocations.length > 0) {
        //construct message appropriately
        var authorisedOperationLocations = [];
        _.each(user.authorizedLocations, function (location) {
          if (location.type === 'operational') {
            authorisedOperationLocations.push(location['name']);
          }
        });
        if (authorisedOperationLocations.length > 0) {
          return Boom.forbidden(
            'You are only allowed to view operational data in ' +
              authorisedOperationLocations.toString() || '' + ' location(s)'
          );
        } else {
          return Boom.forbidden(
            'You are not allowed to view operational data in any location '
          );
        }
      } else if (unAuthorisedAggregateLocations.length > 0) {
        var authorisedAggregateLocations = [];
        _.each(user.authorizedLocations, function (location) {
          if (location.type === 'aggregate') {
            authorisedAggregateLocations.push(location['name']);
          }
        });
        if (authorisedAggregateLocations.length > 0) {
          return Boom.forbidden(
            'You are only allowed to view aggregate data in ' +
              authorisedAggregateLocations.toString() || '' + ' location(s)'
          );
        } else {
          return Boom.forbidden(
            'You are not allowed to view aggregate data in any location '
          );
        }
      } else {
        return h.continue;
      }
    } else {
      //user is not authorised to any location
      return Boom.forbidden(
        'You are not Authorised to view data in any location. Please contact your system ' +
          'administrator to grant you access to the selected location(s)'
      );
    }
  } else {
    return h.continue;
  }
};

/**
 * Returns the plugin params for the current request
 *
 * @param request
 * @returns {*}
 */
internals.getRouteParams = function (request) {
  try {
    if (request.route.settings.plugins[pluginName]) {
      var params = request.route.settings.plugins[pluginName];
      return params;
    } else {
      return null;
    }
  } catch (ex) {
    return null;
  }
};
