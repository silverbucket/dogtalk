/***********
 * settings
 ***********/
var settingsCtrl = dogtalk.controller("settingsCtrl",
['$scope', '$route', '$routeParams', '$location', '$rootScope', 'SH', 'XMPP',
function ($scope, $route, $routeParams, $location, $rootScope, SH, XMPP) {

  $scope.sockethub = {
    config: SH.config.data,
    saving: false,
    show: function () {
      //console.log('showSockethub: ', $scope.sockethub.config.host);
      //console.log('showSockethub: ', $scope.sockethub.config);
      $rootScope.$broadcast('showModalSettingsSockethub', {locked: false});
    },
    save: function (config) {
      //console.log('saveSockethub: ', config);
      $scope.sockethub.saving = true;
      // validation
      SH.config.set($scope.sockethub.config.host,
                    parseInt($scope.sockethub.config.port, null),
                    $scope.sockethub.config.secret).then(function () {
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
    account: XMPP.config.data, //xmpp.account,
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
      XMPP.config.set($scope.xmpp.account).then(function (cfg) {
       $scope.xmpp.account.username = cfg.username;
       $scope.xmpp.account.password = cfg.password;
       $scope.xmpp.account.server = cfg.server;
       $scope.xmpp.account.resource = cfg.resource;
       $scope.xmpp.account.port = cfg.port;
       $scope.xmpp.saving = false;
       $rootScope.$broadcast('closeModalSettingsXmpp');
      });
    }
  };

}] );

settingsCtrl.loadSettings = function (verifyState, $q) {
    console.log('settingsCtrl loadSettings');
    var defer = $q.defer();
    verifyState(true).then(function () {
      defer.resolve();
    }, function () {
      defer.resolve();
    });
    return defer.promise;
};