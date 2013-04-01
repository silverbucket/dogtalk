/**
 * app
 * */
var appCtrl = dogtalk.controller('appCtrl', ['$scope', '$rootScope', '$route', '$location',
function ($scope, $rootScope, $route, $location) {

  $rootScope.$on("$routeChangeStart", function (event, current, previous, rejection) {
    console.log('routeChangeStart: ', $scope, $rootScope, $route, $location);
  });

  $rootScope.$on("$routeChangeSuccess", function (event, current, previous, rejection) {
    console.log('routeChangeSuccess: ', $scope, $rootScope, $route, $location);
  });

  $rootScope.$on("$routeChangeError", function (event, current, previous, rejection) {
    console.log('routeChangeError: ', rejection);
  });

}] );



/**
 * Function: initializeApp
 *
 * when app is loaded, we need to verify remoteStorage and Sockethub are connected
 * and provide the proper control-flow to the user if not.
 *
 */
appCtrl.initializeApp = function ($q, $timeout, $rootScope) {
  var defer = $q.defer();
  $timeout(function() {
    if (remoteStorage.getBearerToken() === null) {
      defer.reject({error: 1, message: "remoteStorage not connected"});
    } else {
      remoteStorage.sockethub.getConfig().then(function (config) {
        console.log('initializeApp: got config: ', config);
        $rootScope.$apply(function () {
          if (!config) {
            defer.reject({error: 2, message: "no sockethub config found"});
          } else {
            sockethubConnect(config).then(function () {
              console.log('connection successful');
              $rootScope.$apply(function () {
                defer.resolve();
              });
            }, function (err) {
              console.log('connection failed');
              $rootScope.$apply(function () {
                defer.reject({error: 3, message: "unable to connect to sockethub"});
              });
            });
          }
        });
      }, function (error) {
        defer.reject({error: 2, message: "couldn't get sockethub config: " + error});
      });
    }
  }, 0);
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



// pages controllers



/*******
 * home
 ******/
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



/***********
 * settings
 ***********/
var settingsCtrl = dogtalk.controller("settingsCtrl",  ['$scope', '$route', '$routeParams', '$location',
function ($scope, $route, $routeParams, $location) {
  $scope.model = {
    message: "this is the settings page fool!"
  };
}] );

settingsCtrl.loadData = function ($q, $timeout) {
  var defer = $q.defer();
  console.log('settingsCtrl: loadData');
  $timeout(function () {
    if (remoteStorage.getBearerToken() === null) {
      defer.reject("remoteStorage not connected");
    } else {
      defer.resolve();
    }
  }, 0);
  return defer.promise;
};

var settingsSockethub =  dogtalk.controller("settingsSockethub", ['$scope', '$rootScope',
function ($scope, $rootScope) {

  $scope.saveSettings = function (config) {
    console.log('sockethub saveSettings ', config);
    // validation ?
    remoteStorage.sockethub.writeConfig({
      host: $scope.settings.host,
      port: parseInt($scope.settings.port, null),
      secret: $scope.settings.secret
    }).then (function () {
      console.log('config saved to remotestorage');
      $rootScope.$apply(function() {
          $("#modalSettingsSockethub").modal({
            show: false
          });
        $location.path('/');
      });
    });
  };

}]);



/******
 * log
 ******/
var logCtrl = dogtalk.controller("logCtrl",  ['$scope', '$route', '$routeParams', '$location',
function ($scope, $route, $routeParams, $location) {
  $scope.model = {
    message: "this is the log page fool!"
  };
}] );

