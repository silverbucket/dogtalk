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
    // default connection settings
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
run(['SH', '$rootScope', 'RS', 'XMPP',
function (SH, $rootScope, RS, XMPP) {
  RS.call('messages', 'getAccount', ['xmpp', 'default']).then(function (c) {
    console.log('GOT XMPP CONFIG: ', c);
    var cfg = {};

    if (c === undefined) {
      $rootScope.$broadcast('showModalSettingsXmpp', { message: 'No existing XMPP configuration information found', locked: false });
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


    /*
    if ((typeof c !== 'object') || (typeof c.host !== 'string')) {
      //cfg = settings.conn;
      cfg.host = 'silverbucket.net';
      cfg.port = 443;
      cfg.path = '/sockethub';
      cfg.tls = true;
      cfg.secret = '1234567890';
    } else {
      cfg = c;
    }

    console.log('USING SH CONFIG: ', cfg);
    //$rootScope.$broadcast('message', {type: 'clear'});
    // connect to sockethub and register
    if (settings.save('conn', cfg));
    $rootScope.$broadcast('message', {
          message: 'attempting to connect to sockethub',
          type: 'info',
          timeout: false
    });
    SH.connect({register: true}).then(function () {
      //console.log('connected to sockethub');
      $rootScope.$broadcast('message', {
            message: 'connected to sockethub',
            type: 'success',
            timeout: true
      });
    }, function (err) {
      console.log('error connecting to sockethub: ', err);
      $rootScope.$broadcast('SockethubConnectFailed', {message: err});
    });
    */
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
function ($scope, $route, $routeParams, $location, XMPP, $rootScope, XMPPSettings) {
  console.log('--- talkCtrl run');

  $scope.model = {
    presence: XMPP.presence.data,
    contacts: XMPP.contacts.data,
    config: XMPPSettings.conn,
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
    XMPP.sendMsg($scope.model.config.username, $scope.model.currentAddress, text).then(function () {
      $scope.model.sendText = '';
      $scope.model.saving = false;
    }, function (err) {
      console.log('sendMsg error: '+err);
      $scope.model.saving = false;
    });

  };

  $scope.isFromMe = function (address) {
    if ($scope.model.config.username === address) {
      return true;
    } else {
      return false;
    }
  };

  $scope.acceptBuddyRequest = function (address) {
    $scope.model.saving = true;
    if ($scope.model.requests[address]) {
      XMPP.requests.accept($scope.model.config.username, address).then(function () {
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




///////////////////////////////////////////////////////////////////////////
//
// DIRECTIVES
//
///////////////////////////////////////////////////////////////////////////

/**
 * directive: loading
 */
/*directive("loading",
['$rootScope', 'XMPP', function ($rootScope, XMPP) {
  return {
    restrict: "E",
    template: '<div class="loading" ng-show="isLoading">'+
              '<img src="img/loading_animation.gif" />' +
              '</div>',
    link: function (scope) {

      $rootScope.$on("$routeChangeStart", function () {
        console.log('loading: directive routeChangeStart');
        scope.isLoading = true;
      });

      $rootScope.$on("$routeChangeError", function (event, current, previous, rejection) {
        console.log('loading: directive routeChangeError');
        scope.isLoading = false;
      });

      $rootScope.$on("$routeChangeSuccess", function (event, current, previous) {
        console.log('loading: directive routeChangeSuccess');
        scope.isLoading = false;
      });
    }
  };
}]);*/


