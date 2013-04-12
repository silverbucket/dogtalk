/*******
 * talk
 *******/
var homeCtrl = dogtalk.controller("talkCtrl",  ['$scope', '$route', '$routeParams', '$location',
function ($scope, $route, $routeParams, $location) {
  $scope.model = {
    message: "this is the main page fool!"
  };
}] );
