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

function runWizard(modalName) {
  console.log('runWizard called');
  //navClass('settings');
  //navCtrl.switchPage('settings');
  if (modalName === 'remoteStorage') {
    $("#rspopup").modal({
      show: true,
      keyboard: true
    });
  } else if (modalName === 'secret') {
    $("#cfg_secret").modal({
      show: true,
      keyboard: true
    });
  }
}

function initRemoteStorage() {
  remoteStorage.util.silenceAllLoggers();
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
