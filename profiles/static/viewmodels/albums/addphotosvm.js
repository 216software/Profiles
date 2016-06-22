function AddPhotosViewModel (data) {
    var self = this;

    self.rootvm = data.rootvm;
    self.type = 'AddPhotosViewModel';

    /* This should come in on the params */
    self.album_uuid = ko.observable();

    self.album = ko.observable(new Album({}));

    self.is_saving = ko.observable(false);
    self.is_busy = ko.observable(false);

    self.initialize = function(){
        self.is_busy(true);

        self.album(new Album({'album_uuid':self.album_uuid(), 'rootvm':self.rootvm}));

        if(window.localStorage.getItem('uploaded_by_name')){
            self.uploaded_by_name(window.localStorage.getItem('uploaded_by_name'));
            self.album().photo_collection().uploaded_by_name(self.uploaded_by_name());
        }

        return self.album().photo_collection().get_upload_urls().then(function(){
            self.album().get_album_details();
        });
    };



    self.show_upload_section = ko.computed(function(){

        if(self.rootvm.user_logged_in()){
            return true;
        }
        /* gotta check this one so computed updates */
        if(self.album().photo_collection().uploaded_by_name()){
            return true;
        }
        else{
            return false;
        }

    });

    /* If no user is logged in, set this */
    self.uploaded_by_name = ko.observable();

    self.set_uploaded_by_name = function(){
        window.localStorage.setItem('uploaded_by_name', self.uploaded_by_name());
        self.album().photo_collection().uploaded_by_name(self.uploaded_by_name());
    };


    self.add_more_photos_click = function(){
        self.album().photo_collection().get_upload_urls();
    };

    self.add_photos_disabled = ko.computed(function(){

       if(self.rootvm.is_busy()){
            return true;
       }
       if(self.album().photo_collection().show_upload_picker()){
            return true;
       }
       if(self.album().photo_collection().files_uploaded_but_not_finished().length > 0){
          return true;
       }
       else{
        return false;
       }
    });

    self.show_thank_you = ko.computed(function(){
        return !self.add_photos_disabled();
    });

    self.display_name = ko.computed(function(){
        if(self.rootvm.user_logged_in()){
            return self.rootvm.webapp_session().user().display_name();
        }
        else{
            return self.uploaded_by_name();
        }

    });


}
