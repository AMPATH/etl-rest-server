const config = require('../conf/config');
const Promise = require('bluebird');
const axios = require('axios');

export class SlackService {
  getBaseUrl() {
    var host = config.slackserver.host;

    return host;
  }
  //post and get from a poc
  postFeedbackToPoc(message) {
    var url = this.getBaseUrl() + '/posttopoc';

    return new Promise(function (resolve, reject) {
      axios
        .post(url, {
          name: message.name,
          location: message.location,
          phone: message.phone,
          department: message.department,
          message: message.message
        })
        .then(function () {
          resolve({ status: 'okay' });
        })
        .catch(function (err) {
          console.log('Error:', err);
          resolve({ status: err });
        });
    });
  }
  getPocMessages(count, oldest) {
    var geturl = this.getBaseUrl() + '/pocfeedback/' + count + '/' + oldest;

    return new Promise(function (resolve, reject) {
      axios
        .get(geturl)
        .then(function (response) {
          resolve(response.data);
        })
        .catch(function (err) {
          console.log(err);
          reject(err);
        });
    });
  }
  postToChannels(message, channel) {
    var url = this.getBaseUrl() + '/posttochannel';

    return new Promise(function (resolve, reject) {
      axios
        .post(url, {
          name: message.name,
          location: message.location,
          phone: message.phone,
          department: message.department,
          message: message.message,
          channel: channel
        })
        .then(function () {
          resolve({ status: 'okay' });
        })
        .catch(function (err) {
          console.log('Error:', err);
          resolve({ status: err });
        });
    });
  }
  postToGroups(message, group) {
    var url = this.getBaseUrl() + '/posttogroup';

    return new Promise(function (resolve, reject) {
      axios
        .post(url, {
          name: message.name,
          location: message.location,
          phone: message.phone,
          department: message.department,
          message: message.message,
          group: group
        })
        .then(function () {
          resolve({ status: 'okay' });
        })
        .catch(function (err) {
          console.log('Error:', err);
          resolve({ status: err });
        });
    });
  }
  getChannelMessages(count, oldest) {
    var geturl =
      this.getBaseUrl() + '/channel-slackmessages/' + count + '/' + oldest;

    return new Promise(function (resolve, reject) {
      axios
        .get(geturl)
        .then(function (response) {
          resolve(response.data);
        })
        .catch(function (err) {
          console.log(err);
          reject(err);
        });
    });
  }

  //get from particular group and channel
  getFromChannel(channelname, count, oldest) {
    var geturl =
      this.getBaseUrl() +
      '/channel-slackmessages/' +
      channelname +
      '/' +
      count +
      '/' +
      oldest;

    return new Promise(function (resolve, reject) {
      axios
        .get(geturl)
        .then(function (response) {
          resolve(response.data);
        })
        .catch(function (err) {
          console.log(err);
          reject(err);
        });
    });
  }

  getFromGroup(groupname, count, oldest) {
    var geturl =
      this.getBaseUrl() +
      '/group-slackmessages/' +
      groupname +
      '/' +
      count +
      '/' +
      oldest;

    return new Promise(function (resolve, reject) {
      axios
        .get(geturl)
        .then(function (response) {
          resolve(response.data);
        })
        .catch(function (err) {
          console.log(err);
          reject(err);
        });
    });
  }
}
