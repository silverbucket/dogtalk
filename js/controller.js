function navCtrl($scope, $route, $routeParams, $location) {


  function switchPage(pageName) {
    console.log('switchPage called: ' + pageName);
    $(".page").each(function () {
      if ($(this).attr('id') === pageName) {
        $(this).removeClass('hide');
      } else {
        $(this).addClass('hide');
      }
    });
  }

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


}

//navList.controller('navCtrl', ['$scope', '$location', function ($scope, $location) {
//}]);