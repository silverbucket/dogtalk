/******
 * log
 ******/
var logCtrl = dogtalk.controller("logCtrl",  ['$scope', '$route', '$routeParams', '$location',
function ($scope, $route, $routeParams, $location) {
  $scope.model = {
    message: "this is the log page fool!"
  };
}] );
