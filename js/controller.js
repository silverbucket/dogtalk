/**
 * app
 * */
var appCtrl = dogtalk.controller('appCtrl', ['$rootScope',
                   function ($rootScope) {
  $rootScope.$on("$routeChangeError", function (event, current, previous, rejection) {
    console.log('failed to change routes: ' + rejection);
    //console.log('event: ', event);
    //console.log('current route: ', current);
    //console.log('previous route: ', previous);
  });
}] );

appCtrl.loadData = function ($q, $timeout) {
  var defer = $q.defer();
  $timeout(function () {
    console.log('remoteStorage.getBearerToken(): ' + remoteStorage.getBearerToken());
    if (remoteStorage.getBearerToken() === null) {
      defer.reject("remoteStorage not connected");
    } else {
      remoteStorage.sockethub.getConfig().then(function (config) {
        return sockethubConnect(config);
      }).then(function (data) {
        defer.resolve(data);
      }, function (error) {
        defer.reject(error);
      });
    }
  }, 1000);
  return defer.promise;
};


/**
 * nav
 * */
var navCtrl = dogtalk.controller("navCtrl",  ['$scope', '$route', '$routeParams', '$location',
                   function ($scope, $route, $routeParams, $location) {
  $scope.navClass = function (page) {
    var currentRoute = $location.path().substring(1) || 'home';
    return page === currentRoute ? 'active' : '';
  };
}] );


/**
 * page controllers
 * */

// home
var homeCtrl = dogtalk.controller("homeCtrl",  ['$scope', '$route', '$routeParams', '$location',
                   function ($scope, $route, $routeParams, $location) {
  $scope.model = {
    message: "this is the main page fool!"
  };
}] );

homeCtrl.loadData = function ($q, $timeout) {
  var defer = $q.defer();
  $timeout(function () {
    if (remoteStorage.getBearerToken() === null) {
      defer.reject("remoteStorage not connected");
    } else {
      defer.resolve();
    }
  }, 0);
  return defer.promise;
};


// settings
var settingsCtrl = dogtalk.controller("settingsCtrl",  ['$scope', '$route', '$routeParams', '$location',
                   function ($scope, $route, $routeParams, $location) {
  $scope.model = {
    message: "this is the settings page fool!"
  };
}] );


// log
var logCtrl = dogtalk.controller("logCtrl",  ['$scope', '$route', '$routeParams', '$location',
                   function ($scope, $route, $routeParams, $location) {
  $scope.model = {
    message: "this is the log page fool!"
  };
}] );
