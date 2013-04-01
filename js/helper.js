
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

function submitConfig(host, port, secret) {
  remoteStorage.sockethub.writeConfig({
    host: host,
    port: parseInt(port),
    secret: secret
  });
}

function initRemoteStorage() {
  console.log('initRemoteStorage()');
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
          console.log(' [RS] getConfig()');
  //$scope.$apply(function() {console.log('YARG');});
          var promise = promising();
          privateClient.getObject('config.json').then(function (config) {
            console.log('got config:', config);

            if (config) {
              promise.fulfill(config);
            } else {
              console.log('sockethub module: no config found');
              promise.reject('no config found');
            }
          }, function (error) {
            promise.reject(error);
          });
          return promise;
        },
        writeConfig: function(data) {
          console.log(' [RS] writeConfig()');
          return privateClient.storeObject('config', 'config.json', data);
        }
      }
    };
  });

  remoteStorage.claimAccess('sockethub', 'rw').then(function() {
  //  return remoteStorage.claimAccess('messages', 'rw');
  //}).then(function () {
    remoteStorage.displayWidget('remotestorage-connect', {
      redirectUri: window.location.origin + '/rscallback.html'
    });
  });
}

function sockethubConnect(config) {
  var promise = promising();
  sockethub.connect({
    host: "ws://localhost:10550/sockethub",
    confirmationTimeout: 6000,   // timeout in miliseconds to wait for confirm
    enablePings: true            // good for keepalive
  }).then(function () {  // connection to sockethub sucessful
    console.log('connected to sockethub');
    sockethub.register({
      storageInfo: remoteStorage.getStorageInfo(),
      remoteStorage: {
        bearerToken: remoteStorage.getBearerToken(),
        scope: remoteStorage.claimedModules
      }
    });
  }, function (err, o) {
    console.log('recevied error on connect: '+err+' : ', o);
    promise.reject('recevied error on connect: '+err);
  });
  return promise;
}
