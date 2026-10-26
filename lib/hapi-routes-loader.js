'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Minimal replacement for the hapi-routes plugin (hapi 16-era, no hapi 21
 * build): registers every first-party route module found in `options.dir`.
 * Each module may export a single route object, an array of routes, or an
 * object whose values are routes/arrays of routes.
 */
exports.plugin = {
  name: 'hapi-routes-loader',
  version: '1.0.0',
  register: async function (server, options) {
    const dir = options.dir;
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.js') && !f.endsWith('.min.js'));

    for (const file of files) {
      const modulePath = path.join(dir, file);
      let exported;
      try {
        exported = require(modulePath);
      } catch (err) {
        console.error('Failed to load route module ' + file, err);
        continue;
      }
      const routeGroups = [];
      const pushExports = (value) => {
        if (Array.isArray(value)) {
          value.forEach((v) => routeGroups.push(v));
        } else if (value && typeof value === 'object') {
          routeGroups.push(value);
        }
      };
      if (exported && Array.isArray(exported.routes)) {
        exported.routes.forEach((r) => routeGroups.push(r));
      } else if (exported && typeof exported === 'object') {
        Object.keys(exported).forEach((k) => pushExports(exported[k]));
      }

      // hapi 21 asserts validate.params/path on parameterless paths; these were
      // inert under hapi 16 — drop them to preserve behavior.
      routeGroups.forEach((r) => {
        const opts = r && (r.options || r.config);
        if (opts && opts.validate && !/\{[^}]+\}/.test(r.path)) {
          delete opts.validate.params;
          delete opts.validate.path;
        }
      });
      const validRoutes = routeGroups.filter((r) => r && r.method && r.path);
      if (validRoutes.length > 0) {
        try {
          server.route(validRoutes);
        } catch (err) {
          console.error('Failed to register routes from ' + file, err);
        }
      }
    }
  }
};
