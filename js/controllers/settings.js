/***********
 * settings
 ***********/
var settingsCtrl = dogtalk.controller("settingsCtrl",
['$scope', '$route', '$routeParams', '$location', '$rootScope', 'SH', 'RS',
function ($scope, $route, $routeParams, $location, $rootScope, SH, RS) {
  $scope.model = {
    message: "this is the settings page fool!"
  };
  $scope.sockethub = {
    config: SH.config,
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

settingsCtrl.loadSettings = function (RS, SH, $q) {
    console.log('settingsCtrl conversations');
    var defer = $q.defer();
    // verify remoteStorage connection
    if (!RS.isConnected()) {
      defer.reject({error: "remotestorage-connect", message: "not connected to remoteStorage"});
    } else if (SH.isConnected) {
      defer.reject({error: "sockethub-connect", message: "not connected to sockethub"});
    } else {
      defer.resolve();
    }
    return defer.promise;
};