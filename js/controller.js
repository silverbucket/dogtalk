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

homeCtrl.homeInit = function ($q, init) {
  var defer = $q.defer();
  console.log('homeCtrl.init()');
  init.setState().then(defer.resolve, defer.reject);
  return defer.promise;
};




/***********
 * settings
 ***********/
var settingsCtrl = dogtalk.controller("settingsCtrl",
['$scope', '$route', '$routeParams', '$location', '$rootScope', 'sh',
function ($scope, $route, $routeParams, $location, $rootScope, sh) {
  $scope.model = {
    message: "this is the settings page fool!"
  };
  $scope.sockethub = {
    config: sh.config,
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
        $scope.sockethub.config.host = config.host;
        $scope.sockethub.config.port = config.port;
        $scope.sockethub.config.secret = config.secret;
        console.log("closing modalwindow");
        $rootScope.$broadcast('closeModalSockethubSettings');
        $location.path('/');
      }, function () {
        console.log('error saving config to remoteStorage!');
      });
    }
  };

}] );

settingsCtrl.settingsInit = function ($q, init) {
  var defer = $q.defer();
  console.log('settingsCtrl.init()');
  init.setState().then(function() {
    console.log('setState GOOD');
    defer.resolve();
  }, function (error) {
    console.log('setState BAD', error);
    defer.resolve(); // no matter what, we pass, because we want to be able to use the settings menu
  });
  return defer.promise;
};


/******
 * log
 ******/
var logCtrl = dogtalk.controller("logCtrl",  ['$scope', '$route', '$routeParams', '$location',
function ($scope, $route, $routeParams, $location) {
  $scope.model = {
    message: "this is the log page fool!"
  };
}] );

logCtrl.logInit = function ($q, init) {
  console.log('logCtrl.init()');
  var defer = $q.defer;
  defer.resolve();
  return defer.promise;
};

