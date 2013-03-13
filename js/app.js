var navList = angular.module('Dogtalk', []);

navList.controller('navCtrl', ['$scope', '$location', function ($scope, $location) {

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
}]);