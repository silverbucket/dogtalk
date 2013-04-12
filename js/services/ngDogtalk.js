angular.module('ngDogtalk', ['ngSockethubClient']).
factory('initialize', ['$rootScope', '$q', '$timeout', 'sockethubCleint',
function ($rootScope, $q, $timeout, sockethubClient) {
  return {
    setState: function () {
      console.log('dogtalk.initialize.setState()');
      var defer = $q.defer();
      $timeout(function() {
        if (remoteStorage.getBearerToken() === null) {
          defer.reject({error: 'remotestorage-connect'});
        } else {
          if ((sockethubClient.isConnected()) && (sockethubClient.isRegistered())) {
            console.log('already connected and registered to sockethub');
            defer.resolve();
          } else if (sockethubClient.isConnected()) {
            console.log('already connected to sockethub');
            sockethubClient.register(defer.resolve, defer.reject);
          } else {
            if (sockethubClient.config.exists()) {
              console.log('already have sockethub config, no need to fetch');
              sockethubClient.connect().then(defer.resolve, defer.reject);
            } else {
              remoteStorage.onWidget('ready', function() {
                remoteStorage.sockethub.getConfig().then(function (config) {
                  console.log('got config: ', config);
                  if (!config) {
                    defer.reject({error: 'sockethub-config'});
                  } else {
                    console.log('setting config and attempting connection');
                    sockethubClient.config.host = config.host;
                    sockethubClient.config.port = config.port;
                    sockethubClient.config.secret = config.secret;
                    sockethubClient.connect().then(function () {
                      sockethubClient.register(function () {
                        $rootScope.$apply(defer.resolve);
                      }, function () {
                        $rootScope.$apply(defer.reject);
                      });
                    }, function () {
                      $rootScope.$apply(defer.reject);
                    });
                  }
                }, function (error) {
                  defer.reject({error: 'sockethub-config'});
                });
              });
            }
          }
        }
      }, 0);
      return defer.promise;
    }
  };
}] );