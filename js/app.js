var dogtalk = angular.module('dogtalk', ['ngDogtalk']);

dogtalk.config(['$routeProvider', 'initialize', function ($routeProvider, initialize) {
  $routeProvider.when('/:id', {
    templateUrl: "talk.html",
    controller: "talkCtrl",
    resolve: {
      checkConnections: function ($q) {
        console.log('routeprovider[home]: checkConnections');
        var defer = $q.defer();
        initialize.setState().then(function () {
          console.log('routeprovider[home]: checkConnections - success');
          defer.resolve();
        }, function () {
          console.log('routeprovider[home]: checkConnections - fail');
          defer.reject();
        });
        return defer.promise;
      }
    }
  }).otherwise({
    redirectTo: "/"
  });
}] );


/******
 * app
 ******/
var appCtrl = dogtalk.controller('appCtrl', ['$scope', '$rootScope', '$route', '$location',
function ($scope, $rootScope, $route, $location) {

  $rootScope.$on("$routeChangeStart", function (event, current, previous, rejection) {
    //console.log('routeChangeStart: ', $scope, $rootScope, $route, $location);
  });

  $rootScope.$on("$routeChangeSuccess", function (event, current, previous, rejection) {
    //console.log('routeChangeSuccess: ', $scope, $rootScope, $route, $location);
  });

  $rootScope.$on("$routeChangeError", function (event, current, previous, rejection) {
    //console.log('routeChangeError: ', rejection);
  });

}] );



/******
 * nav
 ******/
var navCtrl = dogtalk.controller("navCtrl",  ['$scope', '$route', '$routeParams', '$location',
function ($scope, $route, $routeParams, $location) {
  $scope.navClass = function (page) {
    var currentRoute = $location.path().substring(1) || 'home';
    return page === currentRoute ? 'active' : '';
  };
}] );