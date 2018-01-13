"use strict";

/* Got execute on enter from :
   http://stackoverflow.com/questions/23087721/call-function-on-enter-key-press-knockout-js

   bind like this

   data-bind="executeOnEnter: sendMessage, button : buttonSelector"
*/

function HealthViewModel (data) {

    var self = this;

    self.type = "HealthViewModel";
    self.rootvm = data.rootvm;

    self.parentvm = data.parentvm;
    self.location_uuid = ko.observable();
    self.initialize = function(){
        if(self.location_uuid()){
            self.parentvm.location_uuid(self.location_uuid());
        }
    };

    /* This should also include the order we want to display */
    self.indicator_titles = ['le', '_mort_rate','_infmort_rate',
        '_ebll_c'];

    self.ind_twonine = ['le', '_mort_rate' , '_infmort_rate'];
    self.ind_twoten= ['_ebll_c'];



    self.indicator_titles_extra_formatting = {
        'infmort_rate':'Rate per 1,000 births',
        'mort_rate':'Rate per 1,000 population',
        '_ebll_c':'Lead data provided by Ohio Department of Health. This should not be considered an endorsement of this study or these conclusions by the ODH.',
        'le': 'Life expectancy is calculated using the Life Expectancy Calculator created by Daniel Eayres published in the South East Public Health Observatory (SEPHO) website.'
    }

    self.overview_indicators = ['le'];


    self.indicators = ko.observableArray([]);

    self.csv_link =  ko.computed(function(){

        var base_url= "/api/indicator-categories-with-values-by-location-csv";
        base_url += '?location_uuid=' + self.location_uuid();
        base_url += '&page_title=Health';

        for(var i = 0; i<self.indicator_titles.length; i++)
        {
            base_url += '&indicators[]=' + self.indicator_titles[i];
        };
        return base_url;
    });


    self.parentvm.selected_location.subscribe(function(){
        self.parentvm.look_up_indicator_and_values(self.indicator_titles,
            self.look_up_indicator_complete);
    });

    self.extra_formatting = function(title){
        return self.indicator_titles_extra_formatting[title];
    };


    self.observable_timestamps = ko.observableArray([]);

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


    self.show_chart = {
        "_mort_rate": true,
        "_infmort_rate": true,
        "_ebll_c": true
    };
};
