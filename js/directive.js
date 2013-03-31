dogtalk.directive("error", function ($rootScope) {
  return {
    restrict: "E",
    template: '<div class="alert alert-error" ng-show="isRemoteStorageError">'+
              '<strong>First things first</strong>' +
              '<p>You need to connect to your remoteStorage</p>' +
              '</div>' +
              '<div class="alert alert-error" ng-show="isSockethubConfigError">'+
              '<strong>Unable to connect to Sockethub</strong>' +
              '<p>You must fill in your Sockethub connection details</p>' +
              '</div>' +
              '<div class="alert alert-error" ng-show="isUnknownError">'+
              '<strong>Unknown error</strong>' +
              '<p>An unknown routing error has occurred</p>' +
              '</div>',
    link: function (scope) {
      $rootScope.$on("$routeChangeError", function (event, current, previous, rejection) {
        //console.log('directive routeChangeError: ', event, current, previous, rejection);
        if (rejection.error === 1) {
          scope.isRemoteStorageError = true;
        } else if (rejection.error === 2) {
          scope.isSockethubConfigError = true;
          $("#modalCfgSockethub").modal({
            show: true,
            keyboard: true
          });
        } else {
          scope.isUnknownError = true;
        }
      });
    }
  };
});