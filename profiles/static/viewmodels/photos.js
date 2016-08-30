var xhr_with_progress = function () {
    var xhr = new window.XMLHttpRequest();
    xhr.upload.addEventListener("progress",
        function(evt) {
            if (!evt.lengthComputable) return;
            var percentComplete = evt.loaded / evt.total;
            $("#progress-bar div.progress-bar").css('width', String(100*percentComplete) + "%");
        }, false);
    return xhr;
};


function PhotoUploadObject (data) {

    var self = this;
    self.type= "PhotoUploadObject"
    self.rootvm = data.rootvm;
    self.parentvm = ko.observable(data.parentvm);

    self.upload_url = ko.observable(data.upload_url);
    self.upload_filename = ko.observable(data.upload_filename);

    /* If we use a file reader, read into this */
    self.local_source = ko.observable();

    self.photo_type = ko.observable(data.photo_type);
    self.photo_type_uuid = ko.observable(data.photo_type_uuid);

    self.photo_uuid = ko.observable();

    self.cloudfile_container_name = ko.observable();
    self.upload_progress = ko.observable(0);

    self.finishing = ko.observable(false);

    self.width = ko.observable(0);
    self.height = ko.observable(0);

    self.upload_progress_ratio = ko.computed(function() {
        return self.upload_progress() + '/1';
    });

    self.download_url = ko.observable(null);
    self.original_filename = ko.observable(null);
    self.mimetype = ko.observable(null);

    self.description = ko.observable();


    self.pretty_download_href = ko.computed(function () {
        return self.download_url() + "&filename=" + encodeURIComponent(self.original_filename());
    });

    self.uploaded_file = ko.observable(null);
    self.is_uploading = ko.observable(false);
    self.file = ko.observable(null);

    self.xhr_with_progress = function() {{
        var xhr = new window.XMLHttpRequest();
        xhr.upload.addEventListener("progress",
            function(evt) {{
                if (!evt.lengthComputable) return;
                var percentComplete = evt.loaded / evt.total;
                self.upload_progress(percentComplete);
            }}, false);
        return xhr;
    }};


    /* We can read into memory so that we can get at the
       local source
    */
    self.read_local_source = function(){
        // TODO We might not want to do this if the
        // file is too large...
        var fr = new FileReader();
        //First read as data url
        fr.onload = function (file_data) {
            //Make thumbnail show up
            self.local_source(file_data.target.result);
        }

        fr.readAsDataURL(self.file());
    };



    self.start_tracking_file_upload = function (file) {

        self.rootvm.syslog("tracking file upload start");

        return $.ajax({
            url: "/api/track-upload-start",
            type: "POST",
            data: ko.toJSON({
                photo_type_uuid: self.photo_type_uuid(),
                container_name: self.cloudfile_container_name(),
                upload_filename: self.upload_filename(),
                original_filename: self.file().name,
                mimetype: self.file().type,
                uploaded_by_name: self.parentvm().uploaded_by_name()
            }),
            contentType: "application/json; charset=utf-8",
            processData: false,
            success: function (data) {
                self.rootvm.syslog("tracked the upload start");
                self.photo_uuid(data.photo_uuid);
            }
        });

    };

    self.finish_tracking_file_upload = function () {

        self.rootvm.syslog("tracking upload finish");

        self.finishing(true);

        return $.ajax({
            url: "/api/track-upload-finish",
            type: "POST",
            data: ko.toJSON({
                upload_filename: self.upload_filename(),
                photo_uuid: self.photo_uuid(),
                photo_type_uuid: self.photo_type_uuid(),
                photo_type: self.photo_type(),
                description: self.description()

            }),
            contentType: "application/json; charset=utf-8",
            processData: false,

            complete: function (o, s) {
                self.rootvm.syslog("tracked the upload finish: " + s);
                self.file(null);
                self.upload_progress(0);
                self.finishing(false);

                if (s != "success") {
                    toastr.error("Sorry, something went wrong!");
                }
            },

            success: function (data) {

                self.parentvm().photos.push(
                   new Photo(data.photo));
            }
        });
    };

    self.upload_file = function () {

        self.rootvm.syslog("uploading file to cloud storage");

        self.is_uploading(true);

        return $.ajax({
            xhr: self.xhr_with_progress,

            url: self.upload_url(),
            type: 'PUT',
            data: self.file(),
            cache: false,
            contentType: false,
            processData: false,

            success: function (data) {
                self.rootvm.is_busy(false);
                self.is_uploading(false);
                self.upload_url(null);
            },

            error: function (data) {
                toastr.error(data);
            }
        });
    };


}

function Photo(data){
    var self = this;

    self.photo_uuid = data.photo_uuid
    self.container = data.container
    self.cdn_url = ko.observable(data.cdn_url);
    self.description = ko.observable(data.description);
    self.old_description= ko.observable(data.description);


    self.original_filename = data.original_filename
    self.mimetype = data.mimetype
    self.width = data.width
    self.height = data.height

    self.thumbnail_cdn_url = ko.observable(data.thumbnail_cdn_url);
    self.thumbnail_uuid = data.thumbnail_uuid
    self.thumbnail_width = data.thumbnail_width
    self.thumbnail_height = data.thumbnail_height

    self.web_optimized_cdn_url = data.web_optimized_cdn_url;
    self.web_optimized_uuid = data.web_optimized_uuid
    self.web_optimized_width = data.web_optimized_width
    self.web_optimized_height = data.web_optimized_height


    self.uploaded_by = data.uploaded_by
    // If uploaded_by is a uuid, then the display name is the name
    self.uploaded_by_display_name = data.uploaded_by_display_name;

    self.uploaded_by_name = ko.observable(data.uploaded_by_name);
    self.upload_finished = data.upload_finished
    self.thumbs_finished = data.thumbs_finished
    self.removed = data.removed

    self.thumbnail_url = ko.computed(function(){
        if (self.thumbnail_cdn_url() !== undefined){
            return self.thumbnail_cdn_url();
        }
        else{
            return self.cdn_url();
        }
    });

    self.allow_description_save = ko.computed(function(){

        return self.old_description() != self.description();
    });


    self.update_description = function(){

        return $.ajax({
            url: "/api/update-photo-description",
            type: "POST",
            data: ko.toJSON({
                photo_uuid: self.photo_uuid,
                description: self.description(),
            }),
            contentType: "application/json; charset=utf-8",
            processData: false,
            success: function (data) {
                self.old_description(self.description());
                self.rootvm.syslog("updated description");
            }
        });
    }


}

function PhotoCollection(data) {

    var self = this;
    self.type = "PhotoCollection";

    self.rootvm = data.rootvm;

    self.photo_type = ko.observable(data.photo_type);
    self.photo_type_uuid = ko.observable(data.photo_type_uuid);

    self.photos = ko.observableArray(
            ko.utils.arrayMap(
                data.photos || [],
                function (x) {
                    x.rootvm = self.rootvm;
                    return new Photo(x);
    }));

    self.set_photos = function(photos){
        self.photos(
            ko.utils.arrayMap(
                photos,
                function (x) {
                    x.rootvm = self.rootvm;
                    return new Photo(x);
                }
        ));
    };


    /* Right now we load all of the photos --
     * so this is a count of how many are in the array -
     * think about doing filtering in the future? */
    self.num_photos = ko.computed(function(){
        return self.photos().length;
    });

    self.getting_upload_url = ko.observable(false);
    self.upload_files_data = ko.observableArray([]);

    self.uploaded_by_name = ko.observable(data.uploaded_by_name);
    self.show_upload_picker = ko.observable(false);

    self.files_uploaded_but_not_finished  = ko.computed(function(){

        return ko.utils.arrayFilter(self.upload_files_data(), function(d){
            return d.file() != null &&
                d.finishing() == false &&
                d.upload_url() == null;
        })
    });

    self.cloudfile_container_name = ko.observable();

    self.start_ajax_upload = function (me, evt) {

        self.rootvm.is_busy(true);
        self.show_upload_picker(false);

        self.files = evt.target.files;

        for(var i = 0; i < evt.target.files.length; i++)
        {
            var file_upload = self.upload_files_data()[i];
            file_upload.file(evt.target.files[i]);

            file_upload.photo_type_uuid(self.photo_type_uuid());
            file_upload.cloudfile_container_name(self.cloudfile_container_name());

            file_upload.read_local_source();

            file_upload.start_tracking_file_upload()
            .then(file_upload.upload_file);
            //.then(file_upload.finish_tracking_file_upload);
        }
    };

    // beginning of pasted-in peppershelf code
    self.get_upload_urls = function () {

        self.rootvm.is_busy(true);
        self.getting_upload_url(true);
        self.rootvm.syslog("Requesting upload URL");

        return $.ajax({
            url: "/api/upload-url",
            type: "GET",
            dataType:'json',

            data: {
                number_urls: 10,
                photo_type: self.photo_type()
            },

            complete: function (o, s) {
                self.rootvm.is_busy(false);
                self.getting_upload_url(false);
                self.rootvm.syslog("Retrieved upload URL:" + s);

                if (s != "success") {
                    toastr.error("Sorry, something went wrong!");
                }
            },

            success: function (data) {

                if (data.success) {

                    self.upload_files_data(ko.utils.arrayMap(
                        data.upload_files,
                        function (d) {
                          var puo = new PhotoUploadObject(d);
                          puo.photo_type(self.photo_type());
                          puo.rootvm = self.rootvm;
                          puo.parentvm(self);
                          return puo;
                        }));

                    self.cloudfile_container_name(data.cloudfile_container_name);
                    self.show_upload_picker(true);

                }

                else {
                    toastr.error(data.message);
                }
            }
        });

    };

    self.uploaded_file = ko.observable(null);

    self.removephoto = function(photo_uuid, element){

        return $.ajax({
            url: "/api/remove-photo",
            type: "POST",
            data: ko.toJSON({
                photo_uuid: photo_uuid,
            }),
            contentType: "application/json; charset=utf-8",
            processData: false,

            complete: function (o, s) {
                self.rootvm.syslog("removed the photo: " + s);

                if (s != "success") {
                    toastr.error("Sorry, something went wrong!");
                }
            },
            success: function (data) {
                self.photos.remove(function(photo) {
                    return photo.photo_uuid == data.photo_uuid;
                });

                self.upload_files_data.remove(function(upload_object){
                    return upload_object.photo_uuid() == data.photo_uuid;
                });
            }
        });


    };

    self.hidePhoto = function(elem) {
        if (elem.nodeType === 1) $(elem).fadeOut()
    }

    self.galleryItems = ko.computed(function(){

        galleryItems = ko.utils.arrayMap(
            self.photos() || [],
            function (photo) {
               return {'src':photo.web_optimized_cdn_url,
                       'w':photo.web_optimized_width,
                       'h':photo.web_optimized_height,
                       title:photo.description() ? photo.description() : null,
                       author:(photo.uploaded_by_display_name ?
                          photo.uploaded_by_display_name : photo.uploaded_by_name())};

            });

        return galleryItems;
    });

    self.showGalleryClick = function(photo, event){

        event.stopImmediatePropagation();

        var pswpElement = document.querySelectorAll('.pswp')[0];

        // define options (if needed)
        var options = {
            // optionName: 'option value'
            // for example:
            index: self.photos().indexOf(photo), // start at clicked slide
            mainClass : 'pswp--minimal--dark',
            barsSize : {top:0,bottom:0},
            captionEl : true,
            fullscreenEl : true,
            shareEl : false,
            bgOpacity : 0.95,
            tapToClose : true,
            tapToToggleControls : false,
            showHideOpacity: true,

            getThumbBoundsFn: function(index) {
                // See Options -> getThumbBoundsFn section of documentation for more info
                    var thumbnail = event.target; // find thumbnail
                    pageYScroll = window.pageYOffset || document.documentElement.scrollTop;
                    rect = thumbnail.getBoundingClientRect();

                return {x:rect.left, y:rect.top + pageYScroll, w:rect.width};
            },
            addCaptionHTMLFn: function(item, captionEl, isFake) {

                        /* If we only have an author, then update the
                         * title */
                        if(!item.title && item.author){
                            item.title = 'Photo: ' + item.author
                            item.author = undefined
                        }

                        if(!item.title && !item.author) {
                            captionEl.children[0].innerText = '';
                            return false;
                        }
                        if(item.title && item.author){
                            captionEl.children[0].innerHTML = item.title +  '<br/><small>Photo: ' + item.author + '</small>';
                        }
                        if(item.title && !item.author){
                            captionEl.children[0].innerHTML = item.title;
                        }
                        return true;
            },

        };

        // Initializes and opens PhotoSwipe
        var gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, self.galleryItems(),
            options);
        gallery.init();

        return false;
    };
};

