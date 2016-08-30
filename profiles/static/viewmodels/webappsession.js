"use strict";

function WebappSession (data) {

    var self = this;
    self.type = "WebappSession";
    self.rootvm = data.rootvm;

    self.session_uuid = ko.observable(data.session_uuid);
    self.person_uuid = ko.observable(data.person_uuid);
    self.expires = ko.observable(data.expires);

    self.session_last_checked = ko.observable();

    self.update_self = function (data) {

        if (data.session) {
            self.session_uuid(data.session.session_uuid);
            self.person_uuid(data.session.person_uuid);
            self.expires(data.session.expires);

        }

        else {
            self.session_uuid(null);
            self.person_uuid(null);
            self.expires(null);
        }

        self.user().update_self(data);

    };

    self.get_session_status = function () {

        self.rootvm.syslog("Checking session");

        return $.ajax({
            url: "/api/session",
            type: "GET",
            success: function (data) {

                self.session_last_checked(new Date());

                if (data.success) {
                    self.rootvm.syslog(data.message);
                    self.update_self(data);
                }
            }
        });

    };

    self.start_session = function () {

        self.rootvm.syslog("Starting session");

        return $.ajax({
            url: "/api/start-session",
            type: "POST",
            success: function (data) {
                if (data.success) {
                    self.update_self(data);
                }
            },
            complete: function () {
                self.rootvm.syslog("Started session");
            }
        });
    };

    self.user = ko.observable(new Person({rootvm: self.rootvm}));

    self.end_session = function () {

        self.rootvm.syslog("Ending session");

        return $.ajax({
            url: "/api/end-session",
            type: "POST",
            success: function (data) {

                if (data.success) {
                    self.rootvm.syslog(data.message);
                    toastr.success(data.message);
                    self.update_self(data);
                    self.user().navigate_here_after_login_success(null);
                    pager.navigate("login")

                }

            },

            complete: function () {
                self.rootvm.syslog("Ended session");
            }

        });
    };

};

WebappSession.prototype.toJSON = function () {

    var self = this;

    return {
        session_uuid: self.session_uuid(),
        person_uuid: self.person_uuid(),
        expires: self.expires(),
        user: self.user().toJSON()
    };

};


function Person (data) {

    var self = this;

    self.type = "Person";

    self.rootvm = data.rootvm;
    self.person_uuid = ko.observable(data.person_uuid);
    self.email_address = ko.observable(data.email_address);
    self.display_name = ko.observable(data.display_name);
    self.person_status = ko.observable(data.person_status);
    self.group_title = ko.observable(data.group_title);
    self.original_group_title = ko.observable(data.group_title);
    self.raw_password = ko.observable(data.raw_password);
    self.my_scan_report = data.my_scan_report;

    self.toJSON = function () {

        return {
            person_uuid: self.person_uuid(),
            email_address: self.email_address(),
            display_name: self.display_name(),
            password: self.raw_password()
        };

    };

    self.navigate_here_after_login_success = ko.observable();

    self.sign_in = function () {

        self.rootvm.syslog("Signing in");
        self.rootvm.is_busy(true);

        return $.ajax({
            url: "/api/login",
            type: "POST",

            contentType: "application/json; charset=utf-8",
            processData: false,

            data: ko.toJSON({
                email_address: self.email_address(),
                password: self.raw_password()
            }),

            dataType: "json",

            success: function (data) {

                if (data.success) {
                    toastr.success(data.message);
                    self.rootvm.webapp_session().update_self(data);
                    self.raw_password(null);

                    if (self.navigate_here_after_login_success()) {
                        pager.navigate(
                            self.navigate_here_after_login_success());
                    }

                } else {
                    toastr.error(data.message);
                }
            },

            complete: function () {
                self.rootvm.syslog("Finished sign in");
                self.rootvm.is_busy(false);
            }

        });
    };

    self.update_self = function (data) {

        if (data.session && data.session.user) {
            var d = data.session.user;
            self.person_uuid(d.person_uuid);
            self.email_address(d.email_address);
            self.display_name(d.display_name);
            self.group_title(d.group_title);
        } else {
            self.person_uuid(null);
            self.email_address(null);
            self.display_name(null);
            self.group_title(null);
        }

    };

    self.forgot_password = ko.observable(false);

    self.forgot_password_label = ko.computed(function () {

        if (self.forgot_password()) {
            return "Go back to login screen";
        } else {
            return "Forgot password?";
        }

    });

    self.toggle_forgot_password = function () {
        self.forgot_password(!self.forgot_password());
    };

    self.reset_email_sent = ko.observable(false);

    self.change_status = function (new_status) {

        self.rootvm.syslog("Changing status of account");
        self.rootvm.is_busy(true);

        return $.ajax({
            url: "/api/change-status",
            type: "POST",
            contentType: "application/json; charset=utf-8",
            processData: false,

            data: ko.toJSON({
                new_status : new_status,
                person_uuid : self.person_uuid()
            }),

            complete: function (data) {
                self.rootvm.syslog("Changed status");
                self.rootvm.is_busy(false);
            },

            success: function (data) {
                if (data.success) {
                    self.person_status(data.person_status);
                    toastr.success(data.message);
                }
                else {
                    toastr.error(data.message);
                }
            }
        });
    }

    self.change_person_group = function() {

        self.rootvm.syslog("Changing status");
        self.rootvm.is_busy(true);

        return $.ajax({
            url: "/api/change-person-group",
            type: "POST",
            contentType: "application/json; charset=utf-8",
            processData: false,

            data: ko.toJSON({
                person_uuid: self.person_uuid(),
                new_group: self.group_title()
            }),

            complete: function () {
                self.rootvm.syslog("Updated group");
                self.rootvm.is_busy(false);
            },

            success: function (data) {
                if (data.success) {
                    toastr.success(data.message);
                    self.original_group_title(self.group_title());
                }
                else if (data.success == false && data.needs_to_log_in) {
                    toastr.error(data.message);
                    pager.navigate("login");
                }
                else {
                    toastr.error(data.message);
                }
            }
        });


    }

    self.send_reset_password_email = function () {

        self.rootvm.syslog("Sending email with password-reset link");
        self.rootvm.is_busy(true);

        return $.ajax({
            url: "/api/send-reset-password-email",
            type: "POST",
            contentType: "application/json; charset=utf-8",
            processData: false,

            data: ko.toJSON({
                email_address: self.email_address()
            }),

            complete: function () {
                self.rootvm.syslog("Sent password-reset email");
                self.rootvm.is_busy(false);
            },

            success: function (data) {
                if (data.success) {
                    toastr.success(data.message);
                    self.reset_email_sent(true);
                } else {
                    toastr.error(data.message);
                }
            }
        });
    };

    self.new_password1 = ko.observable();
    self.new_password2 = ko.observable();
    self.current_password = ko.observable();

    self.new_passwords_match = ko.computed(function () {

        var p1 = self.new_password1();
        var p2 = self.new_password2();

        if (!p1) {
            return false;
        }

        else {
            return p1 == p2;
        }

    });

    self.password_entropy = ko.computed(function () {

        // I'm doing this to make knockout understand that I depend on
        // new_password1.
        var p = self.new_password1();

        if (p === undefined || p === null) {
            return "";
        } else {
            return p.length;
        }
    });

    self.password_css = ko.computed(function () {
        var e = self.password_entropy();

        if (e == "") {
            return "";
        }

        else if (e < 5) {
            return "strong text-danger";
        }

        else if (e < 8) {
            return "text-info";
        }

        else {
            return "strong text-success";
        }

    });


    self.password_quality_label = ko.computed(function () {

        var e = self.password_entropy();

        if (e == "") {
            return "";
        }

        else if (e < 5) {
            return "bad password";
        }

        else if (e < 8) {
            return "OK password";
        }

        else {
            return "good password";
        }

    });


    self.reset_password = function () {

        if (!self.new_password1() || !self.new_password2()) {
            alert("Please fill out both boxes!");
        }

        else if (!self.new_passwords_match()) {
            alert("Looks like those passwords don't match!");


        } else {

            self.rootvm.syslog("Resetting password");
            self.rootvm.is_busy(true);

            return $.ajax({
                url: "/api/reset-password",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                processData: false,

                data: ko.toJSON({
                    payload: self.rootvm.payload(),
                    password: self.new_password1()
                }),

                complete: function () {
                    self.rootvm.syslog("Reset password");
                    self.rootvm.is_busy(false);
                },

                success: function (data) {
                    if (data.success) {
                        toastr.success(data.message);
                        pager.navigate("login");
                    } else {
                        toastr.error(data.message);
                    }
                }
            });
        }
    };

    self.update_password = function () {

        if (!self.new_passwords_match()) {
            toastr.error("Sorry, passwords don't match!");
            return;
        }

        else {

            self.rootvm.is_busy(true);
            self.rootvm.syslog("Updating password");

            return $.ajax({
                url: "/api/update-password",
                method: "POST",

                data: ko.toJSON({
                    current_password: self.current_password(),
                    new_password1: self.new_password1(),
                    new_password2: self.new_password2()
                }),

                contentType: "application/json; charset=utf-8",
                processData: false,

                complete: function () {
                    self.rootvm.is_busy(false);
                    self.rootvm.syslog("Updated password");
                },

                success: function (data) {

                    if (data.success) {
                        self.current_password(null);
                        self.new_password1(null);
                        self.new_password2(null);
                        toastr.success(data.message);
                    }

                    else {
                        toastr.error(data.message);
                    }

                }
            });
        };

    };

    self.initialize = function () {

        self.rootvm.check_login_status().then(function () {
            if (!self.rootvm.user_logged_in()) {
                pager.navigate("login")
            }
        });

    };

    self.show_mismatched_password_warning = ko.computed(function () {

        if (self.new_password1()
            && self.new_password2()
            && !self.new_passwords_match()) {
            return true;
        } else {
            return false;
        }
    });

    self.update_password_button_text = ko.computed(function () {
        if (self.rootvm && self.rootvm.is_busy()) {
            return 'Updating...';
        } else {
            return 'Update password';
        }
    });

    self.add_new_user_disable = ko.computed(function ()
    {
        if(self.display_name()  &&
           self.raw_password() &&
           self.email_address()){
            return false;
        }
        else{
            return true;
        }
    });

    self.save_new_user = function () {


        self.rootvm.is_busy(true);
        self.rootvm.syslog("Saving new person");

        return $.ajax({

            url:        "/api/insert-new-user",
            type:       "POST",
            dataType:   "json",

            contentType: "application/json; charset=utf-8",
            processData: false,

            data: ko.toJSON({
                display_name: self.display_name(),
                email_address: self.email_address(),
                raw_password: self.raw_password(),
                group_title: self.group_title()
            }),

            complete: function (jqXHR, s) {

                self.rootvm.is_busy(false);
                self.rootvm.syslog("Finished saving new user:" + s);
            },

            success: function (data) {

                if (data.success) {

                    toastr.success(data.message);

                    pager.navigate('/');
                }

                else {
                    toastr.error(data.message);
                }
            }
        });

    };

    self.reset_new_user_form = function () {

        self.display_name(null);
        self.email_address(null);
        self.raw_password(null);
        self.group_title(null);
    };


};
