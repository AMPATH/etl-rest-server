// var db = require('../../../etl-db');
// var dao = require('../../../etl-dao');
// var request = require('request');

// var mockData = require('../../../__mocks__/mock-data');
// var http = require('http');
// var Promise = require('bluebird');
// require('sinon-as-promised')(Promise);

// describe('LAB COHORTS ETL-SERVER TESTS', function () {
//   describe('Testing etl-dao layer', function () {
//     // example showing how to use a stub to fake a method
//     var stub;
//     beforeEach(function (done) {
//       stub = sinon.stub(db, 'queryDb');
//       this.request = sinon.stub(http, 'request');
//       // .yieldsTo(1, null, { result:mockData.getPatientMockData() });
//       done();
//     });

//     afterEach(function () {
//       http.request.restore();
//       stub.restore();
//     });

//     it('should create the right query parts object when loadLabCohorts is called', function (done) {
//       stub.resolves({
//         startIndex: 0,
//         size: 1,
//         result: []
//       });
//       var options = {
//         query: {
//           startDate: '2016-01-08',
//           endDate: '2016-08-08',
//           limit: 10000,
//           offset: 0
//         }
//       };

//       dao.loadLabCohorts(options, function (res) {
//         done();
//       });

//       var queryParts = stub.args[0][0];
//       expect(queryParts.table).to.equal('amrs.patient');
//       expect(queryParts.columns[0]).to.equal('distinct pe.uuid');
//       expect(queryParts.limit).to.equal(10000); //max limit
//     });
//   });
// });
