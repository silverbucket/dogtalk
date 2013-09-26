angular.module('dogtalk', ['ngSockethubClient', 'ngSockethubRemoteStorage', 'ngRemoteStorage', 'ngXMPPClient', 'ngMessages']).


/**
 * routes
 */
config(['$routeProvider',
function ($routeProvider) {
  $routeProvider.
    when('/settings', {
      templateUrl: "settings.html",
      controller: "settingsCtrl"
    }).
    when('/', {
      templateUrl: "talk.html",
      controller: "talkCtrl"
    }).
    when('/talk/:address', {
      templateUrl: "talk.html",
      controller: "talkCtrl"
    }).
    otherwise({
      redirectTo: "/"
    });
}]).



/**
 * remotestorage config
 */
run(['RemoteStorageConfig',
function (RScfg) {
  RScfg.modules = [
    ['sockethub', 'rw', {'cache': false}],
    ['messages', 'rw', {'cache': false}],
    ['contacts', 'rw', {'cache': false}]
  ];
}]).


/**
 * check remoteStorage connections
 */
run(['$rootScope', 'RS', '$timeout',
function ($rootScope, RS, $timeout) {
  if (!RS.isConnected()) {
    $timeout(function () {
      if (!RS.isConnected()) {
        $rootScope.$broadcast('message', {message: 'remotestorage-connect', timeout: false});
      }
    }, 1000);
  }
}]).



/**
 * sockethub config & connect
 */
run(['SockethubBootstrap',
function (SockethubBootstrap) {
  SockethubBootstrap.run({
    // default connection settings, if none found in remoteStorage
    host: 'silverbucket.net',
    port: '443',
    path: '/sockethub',
    tls: true,
    secret: '1234567890'
  });
}]).


/**
 * get xmpp config
 */
run(['SH', '$rootScope', 'RS', 'XMPP', 'XMPPSettings',
function (SH, $rootScope, RS, XMPP, settings) {
  RS.call('messages', 'getAccount', ['xmpp', 'default']).then(function (c) {
    console.log('GOT XMPP CONFIG: ', c);
    var cfg = {};

    if (c === undefined) {
      $rootScope.$broadcast('showModalSettingsXmpp', {
        message: 'No existing XMPP configuration information found',
        locked: false
      });
      $rootScope.$broadcast('message', {
        message: 'xmpp-connection',
        type: 'error',
        timeout: false
        //important: true
      });
    } else {
      XMPP.connect(c).then(function () {
        console.log('xmpp connected');
      }, function (err) {
        $rootScope.$broadcast('showModalSettingsXmpp', { message: 'Error connecting via XMPP '+err, locked: false });
        console.log('xmpp ERROR', err);
        $rootScope.$broadcast('message', {
          message: err,
          type: 'error',
          timeout: true
        });
      });
    }

  }, function (err) {
    console.log("RS.call failed: ",err);
  });
}]).



/**
 * emitters
 */





///////////////////////////////////////////////////////////////////////////
//
// CONTROLLERS
//
///////////////////////////////////////////////////////////////////////////


/**
 * controller: appCtrl
 */
controller('appCtrl',
['$scope', '$rootScope', '$route', '$location',
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

}]).


/**
 * controller: navCtrl
 */
controller("navCtrl",
['$scope', '$route', '$routeParams', '$location',
function ($scope, $route, $routeParams, $location) {
  $scope.navClass = function (page) {
    var currentRoute = $location.path().substring(1) || 'home';
    return page === currentRoute ? 'active' : '';
  };
}]).



/**
 * controller: settingsCtrl
 */
controller("settingsCtrl",
['$scope', '$route', '$routeParams', '$rootScope', 'SockethubSettings', 'XMPP', 'RS',
function ($scope, $route, $routeParams, $rootScope, SockethubSettings, XMPP, RS) {

  $scope.sockethubSettings = function () {
    $rootScope.$broadcast('showModalSockethubSettings', { locked: false });
  };

  $scope.xmppSettings = function () {
    $rootScope.$broadcast('showModalSettingsXmpp', { locked: false });
  };

  /*
   FIXME: ...
   $scope.$watch('SockethubSettings.connected', function (newVal, oldVal) {
    if (SockethubSettings.connected) {
      SockethubSettings.conn.port = Number(SockethubSettings.conn.port);
      RS.call('sockethub', 'writeConfig', [SockethubSettings.conn]).then(function () {
        console.log("Sockethub config saved to remoteStorage");
      }, function (err) {
        console.log('Failed saving Sockethub config to remoteStorage: ', err);
      });
    }
  });
  */

}]).



/**
 * controller: talkCtrl
 */
controller("talkCtrl",
['$scope', '$route', '$routeParams', '$location', 'XMPP', '$rootScope', 'XMPPSettings',
function ($scope, $route, $routeParams, $location, XMPP, $rootScope, settings) {
  console.log('--- talkCtrl run');

  $scope.model = {
    presence: XMPP.presence.data,
    contacts: XMPP.contacts.data,
    settings: settings,
    requests: XMPP.requests.data
  };

  XMPP.initListener();  // initialize listener for incoming xmpp platform messages

  $scope.model.currentAddress = ($routeParams.address) ? $routeParams.address : 'none';
  $scope.model.currentName = ($scope.model.contacts[$routeParams.address]) ? $scope.model.contacts[$routeParams.address].name : '';
  $scope.model.currentConversation = ($scope.model.contacts[$routeParams.address]) ? $scope.model.contacts[$routeParams.address].conversation : [];

  $scope.$watch('model.contacts', function (newValue, oldValue) {
    console.log('SCOPE WATCH CONTACTS : ', newValue);
  });

  $scope.conversationSwitch = function (address) {
    console.log('---- talkCtrl.conversationSwitch('+address+')');
    if (address !== $routeParams.address) { return ''; }

    if ($scope.model.contacts[address]) {
      $scope.model.currentAddress = address;
      $scope.model.currentName = $scope.model.contacts[address].name;
      $scope.model.currentConversation = $scope.model.contacts[address].conversation;
      console.log('currentConversation: ',$scope.model.currentConversation);
    } else {
      console.log('talkCtrl.conversationSwitch() - not in history');
    }

    return 'active';
  };

  $scope.sendMsg = function (text) {
    $scope.model.saving = true;
    XMPP.sendMsg(settings.conn.actor, $scope.model.currentAddress, text).then(function () {
      $scope.model.sendText = '';
      $scope.model.saving = false;
    }, function (err) {
      console.log('sendMsg error: '+err);
      $scope.model.saving = false;
    });

  };

  $scope.isFromMe = function (address) {
    if (settings.conn.username === address) {
      return true;
    } else {
      return false;
    }
  };

  $scope.acceptBuddyRequest = function (address) {
    $scope.model.saving = true;
    if ($scope.model.requests[address]) {
      console.log('settings;',settings);
      XMPP.requests.accept(settings.conn.actor, address).then(function () {
        $scope.model.saving = false;
        delete $scope.model.requests[address];
        return true;
      }, function (err) {
        $scope.model.saving = false;
        return false;
      });
    } else {
      $scope.model.saving = false;
      return false;
    }
  };

  /*
  $scope.$watch('model.currentAddress', function (address) {
    if (!address) { return false; }

    if ($scope.model.contacts[address]) {
      $scope.model.currentAddress = address;
      $scope.model.currentName = $scope.model.contacts[address].name;
      $scope.model.currentConversation = $scope.model.contacts[address].conversation;
      console.log('WATCH updated: ',$scope.model.current);
    } else {
      console.log('WATCH - not in history');
    }

  });
  */

}]).



/**
 * controller: log
 */
controller("logCtrl",
['$scope', '$route', '$routeParams', '$location',
function ($scope, $route, $routeParams, $location) {
  $scope.model = {
    message: "this is the log page fool!"
  };
}]);



