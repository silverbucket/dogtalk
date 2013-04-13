(function (window, document, undefined) {

  function SockethubClient() {}

  function Connection(sock, host, enablePings, confirmationTimeout) {
    this.sock = sock;
    this.cfg = {
      host: host,
      enablePings:  enablePings,
      confirmationTimeout: confirmationTimeout
    };
    this.state = {
      isRegistered: false,
      isConnected: true
    };
    this.ping = {
      sent: 0,
      received: 0,
      paused: false
    };
    this.ridDB = {
      counter: 0
    };
    this.callbacks = {
      message: function () {},
      response: function () {},
      error: function () {},
      close: function () {},
      ping: function () {}
    };
    this.prepData = {
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

    this.assertConnected = function assertConnected() {
      if(typeof(sock) === 'undefined') {
        throw new Error("You need to connect sockethub before sending anything!");
      }
    };

    function processCallback(o) {
      if ((typeof this.ridDB[o.rid] !== 'undefined') &&
          (typeof this.ridDB[o.rid].promise === 'object')) {
        if ((typeof o.status !== 'undefined') &&
            (o.status === true)) {
          // success, call promise for this request
          this.ridDB[o.rid].promise.fulfill(o);
        } else {
          // call error promise
          this.ridDB[o.rid].promise.reject(o.message, o);
        }
      } else {
        if ((typeof o.rid !== 'undefined') && (o.rid > 0)) {
          // rid found, this is a response
          this.callbacks.response(o);
        } else {
          // no rid found, this is a new incoming message
          this.callbacks.message(o);
        }
      }
    }

    this.getRID = function getRID(verb) {
      this.ridDB.counter++;
      var rid = this.ridDB.counter;
      this.ridDB[rid] = {
        verb: verb,
        sent: new Date().getTime()
      };
      delete this.ridDB[rid - 20];
      return rid;
    };

    this.lookupVerb = function lookupVerb(rid) {
      var v = '';
      if (typeof this.ridDB[rid] !== 'undefined') {
        v =  this.ridDB[rid].verb;
      }
      return v;
    };

    this.log = function log(type, rid, message) {
      var verb = '';
      if (rid) {
        verb = ':' + this.lookupVerb(rid);
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
    };

    /**
     * Function: sendObject
     *
     * Send given object, storing a promise of the call
     *
     * Returns a promise, which will be fulfilled with the first response carrying
     * the same 'rid'.
     */
    this.sendObject = function sendObject(o) {
      var promise = promising();
      this.ridDB[o.rid].promise = promise;
      var json_o = JSON.stringify(o);
      this.log(1, o.rid, 'submitting: '+json_o);
      var _this = this;
      function __sendAttempt() {
        sock.send(json_o);
        setTimeout(function () {
          _this.log(4, o.rid, "checking confirmation status");
          if ((typeof _this.ridDB[o.rid].received === "undefined") ||
              (!_this.ridDB[o.rid].received)) {
            _this.log(3, o.rid, "confirmation not received after "+_this.cfg.confirmationTimeout+'ms, sending again.');
            __sendAttempt();
          } else {
            _this.log(2, o.rid, "confirmation received");
          }
        }, _this.cfg.confirmationTimeout);
      }
      __sendAttempt();
      return promise;
    };

    var _this = this;

    //
    // as far as we know, we're now connected, we can use the 'sock' object
    // to set our handler functions.
    //
    sock.onopen = function () {
      _this.log(4, null, 'onopen fired');
      _this.ping.pause = false;
      _this.state.isConnected = true;
    };

    sock.onclose = function () {
      _this.log(4, null, 'onclose fired');
      _this.ping.pause = true;
      _this.state.isConnected = false;
      _this.state.isRegistered = false;
      _this.callbacks.close();
    };

    sock.onmessage = function (e) {
      _this.log(4, null, 'onmessage fired');

      var data = JSON.parse(e.data);
      var now = new Date().getTime();

      if (data.verb === "ping") {
        //} else if ((typeof data.response === 'object') &&
        //           (typeof data.response.timestamp === 'number')) {
        // incoming ping
        var sentTime = parseInt(data.response.timestamp, null);
        if (_this.ping.sent > sentTime) {
          _this.log(3, data.rid, 'out of date ping response received');
          return false;
        } else {
          _this.ping.received = now;
        }

        _this.ping.rid = data.rid;
        _this.log(1, data.rid, 'response received: '+e.data);
        if (data.rid) {
          processCallback(ping);
        } else {
          var msg = 'no rid found on ping';
          if (data.message) {
            msg = data.message;
          }
          _this.callbacks.error(data, msg);
        }

      } else if (data.verb === 'confirm') {
        _this.log(4, data.rid, 'confirmation receipt received. ' + e.data);
        _this.ridDB[data.rid]['received'] = now;
        // XXX - how to expose confirms to the front-end?
        // call the error portion of the callback when the confirmation hasn't
        // been received for [confirmationTimeout] miliseconds.

      } else {
        // now we know that this object is either a response (has an RID) or
        // a message (new messages from sockethub)
        if (typeof data.rid === 'undefined') { // message
          _this.log(3, data.rid, e.data);
          _this.callbacks.message(data);
        } else {
          if (typeof _this.ridDB[data.rid].promise === "object") { // response with callback
            var handler = _this.ridDB[data.rid].promise;
            delete _this.ridDB[data.rid].promise;

            if ((typeof data.status !== "undefined") && (data.status === false)) {
              _this.log(3, data.rid, "rejecting promise");
              handler.reject(data);
            } else {
              if (data.verb === 'register') {
                _this.state.isRegistered = true;
              }
              _this.log(2, data.rid, "fulfilling promise");
              handler.fulfill(data);
            }
          } else {  // response without callback, send to handler
            _this.log(2, data.rid, "issuing 'response' callback");
            _this.callbacks.response(data);
          }
        }
      }
    };
  }

  Connection.prototype.on = function (type, callback) {
    if ((typeof this.callbacks[type] !== 'undefined') &&
        (typeof callback === 'function')) {
      this.callbacks[type] = callback;
    } else if (type === 'ping') {
      this.ping.callback = callback;
    } else {
      console.log('invalid callback function or type name: ' + type);
    }
  };

  Connection.prototype.reconnect = function () {
    this.ping.pause = true;
    this.state.isConnected = false;
    this.state.isRegistered = false;
    setTimeout(function () {
      this.sock.close();
      setTimeout(function () {
        this.connect(cfg);
      }, 0);
    }, 0);
  };

  Connection.prototype.isConnected = function () {
    return this.state.isConnected;
  };

  Connection.prototype.isRegistered = function () {
    return this.state.isRegistered;
  };

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
  Connection.prototype.togglePings = function () {
    this.ping.pause = (this.ping.pause) ? false : true;
    return this.ping.pause;
  };


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
  Connection.prototype.register = function (o) {
    this.log(4, null, 'sockethub.register called');
    this.assertConnected();
    this.log(4, null, 'verified connection');

    var r = this.prepData.register;
    r.rid = this.getRID('register');

    r.object = o;
    return this.sendObject(r);
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
  Connection.prototype.set = function (platform, data) {
    this.assertConnected();
    var r = this.prepData.set;
    r.target.platform = platform;
    r.object = data;
    r.rid = this.getRID('set');
    return this.sendObject(r);
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
  Connection.prototype.submit = function (o) {
    this.assertConnected();
    if (typeof o.verb === "undefined") {
      this.log(3, null, "verb must be specified in object");
      throw "verb must be specified in object";
    }
    o.rid = this.getRID(o.verb);
    return this.sendObject(o);
  };





  SockethubClient.prototype.connect = function (o) {
    var promise = promising();
    var isConnecting = true;

    // read and verify configuration
    if (typeof o !== 'object') {
      promise.reject('connection object not received');
      return promise;
    }

    if (typeof o.host === 'undefined') {
      //log(3, null, "sockethub.connect requires an object parameter with a 'host' property", o);
      console.log(" [SockethubClient] sockethub.connect requires an object parameter with a 'host' property", o);
      promise.reject("sockethub.connect requires an object parameter with a 'host' property");
      return promise;
    }

    if (typeof o.confirmationTimeout !== 'undefined') {
      o.confirmationTimeout = 4000;
    }

    if (typeof o.enablePings !== 'undefined') {
      o.enablePings = true;
    }

    //log(1, null, 'attempting to connect to ' + o.host);
    console.log(' [SockethubClient] attempting to connect to ' + o.host);

    try {
      sock = new WebSocket(o.host, 'sockethub');
    } catch (e) {
      //log(3, null, 'error connecting to sockethub: ' + e);
      console.log(' [SockethubClient] error connecting to sockethub: ' + e);
      promise.reject('error connecting to sockethub: ' + e);
    }

    if (!sock) {
      return promise;
    }

    sock.onopen = function () {
      console.log(' [SockethubClient] onopen fired');
      if (isConnecting) {
        isConnecting = false;
        var connection = new Connection(sock, o.host, o.enablePings, o.confirmationTimeout);
        promise.fulfill(connection);
      }
    };

    sock.onclose = function () {
      console.log(' [SockethubClient] onclose fired');
      if (isConnecting) {
        isConnecting = false;
        promise.reject("Unable to connect to sockethub at "+o.host);
      }
    };

    return promise;
  };


  //console.log('SockethubClient: ',SockethubClient.prototype);
  window.SockethubClient = new SockethubClient();

})(window, document);
