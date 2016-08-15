"use strict";

function StabilizationViewModel (data) {

    var self = this;

    self.type = "StabilizationViewModel";
    self.rootvm = data.rootvm;
    self.parentvm = data.parentvm;

    self.initialize = function(){
        console.log('initing ', self.type);
    };

    /* This should also include the order we want to display */
    self.indicator_titles = ['res_occ', '_res_occ',
        'hsg_den', 'f',
        'shf',
        'distress', '_distress',
        'ntal_sales', '_ntal_sales',
        'med_ntal_price'];

    self.indicator_titles_extra_formatting = {
        'hsg_den':'*', 'distress':'**',
        'ntal_sales':'***'
    }

    self.overview_indicators = ['res_occ']

    self.indicators = ko.observableArray([]);

    self.extra_formatting = function(title){
        return self.indicator_titles_extra_formatting[title];
    };

    self.parentvm.selected_location.subscribe(function(){
        self.parentvm.look_up_indicator_and_values(self.indicator_titles,
            self.look_up_indicator_complete);
    });

    self.observable_timestamps = ko.observableArray([]);

    self.look_up_indicator_complete = function(data){

        console.log('look_up_indicator complete');

        console.log(data);

        self.observable_timestamps(ko.utils.arrayMap(
            data.distinct_observable_timestamps || [],
            function(x){
                return new moment(x.observation_timestamp);
            }
        ));

        self.indicators(ko.utils.arrayMap(
            data.indicator_values || [],
            function (x) {
                x.indicator.rootvm = self.rootvm;
                x.indicator.indicator_values = x.indicator_values;
                return new Indicator(x.indicator);
            }));

    };
};
