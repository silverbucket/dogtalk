Dogtalk.controller("navCtrl",  ['$scope', '$route', '$routeParams', '$location',
                   function ($scope, $route, $routeParams, $location) {

  $scope.navClass = function (page) {
    var currentRoute = $location.path().substring(1) || 'home';
    if (currentRoute === page) {
      switchPage(currentRoute);
      return 'active';
    } else {
      return '';
    }
    //return page === currentRoute ? 'active' : '';
  };
}] );

//navList.controller('navCtrl', ['$scope', '$location', function ($scope, $location) {
//}]);