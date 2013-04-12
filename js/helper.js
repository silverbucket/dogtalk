

function initRemoteStorage($scope) {
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

