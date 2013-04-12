angular.module('ngSockethubClient', []).
factory('sockethubClient', ['$rootScope',
function ($rootScope) {

  var sc = {
    isConnected: function () { return false; },
    isRegistered: function () { return false; }
  };

  var config = {
    host: '',
    port: '',
    secret: '',
    exists: function () {
      if ((config.host !== '') &&
          (config.port !== '') &&
          (config.secret !== '')) {
        return true;
      } else {
        return false;
      }
    }
  };

  function register() {
    console.log('ngSockethubClient.register() called');
    var defer = $q.defer();
    sockethub.register({
      secret: config.secret
    }).then(function () {
      console.log('ngSockethubClient.register: registration success');
      $rootScope.$apply(function () {
        defer.resolve();
      });
    }, function (err) { // sockethub registration fail
      console.log('ngSockethubClient.register: registration failed: ', err);
      $rootScope.$apply(function () {
        defer.reject({error: 'sockethub-register', message: err});
      });
    });
    return defer.promise;
  }

  function connect() {
    var defer = $q.defer();
    console.log('ngSockethubClient.connect() called');
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
      console.log('ngSockethubClient.connect: received error on connect: ', err);
      $rootScope.$apply(function () {
        if (err) {
          defer.reject({error:'sockethub-connect', message: err});
        } else {
          defer.reject({error:'sockethub-connect'});
        }
      });
    });
    return defer.promise;
  }

  return {
    config: config,
    connect: connect,
    register: register,
    isConnected: sc.isConnected,
    isRegistered: sc.isRegistered
  };
}]);