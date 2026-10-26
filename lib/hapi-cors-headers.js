'use strict';

/**
 * Vendored onPreResponse CORS extension for hapi 21 (replaces the
 * hapi-cors-headers package, which targets the hapi 16 extension API).
 * Behavior preserved: echoes the request Origin, allows credentials, and
 * answers OPTIONS preflights directly with 200.
 */
module.exports = function addCorsHeaders(request, h) {
  if (!request.headers.origin) {
    return h.continue;
  }

  // depending on whether we have a boom or not,
  // headers need to be set differently.
  var response = request.response.isBoom
    ? request.response.output
    : request.response;

  if (!response) {
    return h.continue;
  }

  response.headers['access-control-allow-origin'] = request.headers.origin;
  response.headers['access-control-allow-credentials'] = 'true';
  if (request.method !== 'options') {
    return h.continue;
  }

  response.statusCode = 200;
  response.headers['access-control-expose-headers'] =
    'content-type, content-length, etag';
  response.headers['access-control-max-age'] = 60 * 10; // 10 minutes
  // dynamically set allowed headers & method
  if (request.headers['access-control-request-headers']) {
    response.headers['access-control-allow-headers'] =
      request.headers['access-control-request-headers'];
  }
  if (request.headers['access-control-request-method']) {
    response.headers['access-control-allow-methods'] =
      request.headers['access-control-request-method'];
  }

  return h.continue;
};
