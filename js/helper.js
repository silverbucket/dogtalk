
function applyAngularPromiseHack(constructor, rootScope) {
  function apply(f) {
    return function() {
      var args = Array.prototype.slice.call(arguments);
      return rootScope.$apply(function() {
        return f.apply(this, args);
      });
    };
  }
  return function() {
    var promise = constructor.apply(this, arguments);
    var oldThen = promise.then;
    promise.then = function(_success, _failure) {
      var success = _success, failure = _failure;
      var angularPhase = rootScope.$$phase;
      if(angularPhase !== '$apply' &&
         angularPhase !== '$digest') {
        if(typeof(_success) === 'function') {
          success = apply(_success);
        }
        if(typeof(_failure) === 'function') {
          failure = apply(_failure);
        }
      }
      return oldThen(success, failure);
    };
    return promise;
  };
}

function initRemoteStorage($scope) {
  if(typeof($scope) !== 'undefined') {
    remoteStorage.util.getPromise = applyAngularPromiseHack(
      remoteStorage.util.getPromise, $scope.$root
    );
    promising = applyAngularPromiseHack(promising, $scope.$root);
  }
  remoteStorage.util.silenceAllLoggers();
  remoteStorage.defineModule('sockethub', function(privateClient, publicClient) {
    privateClient.declareType('config', {
      "description" : "sockethub config file",
      "type" : "object",
      "properties": {
        "host": {
          "type": "string",
          "description": "the hostname to connect to",
          "format": "uri",
          "required": true
        },
        "port": {
          "type": "number",
          "description": "the port number to connect to",
          "required": true
        },
        "secret": {
          "type": "string",
          "description": "the secret to identify yourself with the sockethub server",
          "required": true
        }
      }
    });

    return {
      exports: {
        getConfig: function() {
          return privateClient.getObject('config.json');
        },
        writeConfig: function(data) {
          //console.log(' [RS] writeConfig()');
          return privateClient.storeObject('config', 'config.json', data);
        }
      }
    };
  });

  remoteStorage.claimAccess('sockethub', 'rw').then(function() {
    remoteStorage.displayWidget('remotestorage-connect', {
      redirectUri: window.location.origin + '/rscallback.html'
    });
  });
}

