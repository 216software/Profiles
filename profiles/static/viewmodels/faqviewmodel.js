"use strict";

function FAQViewModel (data) {

    var self = this;

    self.type = "FAQViewModel";
    self.rootvm = data.rootvm;
    self.parentvm = data.parentvm;

    self.tab = ko.observable();

    self.initialize = function(){
        console.log(self.tab());
        if(self.tab() == 'datasources'){
            self.show_data_sources(true);
        }
    };

    self.show_tell_me_more = ko.observable(false);
    self.show_data = ko.observable(false);
    self.show_data_sources = ko.observable(false);
    self.show_citedata = ko.observable(false);

};
