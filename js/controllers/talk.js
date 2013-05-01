/*******
 * talk
 *******/
var talkCtrl = dogtalk.controller("talkCtrl",  ['$scope', '$route', '$routeParams', '$location', 'XMPP',
function ($scope, $route, $routeParams, $location, XMPP) {
  console.log('--- talkCtrl run');

  $scope.model = {
    presence: XMPP.presence.data,
    contacts: XMPP.contacts.data,
    config: XMPP.config.data
  };

  XMPP.initListener();  // initialize listener for incoming xmpp platform messages

  $scope.model.currentAddress = ($routeParams.address) ? $routeParams.address : 'none';
  $scope.model.currentName = ($scope.model.contacts[$routeParams.address]) ? $scope.model.contacts[$routeParams.address].name : '';
  $scope.model.currentConversation = ($scope.model.contacts[$routeParams.address]) ? $scope.model.contacts[$routeParams.address].conversation : [];


  $scope.conversationSwitch = function (address) {
    if (address !== $routeParams.address) { return ''; }
    console.log('---- talkCtrl.conversationSwitch('+address+')');

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
      $scope.model.saving = false;
    }, function (err) {
      console.log('sendMsg error: '+err);
      $scope.model.saving = false;
    });

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

