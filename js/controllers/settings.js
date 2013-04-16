/***********
 * settings
 ***********/
var settingsCtrl = dogtalk.controller("settingsCtrl",
['$scope', '$route', '$routeParams', '$location', '$rootScope', 'SH',
function ($scope, $route, $routeParams, $location, $rootScope, SH) {
  $scope.model = {
    message: "this is the settings page fool!"
  };
  $scope.sockethub = {};
  $scope.sockethub.config = SH.config;

  $scope.sockethub.show = function () {
      //var cfg = SH.config.get();
      //$scope.sockethub.config.host = cfg.host;
      //$scope.sockethub.config.port = cfg.port;
      //$scope.sockethub.config.secret = cfg.secret;
      console.log('showSockethub: ', $scope.sockethub.config.host);
      console.log('showSockethub: ', $scope.sockethub.config);
      $rootScope.$broadcast('showModalSettingsSockethub', {locked: false});
    };
  $scope.sockethub.save = function (config) {
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
        $rootScope.$broadcast('closeModalSettingsSockethub');
        $location.path('/');
      }, function () {
        console.log('error saving config to remoteStorage!');
      });
    };

}] );

settingsCtrl.loadSettings = function (verifyState, $q) {
    console.log('settingsCtrl conversations');
    var defer = $q.defer();
    verifyState().then(function () {
      defer.resolve();
    }, function () {
      defer.resolve();
    });
    return defer.promise;
};