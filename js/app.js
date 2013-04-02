var dogtalk = angular.module('dogtalk', []);

dogtalk.config(function ($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: "home.html",
    controller: "homeCtrl",
    resolve: {
      loadData: appCtrl.initializeApp
      //loadData: homeCtrl.loadData
    }
  }).when('/settings', {
    templateUrl: "settings.html",
    controller: "settingsCtrl"
   //resolve: {
    //  loadData: appCtrl.initializeApp
   // }
  }).when('/log', {
    templateUrl: "log.html",
    controller: "logCtrl",
    resolve: {
      loadData: logCtrl.loadData
    }
  /*}).when('/', {
    templateUrl: "home.html",
    controller: "homeCtrl",
    resolve: {
      loadData: appCtrl.initializeApp
    }*/
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
              '<p>Unable to connect to Sockethub, please check your configuration and try again.</p>' +
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
    }
  };
});



dogtalk.factory('sockethubConfig', function () {
  return {
    host: '',
    port: '',
    secret: ''
  };
});


dogtalk.run(function($rootScope, sockethubConfig) {
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
      console.log('closeModalSockethubSettings');
      $("#modalSettingsSockethub").modal({
        show: false
      });
      console.log('hi');
    });
});