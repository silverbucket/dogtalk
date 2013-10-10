angular.module('dogtalk', [
    'ngSockethubClient',
    'ngSockethubRemoteStorage',
    'ngRemoteStorage',
    'ngChat',
    'ngMessages'
    ]).


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
['$scope', '$route', '$routeParams', '$rootScope',
function ($scope, $route, $routeParams, $rootScope) {

  $scope.sockethubSettings = function () {
    $rootScope.$broadcast('showModalSockethubSettings', { locked: false });
  };

  $scope.xmppSettings = function () {
    $rootScope.$broadcast('showModalSettingsXmpp', { locked: false });
  };

  $scope.ircSettings = function () {
    $rootScope.$broadcast('showModalSettingsIrc', { locked: false });
  };

}]).



/**
 * controller: talkCtrl
 */
controller("talkCtrl",
['$scope', '$route', '$routeParams', '$location', 'Chat', '$rootScope', 'ChatSettings',
function ($scope, $route, $routeParams, $location, Chat, $rootScope, ChatSettings) {
  console.log('--- talkCtrl run '+$routeParams.address);

  $scope.model = {
    presence: Chat.presence.data,
    contacts: Chat.contacts.data,
    requests: Chat.requests.data,
    settings: ChatSettings
  };

  $scope.model.current = {
    address: $routeParams.address,
    contact: ($scope.model.contacts[$routeParams.address]) ? $scope.model.contacts[$routeParams.address] : '',
    conversation: ($scope.model.contacts[$routeParams.address]) ? $scope.model.contacts[$routeParams.address].conversation : []
  };
  console.log('scope.model.current.contact: ', $scope.model.current);

  $scope.$watch('model.contacts', function (newValue, oldValue) {
    console.log('SCOPE WATCH CONTACTS : ', newValue, oldValue);
  });

  $scope.conversationSwitch = function (address) {
    console.log('---- talkCtrl.conversationSwitch(' + address + ')');
    if (address !== $routeParams.address) { return ''; }

    if ($scope.model.contacts[address]) {
      $scope.model.current.contact = ($scope.model.contacts[$routeParams.address]) ? $scope.model.contacts[$routeParams.address] : '';
      $scope.model.current.conversation = $scope.model.contacts[address].conversation;

      console.log('currentConversation: ', $scope.model.current.conversation);
    } else {
      console.log('talkCtrl.conversationSwitch() - not in history');
    }

    return 'active';
  };

  $scope.sendMsg = function (text) {
    $scope.model.saving = true;
    Chat.sendMsg($scope.model.current.address, text).then(function () {
      $scope.model.sendText = '';
      $scope.model.saving = false;
    }, function (err) {
      console.log('sendMsg error: ',err);
      $scope.model.saving = false;
    });

  };

  $scope.isFromMe = function (address) {
    return Chat.isFromMe(address);
  };

  $scope.acceptBuddyRequest = function (address) {
    console.log('acceptBuddyRequest: ' + address);
    $scope.model.saving = true;
    if ($scope.model.requests[address]) {
      Chat.requests.accept(address).then(function () {
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
}]);