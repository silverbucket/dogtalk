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
      SH.set('xmpp', 'default', config).then(function () {
        console.log('===324242');
        RS.call('messages', 'setAccount', ['xmpp', 'default', cfg]).then(defer.resolve, defer.reject);
      }, defer.reject);
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


  var configFuncs = {
    get: getConfig,
    set: setConfig,
    exists: existsConfig,
    data: config
  };

  return {
    config: configFuncs
  };
}]);