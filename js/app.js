var dogtalk = angular.module('dogtalk', ['ngSockethubClient', 'ngRemoteStorageClient']);



dogtalk.factory('verifyState', ['SH', 'RS', '$q', function (SH, RS, $q) {

  function verifySHRegistration() {
    var defer = $q.defer();
    console.log('dogtalk.verifyState [SHRegistration]');

    if (!SH.isRegistered()) {
      SH.register().then(defer.resolve, function (errMsg) {
        defer.reject({error:"sockethub-register", message: "failed registering with sockethub: "+errMsg});
      });
    } else {
      defer.resolve();
    }

    return defer.promise;
  }

  function verifySHConnection() {
    var defer = $q.defer();
    console.log('dogtalk.verifyState [SHConnection]');

    if (!SH.isConnected()) {
      SH.connect().then(function () {
        verifySHRegistration().then(defer.resolve, defer.reject);
      }, function (errMsg) {
        defer.reject({error:"sockethub-connect", message: "failed connecting to sockethub: "+errMsg});
      });
    } else {
      verifySHRegistration().then(defer.resolve, defer.reject);
    }

    return defer.promise;
  }

  return function () {
    var defer = $q.defer();
    console.log('dogtalk.verifyState [RSConfig]');

    // verify remoteStorage connection
    if (!RS.isConnected()) {
console.log('1');
      defer.reject({error: "remotestorage-connect", message: "not connected to remoteStorage"});
    } else if (!SH.config.exists()) {
console.log('2');
      RS.getConfig().then(function (config) {
console.log('2.1');
        SH.config.set(config.host, config.port, config.secret);
        verifySHConnection().then(defer.resolve, defer.reject);
      }, function () {
console.log('2.2');
        defer.reject({error: "sockethub-config", message: "sockethub not configured"});
      });
    } else {
console.log('3');
      return verifySHConnection();
    }

    return defer.promise;
  };
}]);



dogtalk.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.
    when('/settings', {
      templateUrl: "settings.html",
      controller: "settingsCtrl",
      resolve: {
        loadSettings: settingsCtrl.loadSettings
      }
    }).
    when('/:id', {
      templateUrl: "talk.html",
      controller: "talkCtrl",
      resolve: {
        loadConversations: talkCtrl.loadConversations
      }
    }).
    otherwise({
    redirectTo: "/"
  });
}]);



/******
 * app
 ******/
var appCtrl = dogtalk.controller('appCtrl', ['$scope', '$rootScope', '$route', '$location',
function ($scope, $rootScope, $route, $location) {

  $rootScope.$on("$routeChangeStart", function (event, current, previous, rejection) {
    console.log('routeChangeStart: ', $scope, $rootScope, $route, $location);
  });

  $rootScope.$on("$routeChangeSuccess", function (event, current, previous, rejection) {
    //console.log('routeChangeSuccess: ', $scope, $rootScope, $route, $location);
    console.log('routeChangeSuccess');
  });

  $rootScope.$on("$routeChangeError", function (event, current, previous, rejection) {
    console.log('routeChangeError: ', rejection);
  });

}]);



/******
 * nav
 ******/
var navCtrl = dogtalk.controller("navCtrl",  ['$scope', '$route', '$routeParams', '$location',
function ($scope, $route, $routeParams, $location) {
  $scope.navClass = function (page) {
    var currentRoute = $location.path().substring(1) || 'home';
    return page === currentRoute ? 'active' : '';
  };
}]);