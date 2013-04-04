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
    template: '<div class="alert alert-error" ng-show="isError">'+
              '<strong>{{displayError.title}}</strong>' +
              '<p>{{displayError.message}}</p>' +
              '</div>',
    link: function (scope) {

      var errors = {
        'remotestorage-connect': {
          title : 'Connect to remoteStorage',
          message: 'First things first. You must connect to your remoteStorage'
        },
        'sockethub-config': {
          title: 'Sockethub configuration needed',
          message: 'You must fill in your Sockethub connection details'
        },
        'sockethub-connect': {
          title: 'Sockethub connection error',
          message: 'Unable to connect to Sockethub please check your configuration and try again'
        },
        'sockethub-register': {
          title: 'Sockethub registration problem',
          message: 'We were unable to register with your Sockethub instance'
        },
        'unknown': {
          title: 'An unknown error has occurred',
          message: ''
        }
      };

      $rootScope.$on("$routeChangeError", function (event, current, previous, rejection) {
        //console.log('directive routeChangeError: ', event, current, previous, rejection);
        console.log('directive routeChangeError: ', rejection);

        scope.isError = false;
        scope.displayError = {title: '', message: ''};

        if ((typeof rejection !== 'object') ||
            (typeof rejection.error === 'undefined') ||
            (typeof errors[rejection.error] == 'undefined')) {
          scope.displayError = errors['unknown'];
          scope.displayError.message = String(rejection.message || rejection);
        } else {
          scope.displayError = errors[rejection.error];
          if (typeof rejection.message === 'string') {
            scope.displayError.message = rejection.message;
          }
        }
        scope.isError = true;

        if (rejection.error === 'sockethub-config') {
          console.log('no config found, launch modal');
          $rootScope.$broadcast('showModalSockethubSettings', {locked: true});
        }
      });

      $rootScope.$on("$routeChangeSuccess", function (event, current, previous) {
        if (sockethub.isConnected()) {
          scope.isError = false;
        } else {
          scope.isError = true;
          scope.displayError = errors['sockethub-connect'];
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
          defer.reject({error: 'remotestorage-connect'});
        } else {
          if (sh.isConnected()) {
            console.log('already connected to sockethub');
            defer.resolve();
          } else {
            if (sh.config.exists()) {
              console.log('already have sockethub config, no need to fetch');
              sh.connect().then(defer.resolve, defer.reject);
            } else {
              remoteStorage.onWidget('ready', function() {
                $timeout(function() {
                  remoteStorage.sockethub.getConfig().then(function (config) {
                    console.log('got config: ', config);
                    if (!config) {
                      defer.reject({error: 'sockethub-config'});
                    } else {
                      console.log('setting config and attempting connection');
                      sh.config.host = config.host;
                      sh.config.port = config.port;
                      sh.config.secret = config.secret;
                      sh.connect().then(defer.resolve, defer.reject);
                    }
                  }, function (error) {
                    defer.reject({error: 'sockethub-config'});
                  });
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
    var defer = $q.defer();
    sockethub.connect({
      host: 'ws://' + config.host + ':' + config.port + '/sockethub',
      confirmationTimeout: 6000,   // timeout in miliseconds to wait for confirm
      enablePings: true            // good for keepalive
    }).then(function () {  // connection to sockethub sucessful
      console.log('connected to sockethub');
      sockethub.register({
        remoteStorage: {
          bearerToken: remoteStorage.getBearerToken(),
          scope: remoteStorage.claimedModules,
          storageInfo: remoteStorage.getStorageInfo()
        },
        secret: config.secret
      }).then(function () {
        console.log('registered!');
        $rootScope.$apply(function () {
          defer.resolve();
        });
      }, function (err) {
        $rootScope.$apply(function () {
          defer.reject({error: 'sockethub-register', message: err});
        });
      });
    }, function (err) { // sockethub connection failed
      console.log('received error on connect: ', err);
      //defer.reject({error: 'sockethub-connect', message: err});
      $rootScope.$apply(function () {
        if (err) {
          defer.reject({error:'sockethub-connect', message: err});
        } else {
          defer.reject({error:'sockethub-connect'});
        }
      });
    });

    return defer.promise;
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