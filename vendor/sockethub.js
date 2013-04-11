var sockethub = (function (window, document, undefined) {
  var pub = {};
  var sock;

  var cfg = {
    host: '',
    enablePings:  false,
    confirmationTimeout: 6000
  };

  var isRegistered = false;
  var isConnected = false;

  var ridDB = {
    counter: 0
  };

  var ping = {
    sent: 0,
    received: 0,
    paused: false
  };

  var callbacks = {
    message: function () {},
    response: function () {},
    error: function () {},
    close: function () {},
    ping: function () {}
  };

  var prepData = {
    ping: {
      verb: 'ping',
      platform: 'dispatcher'
    },
    register: {
      verb: 'register',
      platform: 'dispatcher',
      object: {}
    },
    set: {
      verb: "set",
      platform: "dispatcher",
      target: {},
      object: {}
    }
  };


  function assertConnected() {
    if(typeof(sock) === 'undefined') {
      throw new Error("You need to connect sockethub before sending anything!");
    }
  }

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

    // read and verify configuration
    if (typeof o !== 'object') {
      promise.reject('connection object not received');
      return promise;
    }

    if (typeof o.host !== 'undefined') {
      cfg.host = o.host;
    } else {
      log(3, null, "sockethub.connect requires an object parameter with a 'host' property", o);
      promise.reject("sockethub.connect requires an object parameter with a 'host' property");
      return promise;
    }

    if (typeof o.confirmationTimeout !== 'undefined') {
      cfg.confirmationTimeout = o.confirmationTimeout;
    }

    if (typeof o.enablePings !== 'undefined') {
      cfg.enablePings = o.enablePings;
    }

    log(1, null, 'attempting to connect to ' + cfg.host);

    try {
      sock = new WebSocket(cfg.host, 'sockethub');
    } catch (e) {
      log(3, null, 'error connecting to sockethub: ' + e);
      promise.reject('error connecting to sockethub: ' + e);
    }

    if (!sock) {
      return promise;
    }


    //
    // as far as we know, we're now connected, we can use the 'sock' object
    // to set our handler functions.
    //
    sock.onopen = function () {
      log(4, null, 'onopen fired');
      ping.pause = false;
      isConnected = true;
      if (isConnecting) {
        isConnecting = false;
        promise.fulfill();
      }
    };

    sock.onclose = function () {
      log(4, null, 'onclose fired');
      ping.pause = true;
      isConnected = false;
      isRegistered = false;
      if (isConnecting) {
        isConnecting = false;
        promise.reject("Unable to connect to sockethub at "+cfg.host);
      }
      callbacks.close();
    };

    sock.onmessage = function (e) {
      log(4, null, 'onmessage fired');

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
        log(4, data.rid, 'confirmation receipt received. ' + e.data);
        ridDB[data.rid]['received'] = now;
        // XXX - how to expose confirms to the front-end?
        // call the error portion of the callback when the confirmation hasn't
        // been received for [confirmationTimeout] miliseconds.

      } else {
        // now we know that this object is either a response (has an RID) or
        // a message (new messages from sockethub)
        if (typeof data.rid === 'undefined') { // message
          log(3, data.rid, e.data);
          callbacks.message(data);
        } else {
          if (typeof ridDB[data.rid].promise === "object") { // response with callback
            var handler = ridDB[data.rid].promise;
            delete ridDB[data.rid].promise;

            if ((typeof data.status !== "undefined") && (data.status === false)) {
              log(3, data.rid, "rejecting promise");
              handler.reject(data);
            } else {
              if (data.verb === 'register') {
                isRegistered = true;
              }
              log(2, data.rid, "fulfilling promise");
              handler.fulfill(data);
            }
          } else {  // response without callback, send to handler
            log(2, data.rid, "issuing 'response' callback");
            callbacks.response(data);
          }
        }
      }
    };
    return promise;
  };

  pub.reconnect = function () {
    ping.pause = true;
    isConnected = false;
    isRegistered = false;
    setTimeout(function () {
      sock.close();
      setTimeout(function () {
        pub.connect(cfg);
      }, 0);
    }, 0);
  };

  pub.isConnected = function () {
    return isConnected;
  };

  pub.isRegistered = function () {
    return isRegistered;
  };


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

  function log(type, rid, message) {
    var verb = '';
    if (rid) {
      verb = ':' + lookupVerb(rid);
    }
    if (type === 1) {
      console.log('  [sockethub'+verb+'] info    - '+message);
    } else if (type === 2) {
      console.log('  [sockethub'+verb+'] success - '+message);
    } else if (type === 3) {
      console.log('  [sockethub'+verb+'] error   - '+message);
    } else if (type === 4) {
      console.log('  [sockethub'+verb+'] debug   - '+message);
    }
  }



  /**
   * Function: sendObject
   *
   * Send given object, storing a promise of the call
   *
   * Returns a promise, which will be fulfilled with the first response carrying
   * the same 'rid'.
   */
  function sendObject(o) {
    var promise = promising();
    ridDB[o.rid].promise = promise;
    var json_o = JSON.stringify(o);
    log(1, o.rid, 'submitting: '+json_o);
    sock.send(json_o);
    return promise;
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
    console.log('sockethub.register called');
    assertConnected();
    console.log('verified connection');

    var r = prepData.register;
    r.rid = getRID('register');

    r.object = o;
    return sendObject(r);
  };


  /**
   * Function: set
   *
   * Issue the set command to a platform
   *
   * Parameters:
   *
   *   platform - the platform to send the set command to
   *   data     - the data to be contained in the 'object' propery
   *
   */
  pub.set = function (platform, data) {
    assertConnected();
    var r = prepData.set;
    r.target.platform = platform;
    r.object = data;
    r.rid = getRID('set');
    return sendObject(r);
  };


  /**
   * Function: submit
   *
   * submit any message to sockethub, providing the entire object (except RID)
   *
   * Parameters:
   *
   *   o - the entire message (including actor, object, target), but NOT including RID
   *
   */
  pub.submit = function (o) {
    assertConnected();
    if (typeof o.verb === "undefined") {
      log(3, null, "verb must be specified in object");
      throw "verb must be specified in object";
    }
    o.rid = getRID(o.verb);
    return sendObject(o);
  };

  return pub;
}(window, document));
