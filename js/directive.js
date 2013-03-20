dogtalk.directive("error", function ($rootScope) {
  return {
    restrict: "E",
    template: '<div class="alert alert-error" ng-show="isRemoteStorageError">'+
      '<strong>First things first</strong>' +
      '<p>You need to connect to your remoteStorage</p>' +
      '</div>',
    link: function (scope) {
      $rootScope.$on("$routeChangeError", function (event, current, previous, rejection) {
        scope.isRemoteStorageError = true;
      });
    }
  };
});