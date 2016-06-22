function AlbumViewModel (data) {
    var self = this;

    self.rootvm = data.rootvm;

    /* This should come in on the params */
    self.album_uuid = ko.observable();

    self.album = ko.observable(new Album({}));

    self.is_saving = ko.observable(false);
    self.is_busy = ko.observable(false);

    self.interval_timer = null;

    self.initialize = function(){
        self.rootvm.is_busy(true);

       //If the timers not null, null it out
        if(self.interval_timer != null){
            console.log('clearing interval');
            clearInterval(self.interval_timer);
            self.interval_timer = null;
        }

        self.album(new Album({'album_uuid':self.album_uuid(), 'rootvm':self.rootvm}));
        return self.album().get_album_details().then(function(){self.rootvm.is_busy(false)});;
    };
}
