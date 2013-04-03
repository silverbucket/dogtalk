
function remoteStorageApplyAngularPromiseHack(rootScope) {
  var oldGetPromise = remoteStorage.util.getPromise;
  function apply(f) {
    return function() {
      var args = Array.prototype.slice.call(arguments);
      return rootScope.$apply(function() {
        return f.apply(this, args)
      });
    };
  }
  remoteStorage.util.getPromise = function() {
    var promise = oldGetPromise.apply(this, arguments);
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

function runWizard(name, config) {
  console.log('runWizard('+name+') called');
  //navClass('settings');
  //navCtrl.switchPage('settings');
  if (name === 'remoteStorage') {
    $("#rsAlert").show();
  } else if (name === 'sockethub') {
    $("#modalCfgSockethub").modal({
      show: true,
      keyboard: true
    });
  }
}

function initRemoteStorage($scope) {
  if(typeof($scope) !== 'undefined') {
    remoteStorageApplyAngularPromiseHack($scope.$root);
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

function sockethubConnect(config) {
  return sockethub.connect({
    host: "ws://localhost:10550/sockethub",
    confirmationTimeout: 6000,   // timeout in miliseconds to wait for confirm
    enablePings: true            // good for keepalive
  }).then(function () {  // connection to sockethub sucessful
    console.log('connected to sockethub');
    return sockethub.register({
      remoteStorage: {
        bearerToken: remoteStorage.getBearerToken(),
        scope: remoteStorage.claimedModules,
        storageInfo: remoteStorage.getStorageInfo()
      },
      secret: config.secret
    });
  }, function (err) {
    //console.log('received error on connect: '+err+' : ', o);
    console.error('received error on connect: '+err, (err && err.stack) || '');
  }).then(function() {
    console.log('registered!');
  }, function(err) {
    console.log('error registering: ', err);
    throw err;
  });
}
