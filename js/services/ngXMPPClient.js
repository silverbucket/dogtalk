angular.module('ngXMPPClient', ['ngSockethubClient', 'ngRemoteStorageClient']).
factory('XMPP', ['$rootScope', '$q', 'RS', 'SH',
function ($rootScope, $q, RS, SH) {

  var sc;

  var config = {
    username: '',
    password: '',
    server: '',
    resource: '',
    port: ''
  };

  var contacts = {};

  function existsConfig() {
    return verifyConfig(config);
  }

  function verifyConfig(cfg) {
    if (cfg) {
      check = cfg;
    } else {
      check = config;
    }
    if ((check.username !== '') &&
        (check.password !== '') &&
        (check.port !== '') &&
        (check.resource !== '') &&
        (check.server !== '')) {
      return true;
    } else {
      return false;
    }
  }

  function setConfig(cfg) {
    var defer = $q.defer();

    if (verifyConfig(cfg)) {
      console.log('cfg:',cfg);
      config.username = cfg.username;
      config.password = cfg.password;
      config.port = cfg.port;
      config.resource = cfg.resource;
      config.server = cfg.server;

      if (SH.isConnected()) {

        SH.set('xmpp', 'credentials', cfg.username, config).then(function () {
          RS.call('messages', 'setAccount', ['xmpp', 'default', cfg]).then(function () {
            defer.resolve(cfg);
          }, defer.reject);
        }, function () {
          defer.reject();
        });
      } else {
        RS.call('messages', 'setAccount', ['xmpp', 'default', cfg]).then(function () {
          defer.resolve(cfg);
        }, defer.reject);
      }


    } else {
      defer.reject();
    }
    return defer.promise;
  }

  function getConfig() {
    var defer = $q.defer();
    if (!existsConfig()) {
      RS.call('messages', 'getAccount', ['xmpp', 'default']).then(function (account) {
        console.log('account:', account);
        console.log('account.username:', account.username);
        setConfig(account).then(function () {
          defer.resolve(account);
        }, defer.reject);
      }, defer.reject);
    } else {
      defer.resolve(config);
    }
    return defer.promise;
  }

  var presence = {
    state: undefined,
    statusText: null
  };

  function getPresence() {
    return presence.state;
  }

  function setPresence(state, statusText, getRoster) {
    var defer = $q.defer();

    SH.submit({
      platform: 'xmpp',
      verb: 'update',
      actor: {
        address: config.username
      },
      object: {
        show: state,
        status: statusText,
        roster: getRoster
      }
    }, 15000).then(function () {
      presence.state = state;
      presence.statusText = statusText;
      defer.resolve();
    }, function (msg) {
      defer.reject(msg);
    });

    return defer.promise;
  }


  function initListener() {
    SH.on('message', function (data) {
      console.log('XMPP getting message: ', data);
      if (data.actor !== config.username) {  // someone else interacting with us

        // contact list & presence update
        if (!contacts[data.actor.address]) {
          contacts[data.actor.address] = {
            conversation: []
          };
        }

        if ((data.platform === 'xmpp') &&
            (data.verb === 'update')) {

          contacts[data.actor.address].address = data.actor.address;
          //contacts[data.actor.address].target = data.target[0];

          //name
          if (data.actor.name) {
            contacts[data.actor.address].name = data.actor.name;
          } else if (!contacts[data.actor.address].name) {
            contacts[data.actor.address].name = data.actor.address;
          }

          //state
          if (data.object.state) {
            contacts[data.actor.address].state = data.object.state;
          } else if (!contacts[data.actor.address].state) {
            contacts[data.actor.address].state = 'online';
          }

          //statusText
          if (data.object.statusText) {
            contacts[data.actor.address].statusText = data.object.statusText;
          } else if (!contacts[data.actor.address].statusText) {
            contacts[data.actor.address].statusText = '';
          }

        } else if ((data.platform === 'xmpp') &&
                   (data.verb === 'send')) {
          // a new message from someone on the outside
          console.log('added to conversation stack');
          contacts[data.actor.address].conversation.unshift(data);
        }
    /*
     * outgoing messsages will be coming through us, so do we need to set
     * up a sockethub listener?
     * maybe to validate receipt?
     *
     *} else { // us interacting with someone else
      if ((data.platform === 'xmpp') &&
          (data.verb === 'send')) {
        // a new message from us to someone on else
        contacts[data.target[0].address].conversation.unshift(data);
      }*/
      }
    });
  }


  // send a message to sockethub
  function sendMsg(from, to, text) {
    var defer = $q.defer();
    var obj = {
      platform: 'xmpp',
      verb: 'send',
      actor: { address: from },
      target: [{ address: to }],
      object: {
        text: text
      }
    };
    SH.submit(obj).then(function () {
      // add message to conversation stack
      contacts[to].conversation.unshift(obj);
      defer.resolve();
    }, function (err) {
      defer.reject(err);
    });
    return defer.promise;
  }

//
// XXX TODO :
// instead of having getters and setters, it may be better to expose the variables
// directly and then have some kind of watcher (angular ?) to do stuff when the
// fields change
//
  return {
    config: {
      get: getConfig,
      set: setConfig,
      exists: existsConfig,
      data: config
    },
    presence: {
      set: setPresence,
      get: getPresence,
      data: presence
    },
    contacts: {
      data: contacts
    },
    initListener: initListener,
    sendMsg: sendMsg
  };
}]);