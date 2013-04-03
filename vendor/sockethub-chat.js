
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
    setPresence: function(type, status) {
      if(! (type in sockethub.chat.PRESENCE_TYPES_MAP)) {
        return promising().reject("Invalid presence type: " + type);
      }
      return sockethub.sendObject({
        verb: 'presence',
        platform: 'xmpp',
        object: {
          type: type,
          status: status
        }
      }, 'presence');
    }

  };

  sockethub.chat.PRESENCE_TYPES_MAP = sockethub.chat.PRESENCE_TYPES.reduce(
    function(map, type) {
      map[type] = true;
      return map;
    }, {}
  );

})(window.sockethub);
