var sockethub = (function (window, document, undefined) {
  var pub = {};
  //var noDelay = false; // delay the register command by 2 secs (read register function)
  var cfg = {
    enablePings:  false,
    confirmationTimeout: 6000
  };
  var sock;
  var isRegistered = false;
  var isConnected = false;
  var ridDB = {
    counter: 0
  };
  // maps 'rid's to a function that is being called once a response with that rid
  // is received. After that the function will be cleaned up
  var ridHandlers = {};
  var ping = {
    sent: 0,
    received: 0,
    paused: false
  };
  var callbacks = {
    //connect: function () {},
    message: function () {},
    response: function () {},
    error: function () {},
    close: function () {},
    //register: function () {},
    ping: function () {}
  };

  function assertConnected() {
    if(typeof(sock) === 'undefined') {
      throw new Error("You need to connect sockethub before sending anything!");
    }
  }

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
    var promise = promising();
    var isConnecting = true;
    if (typeof o !== 'object') {
      promise.reject('connection object not received');
      return promise;
    }

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
      promise.reject("sockethub.connect requires an object parameter with a 'host' property");
    } else {
      log(1, null, 'attempting to connect to ' + cfg.host);

      try {
        sock = new WebSocket(cfg.host, 'sockethub');
      } catch (e) {
        log(3, null, 'error connecting to sockethub: ' + e);
        promise.reject('error connecting to sockethub: ' + e);
      }

      if (sock) {
        sock.onopen = function () {
          ping.pause = false;
          isConnected = true;
          if (isConnecting) {
            isConnecting = false;
            promise.fulfill();
          }
        };

        sock.onclose = function () {
          ping.pause = true;
          isConnected = false;
          if (isConnecting) {
            isConnecting = false;
            promise.reject("unable to connect to sockethub at "+cfg.host);
          }
          callbacks.close();
        };

        sock.onmessage = function (e) {
          var data = JSON.parse(e.data);
          var now = new Date().getTime();

          if (data.verb === "ping") {
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

            ping.rid = data.rid;
            log(1, data.rid, 'response received: '+e.data);
            if (data.rid) {
              processCallback(ping);
            } else {
              var msg = 'no rid found on ping';
              if (data.message) {
                msg = data.message;
              }
              callbacks.error(data, msg);
            }

          } else if (data.verb === 'confirm') {
            //log(1, data.rid, 'confirmation receipt received. ' + e.data);
            ridDB[data.rid]['received'] = now;
            // XXX - how to expose confirms to the front-end?
            // call the error portion of the callback when the confirmation hasn't
            // been received for [confirmationTimeout] miliseconds.

          } else {
            if (typeof data.rid === 'undefined') {
              log(3, data.rid, e.data);
              callbacks.message(data);
            } else {
              var handler = ridHandlers[data.rid];
              if(handler) {
                delete ridHandlers[data.rid];
                handler(data);
              } else {
                log(2, data.rid, e.data);
                callbacks.response(data);
              }
            }
          }
        };
      }
    }
    return promise;
  };

  pub.reconnect = function () {
    ping.pause = true;
    setTimeout(function () {
      sock.close();
      pub.connect();
    }, 0);
  };

  pub.isConnected = function () {
    return isConnected;
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


  //
  // processCallback(o)
  function processCallback(o) {
    if ((typeof ridDB[o.rid] !== 'undefined') &&
        (typeof ridDB[o.rid].promise === 'object')) {
      if ((typeof o.status !== 'undefined') &&
          (o.status === true)) {
        // success, call promise for this request
        ridDB[o.rid].promise.fulfill(o);
      } else {
        // call error promise
        ridDB[o.rid].promise.reject(o.message, o);
      }
    } else {
      if ((typeof o.rid !== 'undefined') && (o.rid > 0)) {
        // rid found, this is a response
        callbacks.response(o);
      } else {
        // no rid found, this is a new incoming message
        callbacks.message(o);
      }

      //if (typeof callbacks[o.verb] === 'function') {
      //  callbacks[o.verb](o);
      //} else {
      //  log(3, o.rid, 'failed to find promise or callback');
      //}
    }
  }

  /**
   * Function: togglePings
   *
   * toggles pausing of pings, returns value of pause status
   *
   * Returns:
   *
   *   return
   *     true  - pings are paused
   *     false - pings are active
   */
  pub.togglePings = function () {
    ping.pause = (ping.pause) ? false : true;
    return ping.pause;
  };

  function log(type, rid, message) {
    // TODO FIXME
    // logs not working for now, lets get back to this later
    return;
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
    var pre = document.getElementById('log_output');
    pre.insertBefore(p, pre.childNodes[0]);

    if (type === 1) {
      console.log(' [sockethub] info - '+message);
    } else if (type === 2) {
      console.log(' [sockethub] success - '+message);
    } else if (type === 3) {
      console.log(' [sockethub] error - '+message);
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

  /**
   * Function: register
   *
   * register client with sockethub server
   *
   * Parameters:
   *
   *   o - object
   *       The value of the object area of the JSON.
   *
   * Returns:
   *
   *   return n/a
   */
  pub.register = function (o) {
    assertConnected();
    var r = sendData.register;

    r.object = o;
    return this.sendObject(r, getRID('register')).
      then(function(result) {
        if(! result.status) {
          throw "Failed to register with sockethub. Reason: " + result.message;
        }
      });
  };

  /**
   * Function: sendObject
   *
   * Send given object, setting it's 'rid' as specified.
   *
   * Returns a promise, which will be fulfilled with the first response carrying
   * the same 'rid'.
   */
  pub.sendObject = function(object, rid) {
    var promise = promising();
    object.rid = rid;
    ridHandlers[rid] = promise.fulfill;
    sock.send(JSON.stringify(object));
    return promise;
  };

  pub.set = function (platform, data) {
    assertConnected();
    var r = sendData.set;
    r.target.platform = platform;
    r.object = data;
    r.rid = getRID('set');
    var rawMessage = JSON.stringify(r);
    log(1, r.rid, rawMessage);
    sock.send(rawMessage);
  };

  pub.send = function (platform, actor, target, object) {
    assertConnected();
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
    assertConnected();
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
    assertConnected();
    o.rid = getRID(o.verb);
    var json_o = JSON.stringify(o);
    log(1, o.rid, 'submitting: '+json_o);
    sock.send(json_o);
  };

  //window.addEventListener('load', pub.connect);
  return pub;
}(window, document));
