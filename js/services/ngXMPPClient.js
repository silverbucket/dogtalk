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
      SH.set('xmpp', 'credentials', cfg.username, config).then(function () {
        RS.call('messages', 'setAccount', ['xmpp', 'default', cfg]).then(function () {
          defer.resolve(cfg);
        }, defer.reject);
      }, function () {
        defer.reject();
      });
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

  function setPresence(state, statusText) {
    var defer = $q.defer();

    SH.submit({
      platform: 'xmpp',
      verb: 'update',
      actor: {
        address: config.username
      },
      object: {
        type: state,
        status: statusText
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
    }
  };
}]);