dogtalk.directive("loading", ['$rootScope', function ($rootScope) {
  return {
    restrict: "E",
    template: '<div class="loading" ng-show="isLoading">'+
              '<img src="img/loading_animation.gif" />' +
              '</div>',
    link: function (scope) {

      $rootScope.$on("$routeChangeStart", function () {
        console.log('loading: directive routeChangeStart');
        scope.isLoading = true;
      });

      $rootScope.$on("$routeChangeError", function (event, current, previous, rejection) {
        //console.log('directive routeChangeError: ', event, current, previous, rejection);
        //console.log('directive routeChangeError: ', rejection);
        console.log('loading: directive routeChangeError');
        scope.isLoading = false;
      });

      $rootScope.$on("$routeChangeSuccess", function (event, current, previous) {
        console.log('loading: directive routeChangeSuccess');
        scope.isLoading = false;
      });
    }
  };
}]);
