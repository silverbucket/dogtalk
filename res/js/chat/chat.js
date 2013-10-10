angular.module('ngChat', ['ngSockethubClient', 'ngRemoteStorage']).



/**
 * get xmpp config
 */
run(['SH', '$rootScope', 'RS', 'Chat',
function (SH, $rootScope, RS, Chat) {
  RS.call('messages', 'getAccount', ['xmpp', 'default']).then(function (c) {
    console.log('GOT XMPP CONFIG: ', c);
    var cfg = {};

    if (c === undefined) {
      $rootScope.$broadcast('showModalSettingsXmpp', {
        message: 'No existing XMPP configuration information found',
        locked: false
      });
      $rootScope.$broadcast('message', {
        message: 'xmpp-connection',
        type: 'error',
        timeout: false
        //important: true
      });
    } else {
      Chat.connect('xmpp', c).then(function () {
        console.log('xmpp connected');
      }, function (err) {
        $rootScope.$broadcast('showModalSettingsXmpp', { message: 'Error connecting via XMPP '+err, locked: false });
        console.log('xmpp ERROR', err);
        $rootScope.$broadcast('message', {
          message: err,
          type: 'error',
          timeout: true
        });
      });
    }

  }, function (err) {
    console.log("RS.call failed: ",err);
  });
}]).


/**
 * get irc config
 */
run(['SH', '$rootScope', 'RS', 'Chat',
function (SH, $rootScope, RS, Chat) {
  RS.call('messages', 'getAccount', ['irc', 'default']).then(function (c) {
    console.log('GOT IRC CONFIG: ', c);
    var cfg = {};

    if (c === undefined) {
      $rootScope.$broadcast('showModalSettingsIrc', {
        message: 'No existing IRC configuration information found',
        locked: false
      });
      $rootScope.$broadcast('message', {
        message: 'irc-connection',
        type: 'error',
        timeout: false
        //important: true
      });
    } else {
      Chat.connect('irc', c).then(function () {
        console.log('irc connected');
      }, function (err) {
        $rootScope.$broadcast('showModalSettingsIrc', { message: 'Error connecting via IRC '+err, locked: false });
        console.log('irc ERROR', err);
        $rootScope.$broadcast('message', {
          message: err,
          type: 'error',
          timeout: true
        });
      });
    }

  }, function (err) {
    console.log("RS.call failed: ",err);
  });
}]).



/**
 * Chat settings
 */
value('ChatSettings', {
  xmpp: {
    config: {
      actor: {
        name: '',
        address: ''
      },
      username: '',
      password: '',
      server: 'jabber.org',
      resource: 'Dogtalk',//+Math.floor((Math.random()*100)+1),
      port: 5222
    },
    connected: false,
    env: {
      logo: '/res/img/xmpp-logo.png'
    },
    sockethub_props: ['username', 'password', 'server', 'resource', 'port'],
    required_props: ['username', 'password', 'server', 'resource', 'port'],
    save: function (cfg) {
      console.log('SAVE GOT CFG : ', cfg);
      if (!cfg.resource) {
        cfg.resource = this.xmpp.config.resource;
      }

      // build fullJid
      if (!cfg.fullJid) {
        if (cfg.username.indexOf('@') === -1) {
          cfg.bareJid = cfg.username + '@' + cfg.server;
        } else {
          cfg.bareJid = cfg.username;
        }
        cfg.fullJid = cfg.bareJid + '/' + cfg.resource;
      }

      if (typeof cfg.actor.address === 'string') {
      } else {
        delete cfg.actor;
        cfg.actor = {
          name: '',
          address: cfg.fullJid
        };
      }

      console.log('*(*& THIS: ', this);
      this.config = cfg;
    }
  },
  irc: {
    config: {
      actor: {
        name: '',
        address: ''
      },
      nick: '',
      password: '',
      server: 'irc.freenode.net',
      channels: []
    },
    connected: false,
    env: {
      logo: '/res/img/irc-logo.png'
    },
    sockethub_props: ['nick', 'password', 'server', 'channels'],
    required_props: ['nick', 'password', 'server', 'channels'],
    save: function (cfg) {
        cfg.actor.address = cfg.actor.address || cfg.nick;
        this.config = cfg;
    }
  }
}).



/**
 * factory: Chat
 */
factory('Chat', ['$rootScope', '$q', 'SH', 'ChatSettings', 'RS',
function ($rootScope, $q, SH, ChatSettings, RS) {

  var contacts = {};
  var requests = {};
  var settings = ChatSettings;


  function verify(type, cfg) {
    if (!cfg) {
      cfg = settings[type].conn;
    }

    for (var i in settings[type].required_props) {
      var prop = settings[type].required_props[i];
      if ((!cfg[prop]) || (cfg[prop] === '')) {
        return false;
      }
    }
    return true;
  }

  function exists(type) {
    verify(type, settings[type].conn);
  }

  function save(type, cfg) {
    if (verify(type, cfg)) {
      settings[type].save(cfg);
      return true;
    } else {
      console.log('XMPPSettings save failed: '+prop+': ', this[prop]);
      return false;
    }
  }




  function connect(platform, cfg) {
    var defer = $q.defer();

    if (save(platform, cfg)) {
      cfg = settings[platform].config;
      var credentials = {};
      console.log("REQUIREMENTS: ",settings[platform].sockethub_props);
      for (var i in settings[platform].sockethub_props) {
        console.log('attaching property: '+settings[platform].sockethub_props[i]);
        credentials[settings[platform].sockethub_props[i]] = cfg[settings[platform].sockethub_props[i]];
      }
      console.log("SETTINGS: ", settings[platform].config);
      console.log("CONFIG: ", cfg);
      console.log("CREDS: ", credentials);

      SH.set(platform, 'credentials', settings[platform].config.actor.address, credentials).then(function () {
        return setPresence(settings[platform].config.actor.address, 'available', '', true);
      }).then(function () {
        RS.call('messages', 'setAccount', [platform, 'default', cfg]).then(function () {
          defer.resolve();
        }, defer.reject);
      }, function (err) {
        //console.log('ERR:',err.message.message);
        defer.reject(err.message);
      });

    } else {
      defer.reject('XMPP config verification failed');
    }
    return defer.promise;
  }


  var presence = {
    state: undefined,
    statusText: null
  };

  function getPresence() {
    return presence.state;
  }

  function setPresence(actor, state, statusText, getRoster) {
    var defer = $q.defer();

    SH.submit({
      platform: 'xmpp',
      verb: 'update',
      actor: {
        address: actor
      },
      object: {
        show: state,
        status: statusText,
        roster: getRoster
      }
    }, 15000).then(function () {
      presence.state = state;
      presence.statusText = statusText;
      defer.resolve();
    }, function (msg) {
      defer.reject(msg);
    });

    return defer.promise;
  }


  // FIXME - this function needs to be re-evaluated and probably re-factored
  (function initListener() {
    SH.on('xmpp', 'message', function (data) {
      console.log('XMPP getting message: ', data);
      if (data.actor.address !== settings.xmpp.config.actor.address) {  // someone else interacting with us

        if ((data.platform === 'xmpp') &&
            (data.verb === 'update')) {
          // contact list & presence update
          if (!contacts[data.actor.address]) {
            contacts[data.actor.address] = {
              conversation: []
            };
          }
          console.log('CONTACTS ADD ['+data.actor.address+']: ', contacts);
          contacts[data.actor.address].address = data.actor.address;
          //contacts[data.actor.address].target = data.target[0];

          //name
          if (data.actor.name) {
            contacts[data.actor.address].name = data.actor.name;
          } else if (!contacts[data.actor.address].name) {
            contacts[data.actor.address].name = data.actor.address;
          }

          //state
          if (data.object.state) {
            contacts[data.actor.address].state = data.object.state;
          } else if (!contacts[data.actor.address].state) {
            contacts[data.actor.address].state = 'online';
          }

          //statusText
          if (data.object.statusText) {
            contacts[data.actor.address].statusText = data.object.statusText;
          } else if (!contacts[data.actor.address].statusText) {
            contacts[data.actor.address].statusText = '';
          }

          if (data.actor.name) {
            RS.call('contacts', 'byKey', ['impp', 'xmpp:'+data.actor.address]).then(function (contacts) {
              if (contacts.length === 0) {
                RS.call('contacts', 'add', [{
                  fn: data.actor.name,
                  impp: 'xmpp:'+data.actor.address
                }]).then(function () {
                  console.log('*** contact added for '+data.actor.address);
                }, function (err) {
                  console.log('*** contact add FAILED for '+data.actor.address, err.stack);
                });
              }
            });
          }

        } else if ((data.platform === 'xmpp') &&
                   (data.verb === 'request-friend')) {
          // friend request received
          requests[data.actor.address] = data;

        } else if ((data.platform === 'xmpp') &&
                   (data.verb === 'send')) {
          // a new message from someone on the outside
          if (!contacts[data.actor.address]) {
            contacts[data.actor.address] = {
              conversation: []
            };
          }
          console.log('added to conversation stack');
          contacts[data.actor.address].conversation.unshift(data);
        }
    /*
     * outgoing messsages will be coming through us, so do we need to set
     * up a sockethub listener?
     * maybe to validate receipt?
     *
     *} else { // us interacting with someone else
      if ((data.platform === 'xmpp') &&
          (data.verb === 'send')) {
        // a new message from us to someone on else
        contacts[data.target[0].address].conversation.unshift(data);
      }*/
      }
    });
  })();


  // send a message to sockethub
  function sendMsg(from, to, text) {
    var defer = $q.defer();
    var obj = {
      platform: 'xmpp',
      verb: 'send',
      actor: { address: from },
      target: [{ address: to }],
      object: {
        text: text
      }
    };
    SH.submit(obj).then(function () {
      // add message to conversation stack
      contacts[to].conversation.unshift(obj);
      defer.resolve();
    }, function (err) {
      defer.reject(err);
    });
    return defer.promise;
  }


  function acceptBuddyRequest(from, address) {
    var defer = $q.defer();

    var obj = {
      platform: 'xmpp',
      verb: 'make-friend',
      actor: { address: from },
      target: [{ address: address }]
    };

    SH.submit(obj).then(function () {
      console.log('acceptBuddyRequest Success');
      defer.resolve();
    }, function (err) {
      console.log('acceptBuddyRequest ERROR ',err);
      defer.reject(err);
    });

    return defer.promise;
  }

  //
  // XXX TODO :
  // instead of having getters and setters, it may be better to expose the variables
  // directly and then have some kind of watcher (angular ?) to do stuff when the
  // fields change
  //
  return {
    connect: connect,
    modal: {
      message: ''
    },
    presence: {
      set: setPresence,
      get: getPresence,
      data: presence
    },
    contacts: {
      data: contacts
    },
    requests: {
      data: requests,
      accept: acceptBuddyRequest
    },
    sendMsg: sendMsg
  };
}]).



/**
 * emitter: modal windows
 */
run(['$rootScope', 'SH', 'Chat',
function ($rootScope, SH, Chat) {
    /*
        Receive emitted messages from elsewhere.
        http://jsfiddle.net/VxafF/
    */
    $rootScope.$on('showModalSettingsXmpp', function(event, args) {
      backdrop_setting = true;
      if ((typeof args === 'object') && (typeof args.locked !== 'undefined')) {
        if (args.locked) {
          backdrop_setting = "static";
        }
      }
      console.log('backdrop: ' + backdrop_setting);

      Chat.modal.message = (typeof args.message === 'string') ? args.message : undefined;

      $("#modalSettingsXmpp").modal({
        show: true,
        keyboard: true,
        backdrop: backdrop_setting
      });
    });

    $rootScope.$on('closeModalSettingsXmpp', function(event, args) {
      $("#modalSettingsXmpp").modal('hide');
    });



    $rootScope.$on('showModalSettingsIrc', function(event, args) {
      backdrop_setting = true;
      if ((typeof args === 'object') && (typeof args.locked !== 'undefined')) {
        if (args.locked) {
          backdrop_setting = "static";
        }
      }
      console.log('backdrop: ' + backdrop_setting);

      Chat.modal.message = (typeof args.message === 'string') ? args.message : undefined;

      $("#modalSettingsIrc").modal({
        show: true,
        keyboard: true,
        backdrop: backdrop_setting
      });
    });

    $rootScope.$on('closeModalSettingsIrc', function(event, args) {
      $("#modalSettingsIrc").modal('hide');
    });
}]).



/**
 * directive: xmppSettings
 */
directive('xmppSettings', ['Chat', '$rootScope', 'ChatSettings',
function (Chat, $rootScope, settings) {
  return {
    restrict: 'A',
    templateUrl: 'xmpp-settings.html',
    link: function (scope) {
      scope.xmpp = {
        modal: Chat.modal,
        saving: false,
        settings: settings.xmpp
      };

      // Method: show
      // Displays the XMPP settings window
      scope.xmpp.show = function() {
        $rootScope.$broadcast('showModalSettingsXmpp', { locked: false });
      };

      // Method: save
      // Saves the current account data. Bound to the "Save" button
      scope.xmpp.save = function() {
        scope.xmpp.saving = true;
        console.log('connecting...');
        Chat.connect('xmpp', scope.xmpp.settings.config).then(function () {
          // xmpp credentials and signon success
          scope.xmpp.saving = false;
          console.log('connecting SUCESS');
          $rootScope.$broadcast('closeModalSettingsXmpp');
        }, function (err) {
          // xmpp credentials and signon failure
          scope.xmpp.saving = false;
          console.log('connecting FAILED: ',err);
          Chat.modal.message = err;
        });
      };
    }
  };
}]).


/**
 * directive: ircSettings
 */
directive('ircSettings', ['Chat', '$rootScope', 'ChatSettings',
function (Chat, $rootScope, settings) {
  return {
    restrict: 'A',
    templateUrl: 'irc-settings.html',
    link: function (scope) {
      scope.irc = {
        modal: Chat.modal,
        saving: false,
        settings: settings.irc
      };

      // Method: show
      // Displays the IRC settings window
      scope.irc.show = function() {
        $rootScope.$broadcast('showModalSettingsXmpp', { locked: false });
      };

      // Method: save
      // Saves the current account data. Bound to the "Save" button
      scope.irc.save = function() {
        scope.irc.saving = true;
        console.log('connecting...');
        Chat.connect('irc', scope.irc.settings.config).then(function () {
          // irc credentials and signon success
          scope.irc.saving = false;
          console.log('connecting SUCESS');
          $rootScope.$broadcast('closeModalSettingsXmpp');
        }, function (err) {
          // irc credentials and signon failure
          scope.irc.saving = false;
          console.log('connecting FAILED: ',err);
          Chat.modal.message = err;
        });
      };
    }
  };
}]).



/**
 * directive: contactsList
 */
directive('contactsList', [
function () {
  return {
    restrict: 'E',
    scope: {
      'contacts': '=',
      'requests': '='
    },
    template: '<h4 ng-transclude></h4>' +
              '<div class="add-contact">' +
              '  <input type="text" data-ng-model="c.name" />' +
              '</div>' +
              '<ul class="nav nav-list nav-pills nav-stacked xmpp-conact-requests">' +
              '  <li class="xmpp-contact-request" data-ng-repeat="r in requests">' +
              '    <span class="username add-username">{{ r.actor.address }}</span>' +
              '    <a class="close" href="#">&times;</a>' +
              '    <button class="btn btn-success" type="button"' +
              '            ng-click="acceptBuddyRequest(r.actor.address)"' +
              '            ng-disabled="model.saving"><span class="glyphicon glyphicon-ok"></i> Accept</button>' +
              '    <div style="margin-left: 3px; display: inline;">wants to be your friend!</div>' +
              '  </li>' +
              '</ul>' +
              '<ul class="nav nav-list nav-pills nav-stacked">' +
              '  <li data-ng-repeat="c in contacts | filter:c.name | orderBy:c.state"' +
              '      ng-class="conversationSwitch(c.address)">' +
              '    <a href="#/talk/{{c.address}}">' +
              '      <span class="state {{ c.state }}"></span>' +
              '     <span class="username" data-toggle="tooltip" title="{{ c.address }}">{{ c.name }}</span>' +
              '    </a>' +
              '  </li>' +
              '</ul>',
    transclude: true
  };
}]);
