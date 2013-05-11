dogtalk.directive("error", ['$rootScope', 'SH', function ($rootScope, SH) {
  return {
    restrict: "E",
    template: '<div class="alert alert-error" ng-show="isError">'+
              '<strong>{{displayError.title}}</strong>' +
              '<p>{{displayError.message}}</p>' +
              '</div>',
    link: function (scope) {

      var errors = {
        'remotestorage-connect': {
          title : 'Connect to remoteStorage',
          message: 'First things first. You must connect to your remoteStorage'
        },
        'sockethub-config': {
          title: 'Sockethub configuration needed',
          message: 'You must fill in your Sockethub connection details'
        },
        'sockethub-connect': {
          title: 'Sockethub connection error',
          message: 'Unable to connect to Sockethub please check your configuration and try again'
        },
        'sockethub-register': {
          title: 'Sockethub registration problem',
          message: 'We were unable to register with your Sockethub instance'
        },
        'xmpp-connect': {
          title: 'XMPP connection failed',
          message: 'There was a problem connecting to the XMPP server, please verify you settings'
        },
        'unknown': {
          title: 'An unknown error has occurred',
          message: ''
        }
      };

      $rootScope.$on("$routeChangeError", function (event, current, previous, rejection) {
        //console.log('directive routeChangeError: ', event, current, previous, rejection);
        console.log('directive routeChangeError: ', rejection);

        scope.isError = false;
        scope.displayError = {title: '', message: ''};

        if (typeof rejection === 'undefined') {
          rejection = 'no error specified';
        }

        if ((typeof rejection.error === 'undefined') ||
            (typeof errors[rejection.error] == 'undefined')) {
          scope.displayError = errors['unknown'];
          scope.displayError.message = String(rejection.message || rejection);
        } else {
          scope.displayError = errors[rejection.error];
          if (typeof rejection.message === 'string') {
            scope.displayError.message = rejection.message;
          }
        }
        scope.isError = true;

        if (rejection.error === 'sockethub-config') {
          console.log('no config found, launch modal');
          $rootScope.$broadcast('showModalSettingsSockethub', {locked: true});
        }
      });

      $rootScope.$on("$routeChangeSuccess", function (event, current, previous) {
        console.log('directive routeChangeSuccess ['+SH.isConnected()+']');
        if (SH.isConnected()) {
          scope.isError = false;
        } else {
          scope.isError = true;
          scope.displayError = errors['sockethub-connect'];
        }
      });
    }
  };
}]);
