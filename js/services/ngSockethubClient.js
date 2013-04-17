angular.module('ngSockethubClient', ['ngRemoteStorageClient']).
factory('SH', ['$rootScope', '$q', 'RS',
function ($rootScope, $q, RS) {

  var sc;

  var config = {
    host: '',
    port: '',
    secret: ''
  };

  function existsConfig() {
    if ((config.host !== '') &&
        (config.port !== '') &&
        (config.secret !== '')) {
      return true;
    } else {
      return false;
    }
  }

  function setConfig(host, port, secret) {
    var defer = $q.defer();

    console.log('SH.setConfig: '+host+', '+port+', '+secret);
    config.host = host;
    config.port = port;
    config.secret = secret;

    RS.writeConfig('sockethub', {
      host: host,
      port: port,
      secret: secret
    }).then(function () {

    }, function () {

    });
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