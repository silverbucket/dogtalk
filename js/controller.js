/**
 * app
 * */
var appCtrl = dogtalk.controller('appCtrl', function ($scope, $rootScope, $route, $location) {

  $rootScope.$on("$routeChangeStart", function (event, current, previous, rejection) {
    console.log('routeChangeStart: ', $scope, $rootScope, $route, $location);
  });

  $rootScope.$on("$routeChangeSuccess", function (event, current, previous, rejection) {
    console.log('routeChangeSuccess: ', $scope, $rootScope, $route, $location);
  });

  $rootScope.$on("$routeChangeError", function (event, current, previous, rejection) {
    console.log('routeChangeError: ', rejection);
  });

});


appCtrl.initializeApp = function ($q, $timeout) {
  return $timeout(function() {
    if (remoteStorage.getBearerToken() === null) {
      return $q.reject({error: 1, message: "remoteStorage not connected"});
    } else {
      return remoteStorage.sockethub.getConfig().then(function (config) {
        console.log('initializeApp: got config: ', config);
        if (!config) {
          return $q.reject("config not set");
        } else {
          return sockethubConnect(config);
        }
      }, function (error) {
        return $q.reject("couldn't get config: " + error);
      });
    }
  }, 0);
};

/*appCtrl.initializeApp = function ($q, $timeout) {
  var defer = $q.defer();
  $timeout(function () {
    console.log('appCtrl.initializeApp');
    if (remoteStorage.getBearerToken() === null) {
      defer.reject({error: 1, message: "remoteStorage not connected"});
    } else {
      remoteStorage.sockethub.getConfig().then(function (config) {
        console.log('appCtrl: sockethub config: ', config);
        return sockethubConnect(config);
      }).then(function () {
          defer.resolve();
      }, function (error) {
        console.log('defer reject');
        defer.reject("defer reject");//{error: 2, message: error});
        console.log("after defer reject");
      });
    }
  }, 5000);
  return defer.promise;
};*/


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
  console.log('homeCtrl: loadData');
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
