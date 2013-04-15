angular.module('ngSockethubClient', ['ngRemoteStorageClient']).
factory('SH', ['$rootScope', '$q',
function ($rootScope, $q) {

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
    console.log('SH.setConfig: '+host+', '+port+', '+secret);
    config.host = host;
    config.port = port;
    config.secret = secret;
  }

  function getConfig() {
    return config;
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

  return {
    config: {
      set: setConfig,
      get: getConfig,
      exists: existsConfig
    },
    connect: connect,
    register: register,
    isConnected: isConnected,
    isRegistered: isRegistered
  };
}]);