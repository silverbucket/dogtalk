var sockethub = (function (window, document, undefined) {
  var pub = {};
  //var noDelay = false; // delay the register command by 2 secs (read register function)
  var cfg = {
    enablePings:  false,
    confirmationTimeout: 6000
  };
  var sock;
  var isRegistered = false;
  var ridDB = {
    counter: 0
  };
  var ping = {
    sent: 0,
    received: 0,
    paused: false,
    callback: function () {}
  };
  var callbacks = {
    connect: function () {},
    message: function () {},
    response: function () {},
    error: function () {},
    close: function () {}
  };

  var sendData = {
    ping: {
      verb: 'ping',
      platform: 'dispatcher'
    },
    register: {
      verb: 'register',
      platform: 'dispatcher',
      object: {
        //remoteStorage: {
        //  storageInfo: '',
        //  bearerToken: '',
        //  scope: ''
        //},
        secret: ''
      }
    },
    send: {
      verb: "send",
      target : {
        to: [  // at least one record for 'to' required
          {
            address: ""
          }
        ],
        cc: [],  // ignored if undefined or empty
        bcc: []  // ignored if undefined or empty
      },
      object: {
        headers: {},  // name/value pairs of header data to use
        subject: "Hello ...",  // URL encoded string
        text: "Is it me you're looking for?"  // URL encoded string
      },
      actor: {
        address: ""
      }
    },
    post: {
      verb: "post",
      target: {
        to: [  // at least one record for 'to' required
          {
            address: ""
          }
        ],
        cc: []  // ignored if undefined or empty
      },
      object: {
        text: "Is it me you're looking for?"  // URL encoded string
      },
      actor: {
        address: ""
      }
    },
    set: {
      verb: "set",
      platform: "dispatcher",
      target: {
        platform: ""
      },
      object: {}
    }
  };

  pub.on = function (type, callback) {
    if ((typeof callbacks[type] !== 'undefined') &&
        (typeof callback === 'function')) {
      callbacks[type] = callback;
    } else if (type === 'ping') {
      ping.callback = callback;
    } else {
      console.log('invalid callback function or type name: ' + type);
    }
  };

  pub.connect = function (o) {
    if (typeof o.host !== 'undefined') {
      cfg.host = o.host;
    }
    if (typeof o.confirmationTimeout !== 'undefined') {
      cfg.confirmationTimeout = o.confirmationTimeout;
    }
    if (typeof o.enablePings !== 'undefined') {
      cfg.enablePings = o.enablePings;
    }

    if (typeof cfg.host === 'undefined') {
      log(3, null, "sockethub.connect requires an object parameter with a 'host' property", o);
      return false;
    }
    var connectString = cfg.host;

    log(1, null, 'attempting to connect to '+connectString);
    try {
      sock = new WebSocket(connectString, 'sockethub');
    } catch (e) {
      log(3, null, 'error connecting to sockethub: '+e);
      callbacks.error('error connecting to sockethub: '+e);
      return false;
    }

    sock.onopen = function () {
      //setTimeout(function () {
      //  pub.register();
      //}, 0);
      //doPings = true;
      callbacks.connect();
    };

    sock.onmessage = function (e) {
      var data = JSON.parse(e.data);
      var now = new Date().getTime();
      if (data.status === false) {
        //if (typeof data.rid === 'undefined') {
        //  data.rid = '';
        //}
        log(3, data.rid, 'error: ' + data.message);
        callbacks.error(data);

      } else if (data.verb === "ping") {
      //} else if ((typeof data.response === 'object') &&
      //           (typeof data.response.timestamp === 'number')) {
        // incoming ping
        var sentTime = parseInt(data.response.timestamp, null);
        if (ping.sent > sentTime) {
          log(3, data.rid, 'out of date ping response received');
          return false;
        } else {
          ping.received = now;
        }

        log(1, data.rid, 'response received: '+e.data);
        if (data.rid) {
          ping.callback(ping.sent, ping.received);
        } else {
          if (data.message) {
            callbacks.error(data);
          } else {
            callbacks.error(data, 'no rid found on ping');
          }
        }

      } else if (data.verb === 'confirm') {
        //log(1, data.rid, 'confirmation receipt received. ' + e.data);
        ridDB[data.rid]['received'] = now;

      } else {
        if (typeof data.rid === 'undefined') {
          log(3, data.rid, e.data);
          //isRegistered = true;
          callbacks.message(data);
        } else {
          log(2, data.rid, e.data);
          callbacks.response(data);
        }
        //log(3, 'unknown data received: ', e.data);
      }
    };

    sock.onclose = function () {
      callbacks.close();
    };
  };

  pub.reconnect = function () {
    doPings = false;
    setTimeout(function () {
      sock.close();
      pub.connect();
    }, 0);
  };

  /*window.addEventListener('load', function() {
    setInterval(function () {
      if (doPings) {
        var now = new Date().getTime();
        if(sock.readyState === WebSocket.CONNECTING) {
        } else if(sock.readyState === WebSocket.OPEN) {
          if (isRegistered) {
            var sendMsg = sendData.ping;
            sendMsg.rid = getRID('ping');
            sendMsg.timestamp = now;
            var json_sendMsg = JSON.stringify(sendMsg);
            //log(1, sendMsg.rid, json_sendMsg);
            sock.send(json_sendMsg);
          }
        } else if(sock.readyState === WebSocket.CLOSING) {
        } else {  // CLOSED or non-existent
          //console.log('sock.readyState: '+sock.readyState);
          pub.connect();
        }
      }
    }, 1000);
  });*/

  pub.togglePings = function () {
    ping.pause = (ping.pause) ? false : true;
  };

  function log(type, rid, message) {
    var c = { 1:'blue', 2:'green', 3:'red'};
    var d = new Date();
    var ds = (d.getHours() + 1) + ':' + d.getMinutes() + ':' + d.getSeconds();
    var verb;
    var prefix;
    if (rid) {
      verb = lookupVerb(rid);
      prefix = ds + ' ['+verb+']';
    } else {
      prefix = ds + ' []';
    }
    var p = document.createElement('p');
    p.style.color = c[type];
    var pmsg = document.createTextNode(prefix + ' - ' + message +"\n");
    p.appendChild(pmsg);
    var pre = document.getElementById('log');
    pre.insertBefore(p, pre.childNodes[0]);

    if (type === 1) {
      console.log(' [socekthub] info - '+message);
    } else if (type === 2) {
      console.log(' [socekthub] successi - '+message);
    } else if (type === 3) {
      console.log(' [socekthub] error - '+message);
    }
  }

  function getRID(verb) {
    ridDB.counter++;
    rid = ridDB.counter;
    ridDB[rid] = {
      verb: verb,
      sent: new Date().getTime()
    };
    delete ridDB[rid - 20];
    return rid;
  }

  function lookupVerb(rid) {
    var v = '';
    if (typeof ridDB[rid] !== 'undefined') {
      v =  ridDB[rid].verb;
    }
    return v;
  }

  pub.register = function (o) {
    var r = sendData.register;

    r.object = o;
    r.rid = getRID('register');
    var rawMessage = JSON.stringify(r);
    log(1, r.rid, rawMessage);
    sock.send(rawMessage);
   };

  pub.set = function (platform, data) {
    var r = sendData.set;
    r.target.platform = platform;
    r.object = data;
    r.rid = getRID('set');
    var rawMessage = JSON.stringify(r);
    log(1, r.rid, rawMessage);
    sock.send(rawMessage);
  };

  pub.send = function (platform, actor, target, object) {
    var r = sendData.send;
    r.platform = platform;
    r.object = object;
    r.actor = actor;
    r.target = target;
    r.rid = getRID('send');
    var rawMessage = JSON.stringify(r);
    log(1, r.rid, rawMessage);
    sock.send(rawMessage);
  };

  pub.post = function (platform, actor, target, object) {
    var r = sendData.post;
    r.platform = platform;
    r.object = object;
    r.actor = actor;
    r.target = target;
    r.rid = getRID('post');
    var rawMessage = JSON.stringify(r);
    log(1, r.rid, rawMessage);
    sock.send(rawMessage);
  };

  pub.submit = function (o) {
    o.rid = getRID(o.verb);
    var json_o = JSON.stringify(o);
    log(1, o.rid, 'submitting: '+json_o);
    sock.send(json_o);
  };

  //window.addEventListener('load', pub.connect);
  return pub;
}(window, document));
