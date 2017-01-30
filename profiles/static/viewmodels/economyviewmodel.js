"use strict";

function EconomyViewModel (data) {

    var self = this;

    self.type = "EconomyViewModel";
    self.rootvm = data.rootvm;

    self.parentvm = data.parentvm;
    self.location_uuid = ko.observable();

    self.initialize = function(){
        if(self.location_uuid()){
            self.parentvm.location_uuid(self.location_uuid());
        }
    };

    /* This should also include the order we want to display */
    self.indicator_titles = ['alljobs'];

    self.overview_indicators = ['alljobs'];
    self.commercial_indicators = ['_bus_occ']

    self.indicators = ko.observableArray([]);

    self.csv_link =  ko.computed(function(){

        var base_url= "/api/indicator-categories-with-values-by-location-csv";
        base_url += '?location_uuid=' + self.location_uuid();
        base_url += '&page_title=Economy';

        for(var i = 0; i<self.indicator_titles.length; i++)
        {
            base_url += '&indicators[]=' + self.indicator_titles[i];
        };
        return base_url;
    });



    self.parentvm.selected_location.subscribe(function(){
        self.parentvm.look_up_indicator_and_values(self.indicator_titles,
            self.look_up_indicator_complete);

        self.parentvm.look_up_indicator_and_values(self.commercial_indicators,
            self.look_up_commercial_indicator_complete);

    });

    self.observable_timestamps = ko.observableArray([]);
    self.observable_timestamps_commercial = ko.observableArray([]);

    self.look_up_indicator_complete = function(data){

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

    /* Commercial has less time stamps -- I make separte observables for the
     * commercial values -- probably could filter in javascript land
     * but this seems faster */
    self.look_up_commercial_indicator_complete = function(data){

        console.log(data);

        self.observable_timestamps_commercial(ko.utils.arrayMap(
            data.distinct_observable_timestamps || [],
            function(x){
                return new moment(x.observation_timestamp);
            }
        ));

        self.indicators.push.apply(self.indicators, ko.utils.arrayMap(
            data.indicator_values || [],
            function (x) {
                x.indicator.rootvm = self.rootvm;
                x.indicator.indicator_values = x.indicator_values;
                return new Indicator(x.indicator);
            }));

        for (var indicator_key in self.indicator_cv_pairings) {
            var ind = Indicator.indicator_by_title(self.indicators(), indicator_key)
            var ind_cv = Indicator.indicator_by_title(self.indicators(),
                self.indicator_cv_pairings[indicator_key])
            ind.indicator_CV(ind_cv);

            var ind_moe = Indicator.indicator_by_title(self.indicators(),
                self.indicator_moe_pairings[indicator_key])
            ind.indicator_MOE(ind_moe);

        }

    };


};
