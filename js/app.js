var dogtalk = angular.module('dogtalk', ['ngSockethubClient', 'ngRemoteStorageClient', 'ngXMPPClient']);



dogtalk.factory('verifyState', ['SH', 'RS', 'XMPP', '$q', function (SH, RS, XMPP, $q) {

  // verify XMPP connection
  /*function verifyXMPPConnection() {
    var defer = $q.defer();
    console.log('dogtalk.verifyState [XMPPConnection]');

    if (!XMPP.isConnected()) {
      XMPP.connect().then(defer.resolve, function (errMsg) {
        defer.reject({error:"xmpp-connect", message: "failed connecting to xmpp: "+errMsg});
      });
    } else {
      defer.resolve();
    }

    return defer.promise;
  }*/


  // XMPP CONNECT
  function verifyXMPPConnect() {
    var defer = $q.defer();
    console.log('dogtalk.verifyState [XMPPConnect]');

    // verify XMPP config exists
    if (!XMPP.presence.get()) {
      XMPP.presence.set('online', '', true).then(function () {
        console.log('completed verifyState sucessfully');
        defer.resolve();
      }, function (errMsg) {
        console.log('failed verifyState: ' + errMsg);
        defer.reject({error: "xmpp-connect", message: errMsg});
      });
    } else {
      defer.resolve();
    }

    return defer.promise;
  }

  function verifyXMPPConfig(cfgOnly) {
    var defer = $q.defer();
    console.log('dogtalk.verifyState [XMPPConfig]');

    // verify XMPP config exists
    if (!XMPP.config.exists()) {
      XMPP.config.get(cfgOnly).then(function (config) {
        if ((!config) || (typeof config.username === 'undefined')) {
          defer.reject({error: "xmpp-config", message: "xmpp not configured"});
        } else {
          if (cfgOnly) {
            defer.resolve();
          } else {
            verifyXMPPConnect().then(defer.resolve, defer.reject);
          }
        }
      }, function () {
        defer.reject({error: "xmpp-config", message: "xmpp not configured"});
      });
    } else {
      verifyXMPPConnect().then(defer.resolve, defer.reject);
    }

    return defer.promise;
  }

  function verifySHRegistration() {
    var defer = $q.defer();
    console.log('dogtalk.verifyState [SHRegistration]');

    if (!SH.isRegistered()) {
      SH.register().then(function () {
        verifyXMPPConfig().then(defer.resolve, defer.reject);
      }, function (errMsg) {
        defer.reject({error:"sockethub-register", message: "failed registering with sockethub: "+errMsg});
      });
    } else {
      verifyXMPPConfig().then(defer.resolve, defer.reject);
    }

    return defer.promise;
  }

  function verifySHConnection() {
    var defer = $q.defer();
    console.log('dogtalk.verifyState [SHConnection]');

    if (!SH.isConnected()) {
      SH.connect().then(function () {
        verifySHRegistration().then(defer.resolve, defer.reject);
      }, function (errMsg) {
        defer.reject({error:"sockethub-connect", message: "failed connecting to sockethub: "+errMsg});
      });
    } else {
      verifySHRegistration().then(defer.resolve, defer.reject);
    }

    return defer.promise;
  }

  return function (cfgOnly) {
    var defer = $q.defer();
    console.log('dogtalk.verifyState [RSConfig ('+cfgOnly+')]');

    // verify remoteStorage connection
    if (!RS.isConnected()) {
      defer.reject({error: "remotestorage-connect", message: "not connected to remoteStorage"});
    } else if (!SH.config.exists()) {
      SH.config.get().then(function (config) {
        if (cfgOnly) {
          verifyXMPPConfig(true).then(defer.resolve, defer.reject);
        } else {
          verifySHConnection().then(defer.resolve, defer.reject);
        }
      }, function () {
        defer.reject({error: "sockethub-config", message: "sockethub not configured"});
      });
    } else {
      if (cfgOnly) {
        verifyXMPPConfig(true).then(defer.resolve, defer.reject);
      } else {
        verifySHConnection().then(defer.resolve, defer.reject);
      }
    }

    return defer.promise;
  };
}]);



dogtalk.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.
    when('/settings', {
      templateUrl: "settings.html",
      controller: "settingsCtrl",
      resolve: {
        loadSettings: settingsCtrl.loadSettings
      }
    }).
    when('/', {
      templateUrl: "talk.html",
      controller: "talkCtrl",
      resolve: {
        loadConversations: talkCtrl.loadConversations
      }
    }).
    when('/talk/:address', {
      templateUrl: "talk.html",
      controller: "talkCtrl",
      resolve: {
        loadConversations: talkCtrl.loadConversations
      }
    }).
    otherwise({
      redirectTo: "/"
    });
}]);



/******
 * app
 ******/
var appCtrl = dogtalk.controller('appCtrl', ['$scope', '$rootScope', '$route', '$location',
function ($scope, $rootScope, $route, $location) {

  $rootScope.$on("$routeChangeStart", function (event, current, previous, rejection) {
    console.log('routeChangeStart: ', $scope, $rootScope, $route, $location);
  });

  $rootScope.$on("$routeChangeSuccess", function (event, current, previous, rejection) {
    //console.log('routeChangeSuccess: ', $scope, $rootScope, $route, $location);
    console.log('routeChangeSuccess');
  });

  $rootScope.$on("$routeChangeError", function (event, current, previous, rejection) {
    console.log('routeChangeError: ', rejection);
  });

}]);



/******
 * nav
 ******/
var navCtrl = dogtalk.controller("navCtrl",  ['$scope', '$route', '$routeParams', '$location',
function ($scope, $route, $routeParams, $location) {
  $scope.navClass = function (page) {
    var currentRoute = $location.path().substring(1) || 'home';
    return page === currentRoute ? 'active' : '';
  };
}]);