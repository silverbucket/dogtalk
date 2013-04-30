/*******
 * talk
 *******/
var talkCtrl = dogtalk.controller("talkCtrl",  ['$scope', '$route', '$routeParams', '$location', 'XMPP',
function ($scope, $route, $routeParams, $location, XMPP) {
  XMPP.initListener();  // initialize listener for incoming xmpp platform messages

  $scope.model = {
    presence: XMPP.presence.data,
    contacts: XMPP.contacts.data,
    targetAddress: ($routeParams.address) ? $routeParams.address : 'none'
  };

  $scope.model.targetName = ($scope.model.contacts[$scope.model.targetAddress]) ? $scope.model.contacts[$scope.model.targetAddress].name : '';
  $scope.model.history = $scope.model.contacts[$scope.model.targetAddress];

}]);

talkCtrl.loadConversations = function (verifyState, $q) {
    console.log('dogtalk.talkCtrl.loadConversations');
    return verifyState();
};

