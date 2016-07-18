function NewAlbumViewModel (data) {

    var self = this;
    self.type = "NewAlbumViewModel";
    self.rootvm = data.rootvm;

    self.new_album = ko.observable(new Album({rootvm:data.rootvm}));

    self.create_disabled = ko.computed(function(){

        if(self.new_album().complete()){
            return false;
        }
        else{
            return true;
        }

    });

    self.create_button_text = ko.computed(function(){
        return 'Create album &gt;';
    });

    self.create_album_click = function(){

        if(self.new_album().complete()){
            self.new_album().insert_new_album(function(data){
                console.log('in callback ', data);

                pager.navigate('albums/album?album_uuid=' + data.new_album.album_uuid);
            });
        }

    };

    self.initialize = function () {
        self.rootvm.webapp_session().user().navigate_here_after_login_success("new-album");
    };


};
