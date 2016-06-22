"use strict";

/* Got execute on enter from :
   http://stackoverflow.com/questions/23087721/call-function-on-enter-key-press-knockout-js

   bind like this

   data-bind="executeOnEnter: sendMessage, button : buttonSelector"
*/

/* Visiblity div fading in and out */
function KeepixViewModel (data) {

    var self = this;

    self.type = "KeepixViewModel";
    self.is_busy = ko.observable(false);
    self.syslog = ko.observable();

    self.webapp_session = ko.observable(
        new WebappSession({rootvm: self}));

    self.check_login_status = function () {
        return self.webapp_session().get_session_status();
    };

    self.send_to_login_screen_if_not_logged_in = function () {

        self.check_login_status().then(function () {

            if (!self.user_logged_in()) {
                toastr.error("You have to log in first!");
                pager.navigate("login");
            }
        });

    };

    self.user_logged_in = ko.computed(function () {
        if (self.webapp_session().person_uuid()) {
            return true;
        }
        else {
            return false;
        }
    });

    self.setup_reset_password = function () {
    };

    self.click_on_enter = function(selector_id){

        // click selector button
        //
        if ($('#' + selector_id).attr('disabled') != 'disabled')
        {
            $('#' + selector_id)[0].click();
        }
    };


    self.uavm = new UserAdminViewModel({rootvm: self})

    self.newalbumvm = new NewAlbumViewModel({rootvm:self});
    self.albumvm = new AlbumViewModel({rootvm: self});
    self.albumsvm = new AlbumsViewModel({rootvm: self});
    self.addphotosvm = new AddPhotosViewModel({rootvm:self});



    /* For the top nav bar, this is where we'll define what
     * links to show */

    self.show_user_admin = ko.computed(function (){
        if(self.user_logged_in())
        {
            return self.webapp_session().user().group_title() == 'admin';
        }
        else{
            return false;
        }
    });

    self.show_albums = ko.computed(function (){
        if(self.user_logged_in())
        {
            return self.webapp_session().user().group_title() == 'user';
        }
        else{
            return false;
        }
    });
};
