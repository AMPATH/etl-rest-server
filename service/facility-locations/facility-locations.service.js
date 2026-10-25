import QueryService from '../../app/database-access/query.service';

/**
 * Facility scope for any report or register: a location stands for its whole
 * facility -- the facility (its parent, or the location itself when it has
 * none) and every active location under it, e.g. Kesses and Kesses MCH.
 *
 * Works on location ids (what the reporting framework's `locations` param
 * holds) or on location uuids (what the register endpoints take). The chosen
 * locations always stay in, even if retired. Lookups are cached for a while,
 * since locations change rarely and a report's linelist pages repeat them.
 *
 * Usage:
 *   import { widenToFacility, facilityLocationUuids } from '.../facility-locations/facility-locations.service';
 *   await widenToFacility(reportParams);            // params.locations -> facility ids
 *   const uuids = await facilityLocationUuids(['<uuid>']);
 */

const facilitySql = (key) => `SELECT l.${key}
  FROM amrs.location l
  JOIN (
    SELECT DISTINCT COALESCE(parent_location, location_id) AS root_id
    FROM amrs.location
    WHERE ${key} IN (?)
  ) r ON l.location_id = r.root_id OR l.parent_location = r.root_id
  WHERE l.retired = 0`;

const UUID = /^[0-9a-f-]{36}$/i;
const CACHE_MS = 10 * 60 * 1000;
const cache = new Map();

function lookup(key, values) {
  const cacheKey = `${key}:${values.join(',')}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.result;
  }
  /* the reports' own pool, which fails the request on a database error
     rather than leaving it waiting */
  const result = Promise.resolve(
    new QueryService().executeQuery(facilitySql(key), [values])
  ).then((rows) => [...new Set([...values, ...rows.map((row) => row[key])])]);
  cache.set(cacheKey, { result, expires: Date.now() + CACHE_MS });
  result.catch(() => cache.delete(cacheKey));
  return result;
}

/** Location ids -> the ids of their whole facilities */
export function facilityLocationIds(locations) {
  const ids = [
    ...new Set((locations || []).map(Number).filter(Number.isInteger))
  ].sort((a, b) => a - b);
  return ids.length ? lookup('location_id', ids) : Promise.resolve([]);
}

/** Location uuids -> the uuids of their whole facilities; rejects anything that is not a uuid */
export function facilityLocationUuids(uuids) {
  const values = [
    ...new Set((uuids || []).map((uuid) => String(uuid).trim()))
  ].filter(Boolean);
  if (values.length === 0 || !values.every((uuid) => UUID.test(uuid))) {
    return Promise.reject(new Error('Invalid location uuid'));
  }
  return lookup('uuid', values.sort());
}

/**
 * Widens `locations` (ids) in place on every parameter set given, so a report,
 * its datasets and its linelists all read the same facility.
 */
export function widenToFacility(...paramSets) {
  const withLocations = paramSets.filter(
    (params) => params && Array.isArray(params.locations)
  );
  if (withLocations.length === 0) {
    return Promise.resolve();
  }
  return facilityLocationIds(withLocations[0].locations).then((locations) => {
    if (locations.length) {
      withLocations.forEach((params) => {
        params.locations = locations;
      });
    }
  });
}
