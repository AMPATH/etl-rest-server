'use strict';

var authorizer = {};
var currentUser = null;
var currentUserPrivileges = [];
var currentUserRoles = [];
var analytics = require('../dao/analytics/etl-analytics-dao');
var _ = require('underscore');

const PRIVILEGES = {
  canViewPatient: 'View Patients',
  canViewDataAnalytics: 'View Data Analytics',
  canViewDataEntryStats: 'View POC Data entry statitsisc',
  canViewClinicDashBoard: 'View Clinic Dashboard'
};

var reportPrivileges = {
  'daily-appointments': [
    PRIVILEGES.canViewClinicDashBoard,
    PRIVILEGES.canViewPatient
  ],
  'daily-attendance': [
    PRIVILEGES.canViewClinicDashBoard,
    PRIVILEGES.canViewPatient
  ],
  'daily-has-not-returned': [
    PRIVILEGES.canViewClinicDashBoard,
    PRIVILEGES.canViewPatient
  ],
  attended: [PRIVILEGES.canViewClinicDashBoard],
  scheduled: [PRIVILEGES.canViewClinicDashBoard],
  'clinical-hiv-comparative-overview-report': [PRIVILEGES.canViewDataAnalytics],
  'clinical-art-overview-report': [PRIVILEGES.canViewDataAnalytics],
  'clinical-patient-care-status-overview-report': [
    PRIVILEGES.canViewDataAnalytics
  ],
  'MOH-731-report': [PRIVILEGES.canViewDataAnalytics],
  'MOH-731-allsites-report': [PRIVILEGES.canViewDataAnalytics],
  'MOH-731-report-2017': [PRIVILEGES.canViewDataAnalytics],
  'patient-register-report': [
    PRIVILEGES.canViewPatient,
    PRIVILEGES.canViewDataAnalytics
  ],
  'hiv-summary-report': [PRIVILEGES.canViewDataAnalytics],
  'clinic-comparator-report': [PRIVILEGES.canViewDataAnalytics],
  'hiv-summary-monthly-report': [PRIVILEGES.canViewDataAnalytics],
  'clinical-reminder-report': [PRIVILEGES.canViewPatient],
  'labs-report': [PRIVILEGES.canViewPatient, PRIVILEGES.canViewDataAnalytics],
  'viral-load-monitoring-report': [
    PRIVILEGES.canViewPatient,
    PRIVILEGES.canViewDataAnalytics
  ],
  'medical-history-report': [PRIVILEGES.canViewPatient],
  'clinic-lab-orders-report': [
    PRIVILEGES.canViewClinicDashBoard,
    PRIVILEGES.canViewPatient
  ],
  'patient-status-change-tracker-report': [PRIVILEGES.canViewDataAnalytics],
  'patient-care-cascade-report': [PRIVILEGES.canViewDataAnalytics],
  'cohort-report': [PRIVILEGES.canViewPatient],
  'patient-referral-report': [PRIVILEGES.canViewDataAnalytics]
};

const SUPERUSER_ROLES = ['System Developer'];

authorizer.setUser = function (openmrsUser) {
  currentUser = openmrsUser;
  if (openmrsUser === undefined) return;

  _setCurrentUserPrivileges();
  _setCurrentUserRoles();
};

authorizer.getUser = function () {
  return currentUser;
};

authorizer.getCurrentUserPreviliges = function () {
  //console.log('All privileges', currentUserPrivileges);
  return currentUserPrivileges;
};

authorizer.getCurrentUserRoles = function () {
  return currentUserRoles;
};

authorizer.getAllPrivileges = function () {
  return PRIVILEGES;
};

authorizer.getAllPrivilegesArray = function () {
  const allPrivileges = [];

  for (let prop in PRIVILEGES) {
    allPrivileges.push(PRIVILEGES[prop]);
  }

  return allPrivileges;
};

authorizer.hasPrivilege = function (privilege) {
  if (authorizer.isSuperUser()) {
    return true;
  }
  console.log(
    'Current user privileges: ',
    JSON.stringify(currentUserPrivileges)
  );
  console.log('Looking for privilege: ', privilege);
  if (currentUserPrivileges.indexOf(privilege) > -1) {
    return true;
  }
  return false;
};

authorizer.hasPrivileges = function (arrayOfPrivileges) {
  if (authorizer.isSuperUser()) {
    return true;
  }

  let hasPrivilege = true;

  for (var i = 0; i < arrayOfPrivileges.length; i++) {
    if (!authorizer.hasPrivilege(arrayOfPrivileges[i])) {
      hasPrivilege = false;
      break;
    }
  }
  return hasPrivilege;
};

authorizer.hasReportAccess = function (reportName) {
  var hasAccess = false;
  var requiredPrivileges = reportPrivileges[reportName];

  if (requiredPrivileges) {
    hasAccess = authorizer.hasPrivileges(requiredPrivileges);
  }
  return hasAccess;
};

authorizer.isSuperUser = function () {
  return true; //for now all users are super users
  /** Disabled for now
   for (var i = 0; i < SUPERUSER_ROLES.length; i++) {
       var role = SUPERUSER_ROLES[i];
       if (currentUserRoles.indexOf(role) > -1) {
           return true;
       }
   }

   return false;**/
};

authorizer.getUserAuthorizedLocations = function (userProperties) {
  const authorized = [];
  authorized.push(...resolveLocationName(userProperties, 'aggregate'));
  authorized.push(...resolveLocationName(userProperties, 'operational'));

  return authorized;
};

function resolveLocationName(userProperties, type) {
  const authorized = [];
  for (var key in userProperties) {
    if (type === 'operational') {
      if (/^grantAccessToLocationOperationalData/.test(key)) {
        if (userProperties[key] === '*') {
          const grantedAccessLocationOperationalData = {
            uuid: userProperties[key],
            name: 'All',
            type: 'operational'
          };
          authorized.push(grantedAccessLocationOperationalData);
        } else {
          authorized.push(userProperties[key]);
        }
      }
    } else if (type === 'aggregate') {
      if (/^grantAccessToLocationAggregateData/.test(key)) {
        if (userProperties[key] === '*') {
          const grantedAccessLocationAggregateData = {
            uuid: userProperties[key],
            name: 'All',
            type: 'aggregate'
          };
          authorized.push(grantedAccessLocationAggregateData);
        } else {
          authorized.push(userProperties[key]);
        }
      }
    }
  }

  if (authorized.length > 0) {
    analytics.resolveLocationUuidsToName(authorized, (results) => {
      const resolveLocationUuids = [];
      _.each(results, (result) => {
        if (type === 'operational') {
          resolveLocationUuids.push({
            uuid: result.uuid,
            name: result.name,
            type: 'operational'
          });
        } else if (type === 'aggregate') {
          resolveLocationUuids.push({
            uuid: result.uuid,
            name: result.name,
            type: 'aggregate'
          });
        }
      });
      return resolveLocationUuids;
    });
  } else {
    //for users whose privileges are not set
    return authorized;
  }
  return authorized;
}

function _setCurrentUserPrivileges() {
  currentUserPrivileges = [];
  for (var i = 0; i < currentUser.privileges.length; i++) {
    // console.log('Adding privilege: ', currentUser.privileges[i].display);
    currentUserPrivileges.push(currentUser.privileges[i].display);
  }
}

function _setCurrentUserRoles() {
  currentUserRoles = [];
  for (var i = 0; i < currentUser.roles.length; i++) {
    currentUserRoles.push(currentUser.roles[i].display);
  }
}

module.exports = authorizer;
