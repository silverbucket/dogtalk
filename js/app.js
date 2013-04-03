var dogtalk = angular.module('dogtalk', []);

dogtalk.config(function ($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: "home.html",
    controller: "homeCtrl",
    resolve: {
      init: homeCtrl.homeInit
    }
  }).when('/settings', {
    templateUrl: "settings.html",
    controller: "settingsCtrl",
    resolve: {
      loadData: settingsCtrl.settingsInit
    }
  }).when('/log', {
    templateUrl: "log.html",
    controller: "logCtrl",
    resolve: {
      init: logCtrl.logInit
    }
  }).otherwise({
    redirectTo: "/"
  });
});


dogtalk.directive("error", function ($rootScope) {
  return {
    restrict: "E",
    template: '<div class="alert alert-error" ng-show="isRemoteStorageError">'+
              '<strong>First things first</strong>' +
              '<p>You need to connect to your remoteStorage</p>' +
              '</div>' +
              '<div class="alert alert-error" ng-show="isSockethubConfigError">'+
              '<strong>Unable to connect to Sockethub</strong>' +
              '<p>You must fill in your Sockethub connection details</p>' +
              '</div>' +
              '<div class="alert alert-error" ng-show="isSockethubConnectionError">'+
              '<strong>Sockethub connection</strong>' +
              '<p>Unable to connect to Sockethub, please <a href="#/settings">check your configuration</a> and try again</p>' +
              '</div>' +
              '<div class="alert alert-error" ng-show="isUnknownError">'+
              '<strong>Unknown error</strong>' +
              '<p>An unknown routing error has occurred</p>' +
              '</div>',
    link: function (scope) {
      $rootScope.$on("$routeChangeError", function (event, current, previous, rejection) {
        //console.log('directive routeChangeError: ', event, current, previous, rejection);
        if (rejection.error === 1) {
          scope.isRemoteStorageError = true;
        } else if (rejection.error === 2) {
          scope.isSockethubConfigError = true;
          console.log('no config found, launch modal');
          $rootScope.$broadcast('showModalSockethubSettings', {locked: true});
        } else if (rejection.error === 3) {
          scope.isSockethubConnectionError = true;
        } else {
          scope.isUnknownError = true;
        }
      });

      $rootScope.$on("$routeChangeSuccess", function (event, current, previous) {
        if (sockethub.isConnected()) {
          scope.isSockethubConnectionError = false;
        } else {
          scope.isSockethubConnectionError = true;
        }

      });
    }
  };
});


/**
 * Function: initializeApp
 *
 * when app is loaded, we need to verify remoteStorage and Sockethub are connected
 * and provide the proper control-flow to the user if not.
 *
 */
// initialization factory
dogtalk.factory('init', ['$rootScope', '$q', '$timeout', 'sh',
function ($rootScope, $q, $timeout, sh) {
  return {
    setState: function () {
      var defer = $q.defer();
      $timeout(function() {
        if (remoteStorage.getBearerToken() === null) {
          defer.reject({error: 1, message: "remoteStorage not connected"});
        } else {
          if (sh.isConnected()) {
            console.log('already connected to sockethub');
            defer.resolve();
          } else {
            if (sh.config.exists()) {
              console.log('already have sockethub config, no need to fetch');
              sockethub.connect(defer);
            } else {
              remoteStorage.sockethub.getConfig().then(function (config) {
                console.log('initializeApp: got config: ', config);
                if (!config) {
                  defer.reject({error: 2, message: "no sockethub config found"});
                } else {
                  console.log('setting config and attempting connection');
                  sh.config.host = config.host;
                  sh.config.port = config.port;
                  sh.config.secret = config.secret;
                  return sh.connect();
                }
              }, function (error) {
                defer.reject({error: 2, message: "couldn't get sockethub config: " + error});
              });
            }
          }
        }
      }, 0);
      return defer.promise;
    }
  };
}] );

// sockethub factory
dogtalk.factory('sh', ['$rootScope', '$q',
function ($rootScope, $q) {
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

  function connect() {
    return sockethub.connect({
      host: 'ws://' + config.host + ':' + config.port + '/sockethub',
      confirmationTimeout: 6000,   // timeout in miliseconds to wait for confirm
      enablePings: true            // good for keepalive
    }).then(function () {  // connection to sockethub sucessful
      console.log('connected to sockethub');
      return sockethub.register({
        remoteStorage: {
          bearerToken: remoteStorage.getBearerToken(),
          scope: remoteStorage.claimedModules,
          storageInfo: remoteStorage.getStorageInfo()
        },
        secret: config.secret
      });
    }, function (err) {
      //console.log('received error on connect: '+err+' : ', o);
      console.error('received error on connect: '+err, (err && err.stack) || '');
    }).then(function() {
      console.log('registered!');
    }, function(err) {
      console.log('error registering: ', err);
      throw err;
    });
  }

  return {
    config: config,
    connect: connect,
    isConnected: sockethub.isConnected
  };
}] );



dogtalk.run(function($rootScope, sh) {
    /*
        Receive emitted messages from elsewhere.
        http://jsfiddle.net/VxafF/
    */
    $rootScope.$on('showModalSockethubSettings', function(event, args) {
      backdrop_setting = true;
      if ((typeof args === 'object') && (typeof args.locked !== 'undefined')) {
        if (args.locked) {
          backdrop_setting = "static";
        }
      }
      console.log('backdrop: '+backdrop_setting);
      $("#modalSettingsSockethub").modal({
        show: true,
        keyboard: true,
        backdrop: backdrop_setting
      });
    });


    $rootScope.$on('closeModalSockethubSettings', function(event, args) {
      //console.log('closeModalSockethubSettings');
      $("#modalSettingsSockethub").modal('hide');
    });
});