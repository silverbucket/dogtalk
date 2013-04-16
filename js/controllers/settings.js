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
    saving: false,
    show: function () {
      //var cfg = SH.config.get();
      //$scope.sockethub.config.host = cfg.host;
      //$scope.sockethub.config.port = cfg.port;
      //$scope.sockethub.config.secret = cfg.secret;
      console.log('showSockethub: ', $scope.sockethub.config.host);
      console.log('showSockethub: ', $scope.sockethub.config);
      $rootScope.$broadcast('showModalSettingsSockethub', {locked: false});
    },
    save: function (config) {
      console.log('saveSockethub: ', config);
      $scope.sockethub.saving = true;
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
        $scope.sockethub.saving = false;
        $rootScope.$broadcast('closeModalSettingsSockethub');
        $location.path('/');
      }, function () {
        console.log('error saving config to remoteStorage!');
      });
    }
  };

  $scope.xmpp = {
    // Reference to the account managed by the "xmpp" service
    account: function() {}, //xmpp.account,
    // Boolean flag, used to disable the "Save" button, while waiting for
    // xmpp.saveAccount to finish.
    saving: false,
    // Method: show
    // Displays the XMPP settings window
    show: function() {
      $rootScope.$broadcast('showModalSettingsXmpp', { locked: false });
    },
    // Method: save
    // Saves the current account data. Bound to the "Save" button
    save: function() {
      $scope.xmpp.saving = true;
      //xmpp.saveAccount($scope.xmpp.account).then(function() {
      //  $scope.xmpp.saving = false;
      //  $rootScope.$broadcast('closeModalSettingsXmpp');
      //});
    }
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