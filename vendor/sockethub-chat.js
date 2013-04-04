
(function(sockethub) {

  /**
   * Object: sockethub.chat
   *
   * Common functionality to implement a chat client on top of sockethub.js
   */
  sockethub.chat = {
    
    /**
     * Property: PRESENCE_TYPES
     * List of available presence types.
     */
    PRESENCE_TYPES: [
      'available',
      'away',
      'offline'
    ],

    /**
     * Method: setPresence
     *
     * Sets the current presence to the given type & status.
     *
     * Parameters:
     *   type - one of the predefined types of presences. see <PRESENCE_TYPES>
     *   status - (optional) human readable status message
     *
     * Returns:
     *   A promise, fulfilled once setting the presence has been confirmed by
     *   the hub.
     */
    setPresence: function(jid, type, status) {
      if(! (type in sockethub.chat.PRESENCE_TYPES_MAP)) {
        throw "Invalid presence type: " + type;
      }
      console.log('setPresence', type, status);
      return sockethub.sendObject({
        verb: 'change-presence',
        platform: 'xmpp',
        actor: {
          address: jid
        },
        object: {
          type: type,
          status: status
        }
      }, 'presence').then(function(result) {
        if(! result.status) {
          throw result.message;
        }
      });
    },

    /**
     * Method: init
     *
     * Initialize sockethub chat.
     *
     *   - Sends initial presence
     *   - Loads the roster
     */
    init: function(jid) {
      return sockethub.chat.setPresence(jid, 'available').
        then(function() {
          sockethub.chat.loadRoster(jid);
        });
    },

    /**
     * Method: loadRoster
     *
     * TODO
     */
    loadRoster: function(jid) {
      console.log('loadRoster', jid);
    }
  };

  sockethub.chat.PRESENCE_TYPES_MAP = sockethub.chat.PRESENCE_TYPES.reduce(
    function(map, type) {
      map[type] = true;
      return map;
    }, {}
  );

})(window.sockethub);
