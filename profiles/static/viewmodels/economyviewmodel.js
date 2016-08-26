"use strict";

function EconomyViewModel (data) {

    var self = this;

    self.type = "EconomyViewModel";
    self.rootvm = data.rootvm;

    self.parentvm = data.parentvm;
    self.location_uuid = ko.observable();

    self.initialize = function(){
        console.log('initing ', self.type);
        if(self.location_uuid()){
            self.parentvm.location_uuid(self.location_uuid());
        }
    };

    /* This should also include the order we want to display */
    self.indicator_titles = ['alljobs' ,'_bus_occ'];

    self.overview_indicators = ['alljobs'];

    self.indicators = ko.observableArray([]);

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
                console.log(x.indicator);
                return new Indicator(x.indicator);
            }));

    };

};
