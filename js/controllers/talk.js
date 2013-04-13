/*******
 * talk
 *******/
var talkCtrl = dogtalk.controller("talkCtrl",  ['$scope', '$route', '$routeParams', '$location',
function ($scope, $route, $routeParams, $location) {
  $scope.model = {
    message: "this is the main page fool!"
  };

}]);

talkCtrl.loadConversations = function (verifyState, $q) {
    console.log('dogtalk.talkCtrl.loadConversations');

    return verifyState();
};

