const Promise = require('bluebird');
const _ = require('lodash');

const programTypeDao = require('../dao/program-type/program-type-dao');
let programUuidIdMap = new Map();
let programTypes = [];

const def = {
  getAllProgramTypes: getAllProgramTypes,
  mapProgramUuidToId: mapProgramUuidToId,
  loadAndMapProgramUuidToId: loadAndMapProgramUuidToId,
  getProgramIdFromUuid: getProgramIdFromUuid
};

module.exports = def;

function getAllProgramTypes() {
  return new Promise((resolve, reject) => {
    programTypeDao
      .getProgramTypes()
      .then((result) => {
        if (result.length) {
          programTypes = result;
          resolve(result);
        }
      })
      .catch((error) => {
        reject({
          message: 'Error fetching program types: ',
          error
        });
      });
  });
}

function mapProgramUuidToId(programTypes) {
  _.each(programTypes, (programType, index) => {
    programUuidIdMap.set(programType.uuid, programType.program_id);
  });

  return programUuidIdMap;
}

function getProgramIdFromUuid(programUuid) {
  const programObj = programUuidIdMap.get(programUuid);

  if (typeof programObj === 'undefined') {
    return -1;
  } else {
    return programObj;
  }
}

function loadAndMapProgramUuidToId() {
  return new Promise(function (resolve, reject) {
    getAllProgramTypes()
      .then((result) => {
        if (result) {
          programUuidIdMap = mapProgramUuidToId(result);
          resolve(programUuidIdMap);
        }
      })
      .catch((error) => {
        reject('Error loading and mapping program UUIDs to IDs: ', error);
      });
  });
}
