function Album (data) {

    var self = this;
    self.type = "album";
    self.rootvm = data.rootvm;

    self.album_uuid = ko.observable(data.album_uuid);
    self.category = ko.observable(data.category);
    self.album_size = ko.observable(data.album_size);

    self.album_date = ko.observable(new DateRange({'no_ending':true}));
    self.title = ko.observable(data.title);

    self.pretty_label = ko.observable(data.pretty_label);

    self.extra_notes = ko.observable(data.extra_notes);

    self.album_location = ko.observable(data.album_location);

    // Short code url that we can refer to this album by
    self.short_code = ko.observable(data.short_code);

    self.complete = ko.computed(function(){
        if(self.title() && self.album_date().complete()){
            return true;
        }
        else{
            return false;
        }
    });


    self.created_by = ko.observable(data.created_by);
    self.inserted = ko.observable(new moment(data.inserted));
    self.updated = ko.observable(data.updated);

    self.photo_collection = ko.observable(new PhotoCollection({
        'rootvm':self.rootvm,
        'photo_type':self.type,
        'photo_type_uuid':self.album_uuid,
        'photos':data.photos || []}));

    self.created_by_person = ko.observable();

    if (data.created_by_person) {
        self.created_by_person(new Person(data.created_by_person));
    }

    self.show_delete = ko.computed(function(){

        return false;

    });

    self.no_photos = ko.computed(function(){

        if(self.photo_collection() != undefined){
            return self.photo_collection().photos().length == 0;
        }
        else{
            return true;
        }
    });

    self.has_photos = ko.computed(function(){
        return !self.no_photos();
    });



    self.insert_new_album = function (success_callback) {

        self.rootvm.is_busy(true);
        self.rootvm.syslog("Inserting new album");

        return $.ajax({

            url:        "/api/insert-new-album",
            type:       "POST",
            dataType:   "json",

            contentType: "application/json; charset=utf-8",
            processData: false,

            data: ko.toJSON({
                title: self.title(),
                album_date: self.album_date().starting_date()
            }),

            complete: function (jqXHR, s) {
                self.rootvm.is_busy(false);
                self.rootvm.syslog("Finished saving new album:" + s);
            },

            success: function (data) {

                if (data.success) {

                    var d = data.new_album;
                    d.rootvm = self.rootvm;

                    if(success_callback){
                        success_callback(data);
                    }

                }

                else {
                    toastr.error(data.message);
                }
            }
        });

    };

    self.reset_everything = function () {

        self.album_uuid(null);
        self.created_by(null);
        self.inserted(null);
        self.album_uuid = null;
        self.album_location(null);
    };

    self.update_self = function (a) {

        console.log('updating self', a);

        self.album_uuid(a.album_uuid);
        self.created_by(a.created_by);
        self.title(a.title);
        self.album_date().starting_date(a.album_date);
        self.inserted(moment(a.inserted));

        /* Let's just update the photos */
        /*self.photo_collection(new PhotoCollection({
            'rootvm':self.rootvm,
            'photo_type':self.type,
            'photo_type_uuid':self.album_uuid,
            'photos':a.photos || []}));*/

        self.photo_collection().set_photos(a.photos)

    };

    self.computed_label = ko.computed(function () {

        var s;

        if (self.created_by_person()) {
            s = " started by: " + self.created_by_person().display_name();
        }

        else {
            s = "";
        }

        return self.title()
        + " album"
        + s;

    });

    self.get_album_details = function () {

        if (!self.album_uuid()) {
            toastr.error("Sory, can't look up album details without a UUID");
            return;

        } else {

            self.rootvm.is_busy(true);
            self.rootvm.syslog("Looking up details for album " + self.album_uuid());

            return $.ajax({
                url: "/api/album-details",
                type: "GET",
                data: {
                    album_uuid: self.album_uuid()
                },
                dataType: "json",
                complete: function () {

                    self.rootvm.is_busy(false);
                    self.rootvm.syslog("Finished looking up details for " + self.album_uuid());
                },
                success: function (data) {
                    if (data.success) {
                        self.update_self(data.album);
                    }
                    else {
                        toastr.error(data.message);
                    }
                }
            });
        }
    };

    self.delete_album = function () {

        self.rootvm.is_busy(true);

        self.rootvm.syslog(
            "Deleting album ("
            + self.album_uuid()
            + "...");

        $.ajax({
            url: "/api/delete-album",
            method: "POST",

            data: ko.toJSON({
                album_uuid: self.album_uuid(),
            }),

            contentType: "application/json; charset=utf-8",
            processData: false,

            complete: function () {
                self.rootvm.is_busy(false);
                self.rootvm.syslog("Finished deleting album");
            },

            success: function (data) {

                if (data.success) {
                    self.current_status(data.updated_album.current_status);
                    toastr.success(data.message);
                } else {
                    toastr.error(data.message);
                }
            },

            error: function(){
                toastr.error("An error occurred");
            }
        });
    };
};
