// var routes = require('../../../etl-routes');
// var db = require('../../../etl-db');
// var dao = require('../../../etl-dao');
// var request = require('request');

// var mockData = require('../../../__mocks__/mock-data');
// var _ = require('underscore');
// var Hapi = require('hapi');

// describe('ANALYTICS LEVEL ETL-SERVER TESTS', function () {
//   describe('Testing etl-dao layer', function () {
//     // example showing how to use a stub to fake a method
//     var stub;
//     beforeEach(function (done) {
//       stub = sinon.stub(db, 'queryServer_test');

//       // .yieldsTo(1, null, { result:mockData.getPatientMockData() });
//       done();
//     });

//     afterEach(function () {
//       stub.restore();
//     });

//     it('should create the right query parts object when  getHivSummaryData is called', function (done) {
//       // stub.callsArgWithAsync(1, null, { result:mockData.getPatientMockData() });
//       stub.yields({
//         startIndex: 0,
//         size: 1,
//         result: mockData.getPatientMockData()
//       });
//       var options = {
//         params: {
//           uuid: '123'
//         },
//         query: {
//           order: null,
//           fields: null,
//           startIndex: null,
//           limit: null,
//           joins: [
//             ['a', 't2'],
//             ['c', 'd']
//           ]
//         }
//       };

//       // stub.withArgsWithAsync(options).yieldsTo(mockData.getPatientMockData());

//       dao.getHivSummaryData(options, function (res) {
//         // console.log('body2  ++', res);
//         done();
//       });

//       // console.log('body2  ++', stub.args[0][0]);
//       var queryParts = stub.args[0][0];
//       expect(queryParts.table).to.equal('etl.flat_hiv_summary');
//       expect(queryParts.where).to.include(
//         'date(encounter_datetime) >= ? and date(encounter_datetime) <= ?'
//       );
//       expect(queryParts.joins).to.be.an('array');
//       expect(queryParts.joins).to.have.deep.property('[0][0]', 'amrs.location');
//       expect(queryParts.joins).to.have.deep.property('[0][1]', 't2');
//       expect(queryParts.joins).to.have.deep.property(
//         '[0][2]',
//         't1.location_uuid = t2.uuid'
//       );
//       expect(queryParts.joins).to.have.deep.property('[1][0]', 'amrs.person');
//       expect(queryParts.joins).to.have.deep.property('[1][1]', 't3');
//     });

//     it('should create the right fields property when getHivSummaryData is called', function (done) {
//       // stub.callsArgWithAsync(1, null, { result:mockData.getPatientMockData() });
//       stub.yields({
//         startIndex: 0,
//         size: 1,
//         result: mockData.getPatientMockData()
//       });
//       var options = {
//         params: {
//           locations: '124'
//         },
//         query: {
//           order: null,
//           fields: 'a,b,c',
//           startIndex: null,
//           limit: null
//         }
//       };

//       dao.getHivSummaryData(options, function (res) {
//         done();
//       });

//       // console.log('bodyxx  ++', stub.args[0][0]);
//       var queryParts = stub.args[0][0];

//       expect(queryParts.columns).to.be.an('string');
//       expect(queryParts.columns).to.include('a');
//       expect(queryParts.columns).to.include('b');
//       expect(queryParts.columns).to.include('c');
//     });
//   });
// });
