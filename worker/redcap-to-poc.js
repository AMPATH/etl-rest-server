const _ = require('lodash');
const querystring = require('querystring');
const Promise = require('bluebird');
const curl = require('curlrequest');
const request = require('request');
const moment = require('moment');
const rp = require("request-promise");
const Bottleneck = require("bottleneck");
const redis = require('redis');
const fs = require('fs');

const config = require('../conf/config');
// const errorLog = require('./utils/logger').errorlog;
// const successlog = require('./utils/logger').successlog;


//limits the number of requests going out
const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 333
});




let App = {

  patientExist: false,

  children: [{
      child_1_surname: 'SEREM',
      child_1_first_name: 'MERCY',
      child_1_dob: undefined,
      child_1_gender: '1',
      child_1_amrs_id: ''
    },
    {
      child_2_surname: 'SEREM',
      child_2_first_name: 'JUDITH',
      child_2_dob: '2005-05-20',
      child_2_gender: '1',
      child_2_amrs_id: ''
    },
    {
      child_3_surname: 'SEREM',
      child_3_first_name: 'ROY',
      child_3_dob: '2009-02-25',
      child_3_gender: '0',
      child_3_amrs_id: ''
    },
    {
      child_4_surname: 'SEREM',
      child_4_first_name: 'JOSHUA',
      child_4_dob: '2014-04-15',
      child_4_gender: '0',
      child_4_amrs_id: ''
    }
  ],


  identifiers: [
    "700200132-4",
    "378839939-6",
    "318833193-2",
    "762410972-9",
    "871788793-2",
    "426980732-9",
    "967877309-5",
    "906940324-5",
    "718979948-4",
    "383024941-7"
  ],

  testData: [{
      dependents: true,
      principal_surname: 'KIPKOECH',
      principal_first_name: 'TUNGE',
      principal_date_of_birth: '1969-04-20',
      principal_age: '49.813480085149',
      principal_gender: '0',
      principal_amrs_id: '',
      principal_unique_id: 'Z-2238-672-6',
      number_of_dpts: '2',
      spouse_surname: 'KIPKOECH',
      spouse_first_name: 'PACIFIC',
      spouse_date_of_birth: '',
      spouse_amrs_id: '',
      spouse_uniq_id: 'Z-2238-562-9',
      chidren: [
        [Object]
      ]
    },
    {
      dependents: false,
      principal_surname: 'TUNGE',
      principal_first_name: 'DENNIS',
      principal_date_of_birth: '1994-04-29',
      principal_age: '24.789010041274',
      principal_gender: '0',
      principal_amrs_id: '',
      principal_unique_id: 'Z-2238-532-2',
      number_of_dpts: '',
      spouse_surname: '',
      spouse_first_name: '',
      spouse_date_of_birth: '',
      spouse_amrs_id: '',
      spouse_uniq_id: '',
      spouse_gender: ''
    },
    {
      dependents: false,
      principal_surname: 'CHOGE',
      principal_first_name: 'HELLENA',
      principal_date_of_birth: '1948-12-31',
      principal_age: '70.117798448976',
      principal_gender: '1',
      principal_amrs_id: '',
      principal_unique_id: 'Z-2238-442-4',
      number_of_dpts: '',
      spouse_surname: '',
      spouse_first_name: '',
      spouse_date_of_birth: '',
      spouse_amrs_id: '',
      spouse_uniq_id: '',
      spouse_gender: ''
    },
    {
      dependents: false,
      principal_surname: 'BETT',
      principal_first_name: 'RAEL',
      principal_date_of_birth: '1967-12-31',
      principal_age: '51.119461727482',
      principal_gender: '1',
      principal_amrs_id: '281068552-5',
      principal_unique_id: 'Z-2238-432-5',
      number_of_dpts: '',
      spouse_surname: '',
      spouse_first_name: '',
      spouse_date_of_birth: '',
      spouse_amrs_id: '',
      spouse_uniq_id: '',
      spouse_gender: ''
    },
    {
      dependents: false,
      principal_surname: 'KIPROP',
      principal_first_name: 'ROBERT',
      principal_date_of_birth: '1974-12-31',
      principal_age: '44.118633510613',
      principal_gender: '0',
      principal_amrs_id: '',
      principal_unique_id: 'Z-2238-842-5',
      number_of_dpts: '',
      spouse_surname: '',
      spouse_first_name: '',
      spouse_date_of_birth: '',
      spouse_amrs_id: '',
      spouse_uniq_id: '',
      spouse_gender: ''
    },
    {
      dependents: true,
      principal_surname: 'MAINA',
      principal_first_name: 'JAMES',
      principal_date_of_birth: '1953-12-31',
      principal_age: '65.115642347208',
      principal_gender: '0',
      principal_amrs_id: '',
      principal_unique_id: 'Z-2238-802-9',
      number_of_dpts: '1',
      spouse_surname: 'KEMBOI',
      spouse_first_name: 'ESTHER',
      spouse_date_of_birth: '1964-12-31',
      spouse_amrs_id: '1964-12-31',
      spouse_uniq_id: 'Z-},2238-572-8',
      chidren: [
        [Object]
      ]
    },
    {
      dependents: true,
      principal_surname: 'MAIYO',
      principal_first_name: 'ANDREW',
      principal_date_of_birth: '1976-01-01',
      principal_age: '43.116559546055',
      principal_gender: '0',
      principal_amrs_id: '',
      principal_unique_id: 'Z-2238-162-8',
      number_of_dpts: '2',
      spouse_surname: 'CHEBET',
      spouse_first_name: 'STELLA',
      spouse_date_of_birth: '1994-02-03',
      spouse_amrs_id: '1994-02-03',
      spouse_uniq_id: 'Z-2238-522-3',
      chidren: [
        [Object]
      ]
    },
    {
      dependents: false,
      principal_surname: 'LELEI',
      principal_first_name: 'ELIUD',
      principal_date_of_birth: '1985-12-31',
      principal_age: '33.117723156533',
      principal_gender: '0',
      principal_amrs_id: '',
      principal_unique_id: 'Z-2238-822-7',
      number_of_dpts: '',
      spouse_surname: '',
      spouse_first_name: '',
      spouse_date_of_birth: '',
      spouse_amrs_id: '',
      spouse_uniq_id: '',
      spouse_gender: ''
    },
    {
      dependents: true,
      principal_surname: 'LELEI',
      principal_first_name: 'DORCAS',
      principal_date_of_birth: '1987-11-03',
      principal_age: '31.277849647837',
      principal_gender: '1',
      principal_amrs_id: '',
      principal_unique_id: 'Z-2238-352-5',
      number_of_dpts: '3',
      spouse_surname: 'LELEI',
      spouse_first_name: 'ELIUD',
      spouse_date_of_birth: '1985-12-31',
      spouse_amrs_id: '1985-12-31',
      spouse_uniq_id: '',
      chidren: [
        [Object]
      ]
    },
    {
      dependents: true,
      principal_surname: 'SAMOEI',
      principal_first_name: 'PAUL',
      principal_date_of_birth: '1973-10-09',
      principal_age: '45.345215849744',
      principal_gender: '0',
      principal_amrs_id: '',
      principal_unique_id: 'Z-2238-642-9',
      number_of_dpts: '1',
      spouse_surname: 'SAMOEI',
      spouse_first_name: 'PRISCA',
      spouse_date_of_birth: '1985-12-31',
      spouse_amrs_id: '1985-12-31',
      spouse_uniq_id: 'Z-2238-312-9',
      chidren: [
        [Object]
      ]
    }

  ],
  relationships: {
    parent_child: "7878d348-1359-11df-a1f1-0026b9348838",
    sibling_sibling: "7878dc30-1359-11df-a1f1-0026b9348838",
    spouse_spouse: "7878df3c-1359-11df-a1f1-0026b9348838"
  },
  default_location: "18c343eb-b353-462a-9139-b16606e6b6c2", //,location test
  identifier_type: "58a4732e-1359-11df-a1f1-0026b9348838",
  default_user: "167662-0",

  init: function() {

    this.process();

  },
  getRedCapData: function() {
    //move to config
    return new Promise(function(resolve, reject) {
      request.post({
        url: `https://redcap.ampath.or.ke/api/`,
        form: {
          token: `7DBC57D7A59C23DCAB0C1A938EFDCD83`,
          content: `record`,
          format: `json`,
          returnFormat: `json`,
          type: `flat`,
          records: ``,
          fields: `survey_gps_latitude,survey_gps_longitude`
        }
      }, function(err, httpResponse, body) {
        if (!err && httpResponse.statusCode === 200) {
          let data = JSON.parse(body);
          let lenght = _.size(data);
          let pp = [];
          _.each(data, function(value) {
            //build payload
            let patient_data = {};
            let numberOfDependents = value.number_of_dpts;
            if (numberOfDependents === '0' || numberOfDependents === '') {
                patient_data.dependents = false,
                patient_data.principal_surname = value.principal_surname,
                patient_data.principal_first_name = value.principal_first_name,
                patient_data.principal_date_of_birth = value.principal_date_of_birth,
                patient_data.principal_age = value.principal_age,
                patient_data.principal_gender = value.principal_gender,
                patient_data.principal_amrs_id = value.principal_amrs_id,
                patient_data.principal_unique_id = value.principal_unique_id,
                patient_data.number_of_dpts = value.number_of_dpts,
                patient_data.spouse_surname = value.spouse_surname,
                patient_data.spouse_first_name = value.spouse_first_name,
                patient_data.spouse_date_of_birth = value.spouse_date_of_birth,
                patient_data.spouse_amrs_id = value.spouse_date_of_birth,
                patient_data.spouse_uniq_id = value.spouse_uniq_id,
                patient_data.spouse_gender = value.spouse_gender
                pp.push(patient_data);
            } else {
              //create an array with the child information
              let children = [];
              let count = 0;
              let childObj = {},
                childObj2 = {},
                childObj3 = {},
                childObj4 = {},
                childObj5 = {},
                childObj6 = {},
                childObj7 = {};

              let d = parseInt(numberOfDependents, 10);

              switch (d) {
                case 1:
                  childObj.child_1_surname = value.child_1_surname;
                  childObj.child_1_first_name = value.child_1_first_name;
                  childObj.child_1_dob = value.childObj;
                  childObj.child_1_gender = value.child_1_gender;
                  childObj.child_1_amrs_id = value.child_1_amrs_id;
                  children.push(
                    childObj
                  );
                  break;
                case 2:
                  childObj.child_1_surname = value.child_1_surname;
                  childObj.child_1_first_name = value.child_1_first_name;
                  childObj.child_1_dob = value.childObj;
                  childObj.child_1_gender = value.child_1_gender;
                  childObj.child_1_amrs_id = value.child_1_amrs_id;
                  childObj2.child_2_surname = value.child_2_surname;
                  childObj2.child_2_first_name = value.child_2_first_name;
                  childObj2.child_2_dob = value.child_2_dob;
                  childObj2.child_2_gender = value.child_2_gender;
                  childObj2.child_2_amrs_id = value.child_2_amrs_id;
                  children.push(
                    childObj,
                    childObj2
                    // childObj2: childObj2
                  );
                  break;
                case 3:
                  childObj.child_1_surname = value.child_1_surname;
                  childObj.child_1_first_name = value.child_1_first_name;
                  childObj.child_1_dob = value.childObj;
                  childObj.child_1_gender = value.child_1_gender;
                  childObj.child_1_amrs_id = value.child_1_amrs_id;
                  childObj2.child_2_surname = value.child_2_surname;
                  childObj2.child_2_first_name = value.child_2_first_name;
                  childObj2.child_2_dob = value.child_2_dob;
                  childObj2.child_2_gender = value.child_2_gender;
                  childObj2.child_2_amrs_id = value.child_2_amrs_id;
                  childObj3.child_3_surname = value.child_3_surname;
                  childObj3.child_3_first_name = value.child_3_first_name;
                  childObj3.child_3_dob = value.child_3_dob;
                  childObj3.child_3_gender = value.child_3_gender;
                  childObj3.child_3_amrs_id = value.child_3_amrs_id;
                  children.push(
                    childObj,
                    childObj2,
                    childObj3
                  );
                  break;
                case 4:
                  childObj.child_1_surname = value.child_1_surname;
                  childObj.child_1_first_name = value.child_1_first_name;
                  childObj.child_1_dob = value.childObj;
                  childObj.child_1_gender = value.child_1_gender;
                  childObj.child_1_amrs_id = value.child_1_amrs_id;
                  childObj2.child_2_surname = value.child_2_surname;
                  childObj2.child_2_first_name = value.child_2_first_name;
                  childObj2.child_2_dob = value.child_2_dob;
                  childObj2.child_2_gender = value.child_2_gender;
                  childObj2.child_2_amrs_id = value.child_2_amrs_id;
                  childObj3.child_3_surname = value.child_3_surname;
                  childObj3.child_3_first_name = value.child_3_first_name;
                  childObj3.child_3_dob = value.child_3_dob;
                  childObj3.child_3_gender = value.child_3_gender;
                  childObj3.child_3_amrs_id = value.child_3_amrs_id;
                  childObj4.child_4_surname = value.child_4_surname;
                  childObj4.child_4_first_name = value.child_4_first_name;
                  childObj4.child_4_dob = value.child_4_dob;
                  childObj4.child_4_gender = value.child_4_gender;
                  childObj4.child_4_amrs_id = value.child_4_amrs_id;
                  children.push(
                    childObj,
                    childObj2,
                    childObj3,
                    childObj4
                  );
                  break;
                case 5:
                  childObj.child_1_surname = value.child_1_surname;
                  childObj.child_1_first_name = value.child_1_first_name;
                  childObj.child_1_dob = value.childObj;
                  childObj.child_1_gender = value.child_1_gender;
                  childObj.child_1_amrs_id = value.child_1_amrs_id;
                  childObj2.child_2_surname = value.child_2_surname;
                  childObj2.child_2_first_name = value.child_2_first_name;
                  childObj2.child_2_dob = value.child_2_dob;
                  childObj2.child_2_gender = value.child_2_gender;
                  childObj2.child_2_amrs_id = value.child_2_amrs_id;
                  childObj3.child_3_surname = value.child_3_surname;
                  childObj3.child_3_first_name = value.child_3_first_name;
                  childObj3.child_3_dob = value.child_3_dob;
                  childObj3.child_3_gender = value.child_3_gender;
                  childObj3.child_3_amrs_id = value.child_3_amrs_id;
                  childObj4.child_4_surname = value.child_4_surname;
                  childObj4.child_4_first_name = value.child_4_first_name;
                  childObj4.child_4_dob = value.child_4_dob;
                  childObj4.child_4_gender = value.child_4_gender;
                  childObj4.child_4_amrs_id = value.child_4_amrs_id;
                  childObj5.child_5_surname = value.child_5_surname;
                  childObj5.child_5_first_name = value.child_5_first_name;
                  childObj5.child_5_dob = value.child_5_dob;
                  childObj5.child_5_gender = value.child_5_gender;
                  childObj5.child_5_amrs_id = value.child_5_amrs_id;
                  children.push(
                    childObj,
                    childObj2,
                    childObj3,
                    childObj4,
                    childObj5
                  );
                  break;
                case 6:
                  childObj.child_1_surname = value.child_1_surname;
                  childObj.child_1_first_name = value.child_1_first_name;
                  childObj.child_1_dob = value.childObj;
                  childObj.child_1_gender = value.child_1_gender;
                  childObj.child_1_amrs_id = value.child_1_amrs_id;
                  childObj2.child_2_surname = value.child_2_surname;
                  childObj2.child_2_first_name = value.child_2_first_name;
                  childObj2.child_2_dob = value.child_2_dob;
                  childObj2.child_2_gender = value.child_2_gender;
                  childObj2.child_2_amrs_id = value.child_2_amrs_id;
                  childObj3.child_3_surname = value.child_3_surname;
                  childObj3.child_3_first_name = value.child_3_first_name;
                  childObj3.child_3_dob = value.child_3_dob;
                  childObj3.child_3_gender = value.child_3_gender;
                  childObj3.child_3_amrs_id = value.child_3_amrs_id;
                  childObj4.child_4_surname = value.child_4_surname;
                  childObj4.child_4_first_name = value.child_4_first_name;
                  childObj4.child_4_dob = value.child_4_dob;
                  childObj4.child_4_gender = value.child_4_gender;
                  childObj4.child_4_amrs_id = value.child_4_amrs_id;
                  childObj5.child_5_surname = value.child_5_surname;
                  childObj5.child_5_first_name = value.child_5_first_name;
                  childObj5.child_5_dob = value.child_5_dob;
                  childObj5.child_5_gender = value.child_5_gender;
                  childObj5.child_5_amrs_id = value.child_5_amrs_id;
                  childObj6.child_6_surname = value.child_6_surname;
                  childObj6.child_6_first_name = value.child_6_first_name;
                  childObj6.child_6_dob = value.child_6_dob;
                  childObj6.child_6_gender = value.child_6_gender;
                  childObj6.child_6_amrs_id = value.child_6_amrs_id;
                  children.push(
                    childObj,
                    childObj2,
                    childObj3,
                    childObj4,
                    childObj5,
                    childObj6
                  );
                  break;
                case 7:
                  childObj.child_1_surname = value.child_1_surname;
                  childObj.child_1_first_name = value.child_1_first_name;
                  childObj.child_1_dob = value.childObj;
                  childObj.child_1_gender = value.child_1_gender;
                  childObj.child_1_amrs_id = value.child_1_amrs_id;
                  childObj2.child_2_surname = value.child_2_surname;
                  childObj2.child_2_first_name = value.child_2_first_name;
                  childObj2.child_2_dob = value.child_2_dob;
                  childObj2.child_2_gender = value.child_2_gender;
                  childObj2.child_2_amrs_id = value.child_2_amrs_id;
                  childObj3.child_3_surname = value.child_3_surname;
                  childObj3.child_3_first_name = value.child_3_first_name;
                  childObj3.child_3_dob = value.child_3_dob;
                  childObj3.child_3_gender = value.child_3_gender;
                  childObj3.child_3_amrs_id = value.child_3_amrs_id;
                  childObj4.child_4_surname = value.child_4_surname;
                  childObj4.child_4_first_name = value.child_4_first_name;
                  childObj4.child_4_dob = value.child_4_dob;
                  childObj4.child_4_gender = value.child_4_gender;
                  childObj4.child_4_amrs_id = value.child_4_amrs_id;
                  childObj5.child_5_surname = value.child_5_surname;
                  childObj5.child_5_first_name = value.child_5_first_name;
                  childObj5.child_5_dob = value.child_5_dob;
                  childObj5.child_5_gender = value.child_5_gender;
                  childObj5.child_5_amrs_id = value.child_5_amrs_id;
                  childObj6.child_6_surname = value.child_6_surname;
                  childObj6.child_6_first_name = value.child_6_first_name;
                  childObj6.child_6_dob = value.child_6_dob;
                  childObj6.child_6_gender = value.child_6_gender;
                  childObj6.child_6_amrs_id = value.child_6_amrs_id;
                  childObj7.child_7_surname = value.child_7_surname;
                  childObj7.child_7_first_name = value.child_7_first_name;
                  childObj7.child_7_dob = value.child_7_dob;
                  childObj7.child_7_gender = value.child_7_gender;
                  childObj7.child_7_amrs_id = value.child_7_amrs_id;
                  children.push(
                    childObj,
                    childObj2,
                    childObj3,
                    childObj4,
                    childObj5,
                    childObj6,
                    childObj7
                  );
                  break;
                default:
                  childObj.child_1_surname = value.child_1_surname;
                  childObj.child_1_first_name = value.child_1_first_name;
                  childObj.child_1_dob = value.childObj;
                  childObj.child_1_gender = value.child_1_gender;
                  childObj.child_1_amrs_id = value.child_1_amrs_id;
                  children.push(
                    childObj
                  );
              }

              patient_data.dependents = true,
                patient_data.principal_surname = value.principal_surname,
                patient_data.principal_first_name = value.principal_first_name,
                patient_data.principal_date_of_birth = value.principal_date_of_birth,
                patient_data.principal_age = value.principal_age,
                patient_data.principal_gender = value.principal_gender,
                patient_data.principal_amrs_id = value.principal_amrs_id,
                patient_data.principal_unique_id = value.principal_unique_id,
                patient_data.number_of_dpts = value.number_of_dpts,
                patient_data.spouse_surname = value.spouse_surname,
                patient_data.spouse_first_name = value.spouse_first_name,
                patient_data.spouse_date_of_birth = value.spouse_date_of_birth,
                patient_data.spouse_amrs_id = value.spouse_date_of_birth,
                patient_data.spouse_uniq_id = value.spouse_uniq_id,
                patient_data.chidren = children;
              pp.push(patient_data);
            }
          });
          resolve(pp);
        } else {
          reject(err);
        }
      });
    });

  },

  process: function() {
    let relationship_uuids = {};
    let principal = {};
    let spouse = {};
    let children = {};

    App.getRedCapData()
      .then((data) => {
    console.log('*******************************************************');
    console.log('.............. Starting ..................');
    console.log('********************************************************');
    App.checkIfPatientExist(data).then((existingPatients) => {

      App.createPrincipal(existingPatients);


      data.map((d) => {
        App.createChildren(d.children);

      });
    }).catch(function(err) {
      console.log('getRedCapDataError', err);

    });

    }).catch(function(err) {
      console.log('getRedCapDataError', err);

    });
  },
  checkIfPatientExist: function(data) {
    return new Promise(function(resolve, reject) {
      Promise.all(data.map(function(v) {
        let fname = v.principal_first_name
        let queryObject = querystring.stringify({
          q: v.principal_surname,
          fname,
          v: "custom:person:(uuid,display,gender,birthdate,dead,age,deathDate,birthdateEstimated,causeOfDeath,preferredName:(uuid,preferred,givenName,middleName,familyName)"
        });
        //TODO: MOVE TO CONFIG
        let url = `https://ngx.ampath.or.ke/test-amrs/ws/rest/v1/patient?${queryObject}`;
        let usernamePass = config.eidSyncCredentials2.username + ":" + config.eidSyncCredentials2.password;
        let auth = "Basic " + Buffer.from(usernamePass).toString('base64');

        let options = {
          url: url,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': auth
          },
          method: 'GET'
        };
        return limiter.schedule(rp, options)
          .then((response) => {
            let d = JSON.parse(response);
            let result = d.results;
            _.each(result, function(i) {
              if (v.principal_age == '') {
                resolve(data);
              } else {
                let p_age = parseInt(d.principal_age, 10);
                if (p_age === i.person.age) {
                  reject('patient already exist');
                } else {
                  resolve(data);
                }
              }
            })
          })
          .catch((err) => {
            reject(err);
          });
      }))
    });
  },

  createRelationship: function(personA, personB) {
    return new Promise(function(resolve, reject) {
      let url = `https://ngx.ampath.or.ke/test-amrs/ws/rest/v1/relationship`;
      let usernamePass = config.eidSyncCredentials2.usernamecreatePatientRequest + ":" + config.eidSyncCredentials2.password;
      let auth = "Basic " + Buffer.from(usernamePass).toString('base64');

      let payload = {
        "personA": personA,
        "relationshipType": "7878dc30-1359-11df-a1f1-0026b9348838",
        "personB": personB
      };

      let p = JSON.stringify(payload);
      let options = {
        url: url,
        data: p,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': auth
        },
        method: 'POST'
      };

      curl.request(options, function(err, parts) {
        if (err || (parts && JSON.parse(parts).error)) {
          reject(err || (parts && JSON.parse(parts).error));
        } else {
          resolve(parts);
        }
      });
    })
  },
  generateAMRSid: function() {
    console.log('generateAMRSid-------------------------------------------------');
    return new Promise(function(resolve, reject) {
      let url = `https://ngx.ampath.or.ke/amrs-idgenerator/generateidentifier`
      let payload = {
        user: App.default_user
      };

      let p = JSON.stringify(payload);

      let options = {
        url: url,
        body: p,
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST'
      };

      return limiter.schedule(rp, options)
        .then((body) => {
          let id = JSON.parse(body);
          //return id.identifier;
          console.log(id.identifier);
          resolve(id.identifier);
        })
        .catch((error) => {
          console.dir(error);
          //return error;
          reject(error);
        })
    });
  },
  createPrincipal: function(principal) {
    let sortedData = [];
    principal.map((p) => {
      let p_principal = App.createPatientRequest(p.principal_surname, p.principal_first_name, p.principal_gender, p.principal_date_of_birth);
      sortedData.push(p_principal);
      if (p.spouse_surname) {
        let s_spouse = App.createPatientRequest(p.spouse_surname, p.spouse_first_name, p.principal_gender, p.spouse_date_of_birth);
        sortedData.push(s_spouse);
      };

    });
    return sortedData;
  },
  createSpouse: function(surname, fname, gender, dob) {
    return new Promise(function(resolve, reject) {
      App.generateAMRSid().then(function(id) {
        if (id != true && fname !== '') {
          return App.createPatientRequest(surname, fname, gender, dob);
        } else {
          reject('IDNOTFOUND');
        }
      }).then(function(createdSpouse) {
        resolve(createdSpouse);
      })
    })
  },
  createChildren: function(children) {
    console.log('-------------------------------------creating children-----------------------------------------');
    _.each(children, function(c) {
      let surname = c.child_1_surname || c.child_2_surname || c.child_3_surname || c.child_4_surname || c.child_5_surname || c.child_6_surname || c.child_7_surname;
      let fname = c.child_1_first_name || c.child_2_first_name || c.child_3_first_name || c.child_4_first_name || c.child_5_first_name || c.child_6_first_name || c.child_7_first_name;
      let dob = c.child_1_dob || c.child_2_dob || c.child_3_dob || c.child_4_dob || c.child_5_dob || c.child_6_dob || c.child_7_dob || c.child_8_dob;
      let gender = c.child_1_gender || c.child_2_gender || c.child_3_gender || c.child_4_gender || c.child_5_gender || c.child_6_gender || c.child_7_gender;
      App.createPatientRequest(surname, fname, gender, dob);
    });
  },
  createPatientRequest: function(surname, familyname, gender, dob) {
    console.log('createPatientRequest-------------------------------------------',surname,familyname);
    let url = `https://ngx.ampath.or.ke/test-amrs/ws/rest/v1/patient`;
    let usernamePass = config.eidSyncCredentials2.username + ":" + config.eidSyncCredentials2.password;
    let auth = "Basic " + Buffer.from(usernamePass).toString('base64');
    if (gender == '1' || gender == '') {
      gender == 'F'
    } else {
      if (gender == '0') {
        gender == 'M'
      };
    }

    App.generateAMRSid().then((id) => {
      let payload = {
        "person": {
          "names": [{
            "givenName": surname,
            "familyName": familyname
          }],
          "gender": gender,
          "birthdate": "2010-01-04T14:17:14+03:00"
        },
        "identifiers": [{
          "identifierType": App.identifier_type,
          "identifier": id,
          "location": App.default_location,
          "preferred": true
        }]
      }
      let p = JSON.stringify(payload);

      let options = {
        url: url,
        body: p,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': auth
        },
        method: 'POST'
      };

      rp(options)
        .then((body) => {
          console.dir(body);
          return body;
        })
        .catch((error) => {
          console.dir(error);
          return false;
        })
    }).catch((err)=>{
      console.log('generateAMRSid ',err);
    })
  },
  checkIfDataExist: function() {
    let limit = 100;
    var sql = 'select * from etl.program_registration_queue limit ?';
    var qObject = {
      query: sql,
      sqlParams: [limit]
    };
    return new Promise(function(resolve, reject) {
      db.queryReportServer(qObject, function(data) {
        resolve(data.result);
      });
    });
  },
};
App.init();
