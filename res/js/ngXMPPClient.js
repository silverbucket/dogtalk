angular.module('ngXMPPClient', ['ngSockethubClient', 'ngRemoteStorage']).


/**
 * default settings
 */
value('XMPPSettings', {
  conn: {
    displayname: '',
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
  save: function (prop, obj) {
    if (this.verify(prop, obj)) {
      if (!obj.resource) {
        obj.resource = this[prop].resource;
      }

      // build fullJid
      if (!obj.fullJid) {
        if (obj.username.indexOf('@') === -1) {
          obj.bareJid = obj.username + '@' + obj.server;
        } else {
          bareJid = obj.username;
        }
        obj.fullJid = obj.bareJid + '/' + obj.resource;
      }
      obj.actor = obj.fullJid;

      this[prop] = obj;
      console.log('XMPPSettings saved: '+prop+': ', this[prop]);
      return true;
    } else {
      console.log('XMPPSettings save failed: '+prop+': ', this[prop]);
      return false;
    }
  },
  exists: function (prop) {
    this.verify(prop, settings.conn);
  },
  verify: function (prop, p) {
    //console.log("VERIFY CALLED ["+prop+"] ", p);
    if (!p) {
      p = this[prop];
    }
    if ((typeof p.displayname !== 'undefined') && (p.displayname !== '') &&
        (p.username) && (p.username !== '') &&
        (p.password) && (p.password !== '') &&
        (p.server) && (p.server !== '') &&
        (p.port) && (p.port !== '')) {
      return true;
    } else {
      return false;
    }
  }
}).


/**
 * factory: XMPP
 */
factory('XMPP', ['$rootScope', '$q', 'SH', 'XMPPSettings', 'RS',
function ($rootScope, $q, SH, settings, RS) {

  var contacts = {};
  var requests = {};

  function connect(cfg) {
    var defer = $q.defer();

    if (settings.verify('conn', cfg)) {
      settings.save('conn', cfg);
      var config = {};
      config.username = cfg.username;
      config.password = cfg.password;
      config.port = cfg.port;
      config.resource = (cfg.resource) ? cfg.resource : 'Dogtalk';
      config.server = cfg.server;
      config.actor = {};
      config.actor.name = cfg.displayname;
      config.actor.address = settings.conn.actor;//cfg.username+'@'+cfg.server+'/'+config.resource;

      SH.set('xmpp', 'credentials', settings.conn.actor, config).then(function () {
        return setPresence(settings.conn.actor, 'available', '', true);
      }).then(function () {
        RS.call('messages', 'setAccount', ['xmpp', 'default', cfg]).then(function () {
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
  function initListener() {
    SH.on('xmpp', 'message', function (data) {
      console.log('XMPP getting message: ', data);
      if (data.actor !== settings.conn.actor) {  // someone else interacting with us

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
  }


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
    initListener: initListener,
    sendMsg: sendMsg
  };
}]).



/**
 * emitter: modal windows
 */
run(['$rootScope', 'SH', 'XMPP',
function ($rootScope, SH, XMPP) {
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

      XMPP.modal.message = (typeof args.message === 'string') ? args.message : undefined;

      $("#modalSettingsXmpp").modal({
        show: true,
        keyboard: true,
        backdrop: backdrop_setting
      });
    });

    $rootScope.$on('closeModalSettingsXmpp', function(event, args) {
      $("#modalSettingsXmpp").modal('hide');
    });
}]).



/**
 * directive: xmppSettings
 */
directive('xmppSettings', ['XMPP', '$rootScope', 'XMPPSettings',
function (XMPP, $rootScope, settings) {
  return {
    restrict: 'A',
    templateUrl: 'xmpp-settings.html',
    link: function (scope) {
      scope.xmpp = {
        modal: XMPP.modal,
        saving: false,
        settings: settings
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
        XMPP.connect(scope.xmpp.settings.conn).then(function () {
          // xmpp credentials and signon success
          scope.xmpp.saving = false;
          console.log('connecting SUCESS');
          $rootScope.$broadcast('closeModalSettingsXmpp');
        }, function (err) {
          // xmpp credentials and signon failure
          scope.xmpp.saving = false;
          console.log('connecting FAILED: ',err);
          XMPP.modal.message = err;
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
              '<ul class="nav nav-list nav-pills nav-stacked">' +
              '  <li data-ng-repeat="r in requests">' +
              '    <p><span class="username">{{ r.actor.address }}</span> </p>' +
              '    <p><button class="btn btn-success pull-left" type="button"' +
              '               ng-click="acceptBuddyRequest(r.actor.address)"' +
              '               ng-disabled="model.saving"><span class="glyphicon glyphicon-ok"></i> Accept</button>' +
              '       <div style="margin-left: 3px; display: inline;">wants to be your friend!</div>' +
              '      <a class="close" href="#">&times;</a>' +
              '    </p>' +
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
