/**
 * app
 * */
var appCtrl = dogtalk.controller('appCtrl', ['$scope', '$rootScope', '$route', '$location',
function ($scope, $rootScope, $route, $location) {

  $rootScope.$on("$routeChangeStart", function (event, current, previous, rejection) {
    //console.log('routeChangeStart: ', $scope, $rootScope, $route, $location);
  });

  $rootScope.$on("$routeChangeSuccess", function (event, current, previous, rejection) {
    //console.log('routeChangeSuccess: ', $scope, $rootScope, $route, $location);
  });

  $rootScope.$on("$routeChangeError", function (event, current, previous, rejection) {
    //console.log('routeChangeError: ', rejection);
  });

}] );



/**
 * Function: initializeApp
 *
 * when app is loaded, we need to verify remoteStorage and Sockethub are connected
 * and provide the proper control-flow to the user if not.
 *
 */
appCtrl.initializeApp = function ($q, $timeout, $rootScope, sockethubConfig) {
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
            console.log('setting config and attempting connection');
            sockethubConfig.host = config.host;
            sockethubConfig.port = config.port;
            sockethubConfig.secret = config.secret;
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
var settingsCtrl = dogtalk.controller("settingsCtrl",
['$scope', '$route', '$routeParams', '$location', '$rootScope', 'sockethubConfig',
function ($scope, $route, $routeParams, $location, $rootScope, sockethubConfig) {
  $scope.model = {
    message: "this is the settings page fool!"
  };
  $scope.sockethub = {
    config: sockethubConfig,
    show: function () {
      console.log('showSockethub: ', $scope.sockethub.config);
      $rootScope.$broadcast('showModalSockethubSettings', {locked: false});
    },
    save: function (config) {
      console.log('saveSockethub: ', config);
      // validation ?
      remoteStorage.sockethub.writeConfig({
        host: $scope.sockethub.config.host,
        port: parseInt($scope.sockethub.config.port, null),
        secret: $scope.sockethub.config.secret
      }).then (function () {
        console.log('config saved to remotestorage');
        $rootScope.$apply(function() {
          $scope.sockethub.config.host = config.host;
          $scope.sockethub.config.port = config.port;
          $scope.sockethub.config.secret = config.secret;
          console.log("closing modalwindow");
          $rootScope.$broadcast('closeModalSockethubSettings');
          $location.path('/');
        });
      }, function () {
        console.log('error saving config to remoteStorage!');
      });
    }
  };

}] );




/******
 * log
 ******/
var logCtrl = dogtalk.controller("logCtrl",  ['$scope', '$route', '$routeParams', '$location',
function ($scope, $route, $routeParams, $location) {
  $scope.model = {
    message: "this is the log page fool!"
  };
}] );

