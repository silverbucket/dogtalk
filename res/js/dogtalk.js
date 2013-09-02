angular.module('dogtalk', ['ngSockethubClient', 'ngRemoteStorage', 'ngXMPPClient']).


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
 * emitters
 */
run(['$rootScope', 'SH',
function ($rootScope, SH) {
    /*
        Receive emitted messages from elsewhere.
        http://jsfiddle.net/VxafF/
    */
    $rootScope.$on('showModalSettingsSockethub', function(event, args) {
      backdrop_setting = true;
      if ((typeof args === 'object') && (typeof args.locked !== 'undefined')) {
        if (args.locked) {
          backdrop_setting = "static";
        }
      }
      console.log('backdrop: ' + backdrop_setting);
      $("#modalSettingsSockethub").modal({
        show: true,
        keyboard: true,
        backdrop: backdrop_setting
      });
    });

    $rootScope.$on('closeModalSettingsSockethub', function(event, args) {
      //console.log('closeModalSockethubSettings');
      $("#modalSettingsSockethub").modal('hide');
    });

    $rootScope.$on('showModalSettingsXmpp', function(event, args) {
      backdrop_setting = true;
      if ((typeof args === 'object') && (typeof args.locked !== 'undefined')) {
        if (args.locked) {
          backdrop_setting = "static";
        }
      }
      console.log('backdrop: ' + backdrop_setting);
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
      SH.config.set(config.host,
                    parseInt(config.port, null),
                    config.secret).then(function () {
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

/*  $scope.$watch('model.currentAddress', function (address) {
    if (!address) { return false; }

    if ($scope.model.contacts[address]) {
      $scope.model.currentAddress = address;
      $scope.model.currentName = $scope.model.contacts[address].name;
      $scope.model.currentConversation = $scope.model.contacts[address].conversation;
      console.log('WATCH updated: ',$scope.model.current);
    } else {
      console.log('WATCH - not in history');
    }

  });*/

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
}]).




///////////////////////////////////////////////////////////////////////////
//
// DIRECTIVES
//
///////////////////////////////////////////////////////////////////////////


/**
 * directive: error
 */
directive("error",
['$rootScope', 'SH', function ($rootScope, SH) {
  return {
    restrict: "E",
    template: '<div class="alert alert-error" ng-show="isError">'+
              '<strong>{{displayError.title}}</strong>' +
              '<p>{{displayError.message}}</p>' +
              '</div>',
    link: function (scope) {

      var errors = {
        'remotestorage-connect': {
          title : 'Connect to remoteStorage',
          message: 'First things first. You must connect to your remoteStorage'
        },
        'sockethub-config': {
          title: 'Sockethub configuration needed',
          message: 'You must fill in your Sockethub connection details'
        },
        'sockethub-connect': {
          title: 'Sockethub connection error',
          message: 'Unable to connect to Sockethub please check your configuration and try again'
        },
        'sockethub-register': {
          title: 'Sockethub registration problem',
          message: 'We were unable to register with your Sockethub instance'
        },
        'xmpp-connect': {
          title: 'XMPP connection failed',
          message: 'There was a problem connecting to the XMPP server, please verify you settings'
        },
        'unknown': {
          title: 'An unknown error has occurred',
          message: ''
        }
      };

      $rootScope.$on("$routeChangeError", function (event, current, previous, rejection) {
        //console.log('directive routeChangeError: ', event, current, previous, rejection);
        console.log('directive routeChangeError: ', rejection);

        scope.isError = false;
        scope.displayError = {title: '', message: ''};

        if (typeof rejection === 'undefined') {
          rejection = 'no error specified';
        }

        if ((typeof rejection.error === 'undefined') ||
            (typeof errors[rejection.error] == 'undefined')) {
          scope.displayError = errors['unknown'];
          scope.displayError.message = String(rejection.message || rejection);
        } else {
          scope.displayError = errors[rejection.error];
          if (typeof rejection.message === 'string') {
            scope.displayError.message = rejection.message;
          }
        }
        scope.isError = true;

        if (rejection.error === 'sockethub-config') {
          console.log('no config found, launch modal');
          $rootScope.$broadcast('showModalSettingsSockethub', {locked: true});
        }
      });

      $rootScope.$on("$routeChangeSuccess", function (event, current, previous) {
        console.log('directive routeChangeSuccess ['+SH.isConnected()+']');
        if (SH.isConnected()) {
          scope.isError = false;
        } else {
          scope.isError = true;
          scope.displayError = errors['sockethub-connect'];
        }
      });
    }
  };
}]).


/**
 * directive: loading
 */
directive("loading",
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
}]);


