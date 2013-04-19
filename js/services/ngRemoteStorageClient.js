//var ngRemoteStorageClient = angular.module('ngRemoteStorageClient', []);
//
//ngRemoteStorageClient.factory('RS', ['$rootScope', '$q',

var ngRemoteStorageClient = angular.module('ngRemoteStorageClient', []).
factory('RS', ['$rootScope', '$q',
function ($rootScope, $q) {

  return {
    isConnected: function () {
      if (remoteStorage.getBearerToken() === null) {
        return false;
      } else {
        return true;
      }
    },
    getConfig: function (module) {
      var defer = $q.defer();
      remoteStorage.on('ready', function() {
        remoteStorage[module].getConfig().then(function (config) {
          $rootScope.$apply(function () {
            if (!config) {
              defer.reject();
            } else {
              defer.resolve(config);
            }
          });
        }, defer.reject);
      });
      return defer.promise;
    },
    writeConfig: function (module, config) {
      var defer = $q.defer();

      remoteStorage[module].writeConfig(config).then(function() {
        $rootScope.$apply(function () {
          defer.resolve();
        });
      }, function () {
        $rootScope.$apply(function () {
          defer.reject();
        });
      });
      return defer.promise;
    },
    setAccount: function (module, type, name, config) {
      var defer = $q.defer();
      console.log('setaccount! '+module+':'+type+':config:', config);
      remoteStorage[module].setAccount('xmpp', type, config).then(function() {
        $rootScope.$apply(function () {
          defer.resolve();
        });
      }, function () {
        $rootScope.$apply(function () {
          defer.reject();
        });
      });
      return defer.promise;
    },
    call: function (module, func, params) {
      var defer = $q.defer();
      console.log('RS.call('+module+', '+func+', params):',params);

      try {
        var promise = remoteStorage[module][func].apply(null, params);
        promise.then(function (res) {
          $rootScope.$apply(function () {
            defer.resolve(res);
          });
        }, function (err) {
          $rootScope.$apply(function () {
            defer.reject(err);
          });
        });
      } catch (e) {
        defer.reject(e);
      }

      return defer.promise;
    }
  };
}]);


ngRemoteStorageClient.controller('initRemoteStorageCtrl', ['$scope', '$route', '$routeParams', '$location', 'RS',
function ($scope, $route, $routeParams, $location, RS) {

  remoteStorage.util.silenceAllLoggers();
    remoteStorage.defineModule('sockethub', function(privateClient, publicClient) {
      privateClient.release('');
      publicClient.release('');
      privateClient.declareType('config', {
        "description" : "sockethub config file",
        "type" : "object",
        "properties": {
          "host": {
            "type": "string",
            "description": "the hostname to connect to",
            "format": "uri",
            "required": true
          },
          "port": {
            "type": "number",
            "description": "the port number to connect to",
            "required": true
          },
          "secret": {
            "type": "string",
            "description": "the secret to identify yourself with the sockethub server",
            "required": true
          }
        }
      });

      return {
        exports: {
          getConfig: function() {
            return privateClient.getObject('config.json');
          },
          writeConfig: function(data) {
            return privateClient.storeObject('config', 'config.json', data);
          }
        }
      };
    });

    remoteStorage.claimAccess({sockethub:'rw',messages:'rw'}).then(function () {
      remoteStorage.displayWidget('remotestorage-connect', {
        redirectUri: window.location.protocol + '//' + window.location.host + '/rscallback.html'
      });
    });

}]);
