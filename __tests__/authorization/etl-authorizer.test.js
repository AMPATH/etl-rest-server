// const userMocks = require('../../__mocks__/user-mock');
// const etlAuthorizer = require('../../authorization/etl-authorizer');

// describe('ETL authorizer', () => {
//   let userSample;
//   beforeEach(function (done) {
//     userSample = userMocks.getMockedUser();
//     etlAuthorizer.setUser(userSample);
//     done();
//   });

//   afterEach(() => {
//     etlAuthorizer.setUser(undefined);
//   });

//   it('injects user mocks', () => {
//     expect(userMocks).toBeDefined();
//     expect(userSample).toBeDefined();
//   });

//   it('sets user when setUser is called', () => {
//     etlAuthorizer.setUser(userSample);
//     expect(etlAuthorizer.getUser()).toEqual(userSample);
//   });

//   it('returns true when a user has a certain privilege and hasPrivilege is invoked', () => {
//     const toFind = userSample.privileges[2].display;
//     const hasPrivilege = etlAuthorizer.hasPrivilege(toFind);
//     expect(hasPrivilege).toBeTruthy();
//   });

//   it('always returns true when a user is a super user and hasPrivilege is invoked', () => {
//     const userWithSuperUserRole = userMocks.getMockedUser();

//     //add super user role
//     const superUserRole = {
//       uuid: 'some-uuid',
//       display: 'System Developer' //this is a super user role
//     };

//     userWithSuperUserRole.roles.push(superUserRole);

//     //make privileges empty as is the case with super user roles
//     userWithSuperUserRole.privileges = [];

//     //set the user
//     etlAuthorizer.setUser(userWithSuperUserRole);

//     const hasPrivilege = etlAuthorizer.hasPrivilege('some random feature');
//     expect(hasPrivilege).toBeTruthy();
//   });
// });
