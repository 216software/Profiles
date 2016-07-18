function AlbumsViewModel (data) {

    var self = this;
    self.type = "AlbumsViewModel";
    self.rootvm = data.rootvm;

    self.offset = ko.observable(data.offset);
    self.limit = ko.observable(data.limit);
    self.total_count = ko.observable();
    self.filtered_count = ko.observable();

    self.sorts = ko.observableArray(['desc', 'asc']);
    self.selected_sort = ko.observable('desc');

    self.initialize = function () {
        self.rootvm.webapp_session().user().navigate_here_after_login_success("albums");

        // I want to figure out a better way of doing this.
        self.rootvm.check_login_status().then(function () {
            if (!self.rootvm.user_logged_in()) {
                toastr.error("You have to log in first!");
                pager.navigate("login");
            }
            else {
                 self.get_albums()
            }
        });

    };

    self.next_button_visible = ko.computed(function() {
        return parseInt(self.offset()) + parseInt(self.limit()) < self.filtered_count();
    });

    self.previous_button_visible = ko.computed(function () {
        return parseInt(self.offset()) > 0;
    });

    self.go_left = function () {

        if (self.rootvm.is_busy()){
            return false;}

        self.offset(parseInt(self.offset()) - parseInt(self.limit()));

        self.get_albums().then(function(){
            pager.navigate("#containers/"
                + pager.activePage$().id()
                + "&selected_sort="
                + self.selected_sort());
        });
    };

    self.go_right = function () {

        if (self.rootvm.is_busy()){
            return false;}

        self.offset(parseInt(self.offset()) + parseInt(self.limit()));
        self.get_containers().then(function(){
            pager.navigate("#containers/"
                + pager.activePage$().id()
                + "?offset="
                + self.offset()
                + "&limit="
                + self.limit()
                + "&selected_sort="
                + self.selected_sort());
        });
    };


    /* Use these for pretty labels on our pager */
    self.lower_count_label = ko.computed(function(){
        return parseInt(self.offset()) + 1;
    });

    self.upper_count_label = ko.computed(function(){
        if (parseInt(self.limit()) + parseInt(self.offset()) > self.filtered_count())
        {
            return self.filtered_count();
        }
        else
        {
            return parseInt(self.limit()) + parseInt(self.offset());
        }
    });

    self.albums = ko.observableArray([]);

    self.paging_visible = ko.computed(function () {
        return self.filtered_count() > 0;
    });

    self.get_albums = function () {

        self.rootvm.is_busy(true);
        self.rootvm.syslog("Getting albums");

        return $.ajax({
            url: '/api/albums',
            type: "GET",

            data: {
                offset: self.offset(),
                limit: self.limit(),
                sort_direction: self.selected_sort(),
            },

            complete: function (a, s) {
                self.rootvm.is_busy(false);
                self.rootvm.syslog("Finished getting albums: " + s);
            },

            success: function (data) {

                if (data.success) {
                    self.total_count(data.total_count);
                    self.albums(ko.utils.arrayMap(
                        data.albums,
                        function (d) {
                            d.rootvm = self.rootvm;
                            console.log(d);
                            a = new Album(d);
                            return a;
                        }));
                }
                else {
                    toastr.error(data.message);
                }
            },
            error: function(data){
                toastr.error('Something\'s broken. It\'s not you, it\'s me!');
            }
        });
    };
};
