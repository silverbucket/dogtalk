/*******
 * talk
 *******/
var talkCtrl = dogtalk.controller("talkCtrl",  ['$scope', '$route', '$routeParams', '$location', 'XMPP',
function ($scope, $route, $routeParams, $location, XMPP) {
  $scope.model = {
    message: "this is the main page fool!",
    presence: XMPP.presence.data,
    contacts: XMPP.contacts.data
  };

}]);

talkCtrl.loadConversations = function (verifyState, $q) {
    console.log('dogtalk.talkCtrl.loadConversations');
    return verifyState();
};

