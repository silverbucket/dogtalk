angular.module('ngXMPPClient', ['ngSockethubClient', 'ngRemoteStorageClient']).
factory('SH', ['$rootScope', '$q', 'RS', 'SH',
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
      config.username = cfg.username;
      config.password = cfg.password;
      config.port = cfg.port;
      config.resource = cfg.resource;
      config.server = cfg.server;

      RS.setAccount('messages', 'xmpp', config.username, config).then(defer.resolve, defer.reject);
    } else {
      defer.reject();
    }
    return defer.promise;
  }

  function getConfig() {
    var defer = $q.defer();
    if (!existsConfig()) {
      RS.getConfig('sockethub').then(function (cfg) {
        config.host = cfg.host;
        config.port = cfg.port;
        config.secret = cfg.secret;
        defer.resolve(cfg);
      }, defer.reject);
    } else {
      defer.resolve(config);
    }
    return defer.promise;
  }

  function isConnected() {
    if (sc) {
      return sc.isConnected();
    } else {
      return false;
    }
  }

  function isRegistered() {
    if (sc) {
      return sc.isRegistered();
    } else {
      return false;
    }
  }

  function register() {
    //console.log('ngSockethubClient.register() called');
    var defer = $q.defer();
    sc.register({
      secret: config.secret
    }).then(function () {
      //console.log('ngSockethubClient.register: registration success ['+sc.isConnected()+']');
      $rootScope.$apply(defer.resolve);
    }, function (err) { // sockethub registration fail
      console.log('ngSockethubClient.register: registration failed: ', err);
      $rootScope.$apply(function () {
        defer.reject(err.message);
      });
    });
    return defer.promise;
  }

  function connect() {
    var defer = $q.defer();
    //console.log('ngSockethubClient.connect() called');
    SockethubClient.connect({
      host: 'ws://' + config.host + ':' + config.port + '/sockethub',
      confirmationTimeout: 3000,   // timeout in miliseconds to wait for confirm
      enablePings: true            // good for keepalive
    }).then(function (connection) {
      sc = connection;
      $rootScope.$apply(function () {
        defer.resolve();
      });
    }, function (err) { // sockethub connection failed
      $rootScope.$apply(function () {
        //console.log('ngSockethubClient.connect: received error on connect: ', err);
        defer.reject(err);
      });
    });
    return defer.promise;
  }

  var configFuncs = {
    get: getConfig,
    set: setConfig,
    exists: existsConfig,
    data: config
  };

  return {
    config: configFuncs,
    connect: connect,
    register: register,
    isConnected: isConnected,
    isRegistered: isRegistered
  };
}]);