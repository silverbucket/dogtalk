var dogtalk = angular.module('dogtalk', []);

dogtalk.config(function ($routeProvider) {
  $routeProvider.when('/home', {
    templateUrl: "home.html",
    controller: "homeCtrl",
    resolve: {
      loadData: homeCtrl.loadData
    }
  }).when('/settings', {
    templateUrl: "settings.html",
    controller: "settingsCtrl",
    resolve: {
      loadData: settingsCtrl.loadData
    }
  }).when('/log', {
    templateUrl: "log.html",
    controller: "logCtrl",
    resolve: {
      loadData: logCtrl.loadData
    }
  }).when('/', {
    templateUrl: "home.html",
    controller: "homeCtrl",
    resolve: {
      loadData: appCtrl.loadData
    }
  }).otherwise({
    redirectTo: "/"
  });
});