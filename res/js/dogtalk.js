angular.module('dogtalk', ['ngSockethubClient', 'ngRemoteStorage', 'ngXMPPClient', 'ngMessages']).


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
 * check
 */
run(['SockethubSettings', 'SH', '$rootScope', 'RS', '$timeout',
function (settings, SH, $rootScope, RS, $timeout) {
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
run(['SockethubSettings', 'SH', '$rootScope', 'RS',
function (settings, SH, $rootScope, RS) {
  RS.call('sockethub', 'getConfig', ['']).then(function (c) {
    console.log('GOT SH CONFIG: ', c);
    var cfg = {};
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
  }, function (err) {
    console.log("RS.call error: ",err);
  });
}]).


/**
 * get xmpp config
 */
run(['SH', '$rootScope', 'RS', 'XMPP',
function (SH, $rootScope, RS) {
  RS.call('messages', 'getAccount', ['xmpp', 'default']).then(function (c) {
    console.log('GOT XMPP CONFIG: ', c);
    var cfg = {};

    if (c === undefined) {
      console.log('YOO!');
      $rootScope.$broadcast('showModalSettingsXmpp', { message: 'No existing XMPP configuration information found', locked: false });
      $rootScope.$broadcast('message', {
        message: 'xmpp-connection',
        type: 'error',
        timeout: false
        //important: true
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
run(['$rootScope', 'SH', 'XMPP',
function ($rootScope, SH, XMPP) {
    /*
        Receive emitted messages from elsewhere.
        http://jsfiddle.net/VxafF/
    */
    $rootScope.$on('showModalSettingsXmpp', function(event, args) {
      backdrop_setting = true;
      if ((typeof args === 'object') && (typeof args.locked !== 'undefined')) {
        if (args.locked) {
          backdrop_setting = "static";
        }
      }
      console.log('backdrop: ' + backdrop_setting);

      XMPP.modal.message = (typeof args.message === 'string') ? args.message : undefined;

      $("#modalSettingsXmpp").modal({
        show: true,
        keyboard: true,
        backdrop: backdrop_setting
      });
    });



    $rootScope.$on('closeModalSettingsXmpp', function(event, args) {
      $("#modalSettingsXmpp").modal('hide');
    });
}]).




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
//console.log('HASASD');
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

  $scope.modal = XMPP.modal;

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

}]).



/**
 * controller: talkCtrl
 */
controller("talkCtrl",
['$scope', '$route', '$routeParams', '$location', 'XMPP', '$rootScope',
function ($scope, $route, $routeParams, $location, XMPP, $rootScope) {
  console.log('--- talkCtrl run');

  $scope.model = {
    presence: XMPP.presence.data,
    contacts: XMPP.contacts.data,
    config: XMPP.config.data,
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


