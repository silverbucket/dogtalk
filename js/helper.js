
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

function initRemoteStorage() {
  console.log('initRemoteStorage()');
  //remoteStorage.util.silenceAllLoggers();
  remoteStorage.defineModule('sockethub', function(privateClient, publicClient) {
    return {
      exports: {
        getConfig: function() {
          console.log(' [RS] getConfig()');
          return privateClient.getObject('config.json');
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
    remoteStorage.displayWidget('remotestorage-connect');
  });
}

function sockethubConnect(config) {
  var promise = promising();
  sockethub.connect({
    host: "ws://localhost:10550/sockethub",
    confirmationTimeout: 6000,   // timeout in miliseconds to wait for confirm
    enablePings: true   // good for keepalive
  }).then(function () {    // connection to sockethub sucessful
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
