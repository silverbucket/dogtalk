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

function initRemoteStorage(callback) {
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
    callback();
  });
}

function sockethubConnect() {
  console.log('sockethubConnect()');
  setTimeout(function () {
    if (remoteStorage.getBearerToken() === null) {
      console.log('remoteStorage not connected, skipping sockethub register.');
      runWizard('remoteStorage');
    } else {
      remoteStorage.sockethub.getConfig().then(function (config) {
        console.log('sockethub config: ', config);
        if ((!config) ||
            (typeof config.host === 'undefined') ||
            (typeof config.port === 'undefined') ||
            (typeof config.secret === 'undefined') ||
            (!config.host) ||
            (!config.port) ||
            (!config.secret)) {
          runWizard('sockethub', config);
          return false;
        } else {
          sockethub.connect({
            host: "ws://localhost:10550/sockethub",
            confirmationTimeout: 6000, // timeout in miliseconds to wait for confirm
            enablePings: true // good for keepalive
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
            return false;
          });
        }
      }, function (error) {
        console.log('error getting sockethub config: ', error);
        return false;
      });
    }
  // we delay 1 second because when we come back from the
  // authorization sometimes the remoteStorage object is not
  // populated right away.
  }, 1000);
}
