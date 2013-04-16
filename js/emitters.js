dogtalk.run(function($rootScope, SH) {
    /*
        Receive emitted messages from elsewhere.
        http://jsfiddle.net/VxafF/
    */
    $rootScope.$on('showModalSettingsSockethub', function(event, args) {
      backdrop_setting = true;
      if ((typeof args === 'object') && (typeof args.locked !== 'undefined')) {
        if (args.locked) {
          backdrop_setting = "static";
        }
      }
      console.log('backdrop: ' + backdrop_setting);
      $("#modalSettingsSockethub").modal({
        show: true,
        keyboard: true,
        backdrop: backdrop_setting
      });
    });

    $rootScope.$on('closeModalSettingsSockethub', function(event, args) {
      //console.log('closeModalSockethubSettings');
      $("#modalSettingsSockethub").modal('hide');
    });

    $rootScope.$on('showModalSettingsXmpp', function(event, args) {
      backdrop_setting = true;
      if ((typeof args === 'object') && (typeof args.locked !== 'undefined')) {
        if (args.locked) {
          backdrop_setting = "static";
        }
      }
      console.log('backdrop: ' + backdrop_setting);
      $("#modalSettingsXmpp").modal({
        show: true,
        keyboard: true,
        backdrop: backdrop_setting
      });
    });

    $rootScope.$on('closeModalSettingsXmpp', function(event, args) {
      $("#modalSettingsXmpp").modal('hide');
    });
});