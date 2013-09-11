(function () {
  var moduleName = 'messages';

  RemoteStorage.defineModule(moduleName, function (privateClient, publicClient) {

    function storeLast(userAddress, now) {
      privateClient.storeObject('last-message', 'last/'+userAddress, {
        timestamp: now
      });
    }

    function timestampToPath(timestamp) {
      timestamp = ''+timestamp;
      console.log(timestamp);
      var Ms = timestamp.substr(0,4),
          ks = timestamp.substr(4,3);
      return Ms+'/'+ks+'/'+timestamp.substr(7);
    }

    privateClient.declareType('message', {
      description: 'can be small (entry in the chat log) or big (email with CC\'s attachments)',
      key: 'timestamp',
      properties: {
        from: { type: 'useraddress', description: 'the sender', required: true },
        to: { type: 'useraddress or [useraddress]', description: 'the recipients. apart from mailto:, we invent mailcc:, mailbcc: to express CC\'s and BCC\'s', required: true },
        text: { type: 'utf-8 string', description: 'human-readable message', required: true },
        previous: { type: 'map',
          properties: {
            key: 'useraddress',
            type: 'timestamp',
            description: 'Previous message involving that contact'
          }
        }
      }
    });

    privateClient.declareType('last-message', {
      description: 'pointer from a contact to the last message involving that contact',
      key: 'useraddress',
      properties: {
        timestamp: { type: 'timestamp', description: 'timestamp of last message involving that contact' }
      }
    });

    privateClient.declareType('account', {
      description: 'settings for a messaging account',
      properties: {
        name: {
          type: 'string',
          description: 'a unique identifier for this account (in scope of the account type)',
          required: true
        },
        username: {
          type: 'string',
          required: true
        },
        password: {
          type: 'string',
          required: true
        },
        port: {
          type: 'number',
          required: true
        },
        resource: {
          type: 'string',
          required: true
        },
        server: {
          type: 'string',
          required: true
        }
      }
    });

    return {
      exports: {

        getAccounts: function (type) {
          if(type) {
            return privateClient.getAll('accounts/' + type + '/');
          } else {
            return privateClient.getListing('accounts/').
              then(function (types) {
                var result = {};
                return remoteStorage.util.asyncEach(types, function (dirEntry) {
                  if(remoteStorage.util.isDir(dirEntry)) {
                    var typeName = dirEntry.slice(0, dirEntry.length - 2);
                    return remoteStorage.messages.getAccounts(typeName).
                      then(function (accounts) {
                        result[typeName] = accounts;
                      });
                  }
                }).then(function() {
                  return result;
                });
              });
          }
        },

        getAccount: function (type, name) {
          var urlEncodedName = encodeURIComponent(name);
          return privateClient.getObject('accounts/' + type + '/' + urlEncodedName);
        },

        setAccount: function (type, name, config) {
          var urlEncodedName = encodeURIComponent(name);
          return privateClient.storeObject(
            'account', 'accounts/' + type + '/' + urlEncodedName, config
          );
        },

        getContactsByRecency: function () {
          return privateClient.getAll('last/').then(function(lastTimes) {
            var arr = [];
            for(var i in lastTimes) {
              arr.push({
                userAddress: i,
                lastMessage: lastTimes[i]
              });
            }
            arr.sort(function (a, b) {
              return a.timestamp - b.timestamp;
            });
            return arr;
          });
        },

        log: function (from, to, text) {
          var now = new Date().getTime(),
          obj = {
            from: from,
            to: to,
            text: text,
            previous: {}
          };

          return privateClient.getObject('last/'+from).then(function (lastSeenFrom) {
            if(lastSeenFrom) {
              obj.previous[from] = lastSeenFrom.timestamp;
            }//TODO: same for to: addresses
            return privateClient.storeObject('message', 'messages/'+timestampToPath(now), obj).then(function () {
              storeLast(from);
              for(var i=0; i<to.length; i++) {
                storeLast(to[i], now);
              }
            });
          });
        }

      }
    };
  });
})();
