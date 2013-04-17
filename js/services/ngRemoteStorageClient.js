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

      remoteStorage.sockethub.writeConfig({
        host: $scope.sockethub.config.host,
        port: parseInt($scope.sockethub.config.port, null),
        secret: $scope.sockethub.config.secret
      }).then(function () {
        $rootScope.$apply(function () {
          defer.resolve();
        });
      }, function () {
        $rootScope.$apply(function () {
          defer.reject();
        });
      });
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

    remoteStorage.claimAccess('sockethub', 'rw').then(function() {
      remoteStorage.displayWidget('remotestorage-connect', {
        redirectUri: window.location.protocol + '//' + window.location.host + '/rscallback.html'
      });
    });

}]);
