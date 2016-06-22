"use strict";

function UserAdminViewModel (data){

    var self = this;
    self.type = "UserAdminViewModel";
    self.rootvm = data.rootvm;

    self.people = ko.observableArray([]);
    self.total_count = ko.observable();

    self.active_users = ko.computed(function () {

        return ko.utils.arrayFilter(
            self.people(),
            function (u) {
                return u.person_status() != "deactivated";
            });
    });

    self.deactivated_users = ko.computed(function () {
        return ko.utils.arrayFilter(
            self.people(),
            function (u) {
                return u.person_status() == "deactivated";
            });
    });

    self.scanners_with_trucks = ko.observableArray([]);

    self.initialize = function()
    {
      self.get_group_titles().then(self.get_all_people());
    }

    self.addUserInitialize = function()
    {

        // Do nothing for now
    }


    self.new_user = ko.observable(new Person({rootvm: self.rootvm}));

    self.groups = ko.observableArray();

    self.get_group_titles = function () {

        self.rootvm.is_busy(true);
        self.rootvm.syslog("Getting group titles sizes");

        return $.ajax({
            url: "/api/group-titles",
            type: "GET",
            dataType: "json",
            complete: function () {
                self.rootvm.is_busy(false);
                self.rootvm.syslog("Finished getting container sizes");
            },
            success: function (data) {
                if (data.success == true)
                {
                    self.groups(data.groups);
                }
                else if (data.success == false && data.needs_to_log_in) {
                    toastr.error(data.message);
                    pager.navigate("login");
                }
                else {
                    toastr.error(data.message);
                    pager.navigate("login");
                }
            }

        });
    }


    self.send_password_forget_email = function(person)
    {
       person.send_reset_password_email();
    }

    self.toggle_status = function(person)
    {
        person.person_status() == 'confirmed' ? person.change_status('deactivated') : person.change_status('confirmed');
    }

    self.api_address = ko.observable();

    self.get_all_people = function()
    {

        self.rootvm.syslog("Loading users");
        self.rootvm.is_busy(true);

        return $.ajax({
            url:"/api/all-users",
            type: "GET",
            data:{},

            complete: function(){
                self.rootvm.is_busy(false);
                self.rootvm.syslog("Loaded all users");
            },

            success: function (data){

                if (data.success){

                    self.total_count(data.count);
                    self.api_address(data.api_address);

                    self.people(
                        ko.utils.arrayMap(
                            data.people,
                            function (p) {

                              p.rootvm = self.rootvm;
                              var person = new Person(p);
                              return person;

                            }));

                    return true;
                }

                else if (data.success == false && data.needs_to_log_in){
                    toastr.error(data.message);
                    pager.navigate("login")
                    return false;
                }
            }

        });
    }

}
