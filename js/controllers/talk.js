/*******
 * talk
 *******/
var talkCtrl = dogtalk.controller("talkCtrl",  ['$scope', '$route', '$routeParams', '$location', 'XMPP', '$rootScope',
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

}]);

talkCtrl.loadConversations = function (verifyState, $q) {
  console.log('dogtalk.talkCtrl.loadConversations');
  return verifyState();
};

