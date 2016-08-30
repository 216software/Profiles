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
    self.indicator_titles = ['mort_rate2009','infmort_rate2009', 'le2009',
        '_ebll_c'];

    self.indicator_titles_extra_formatting = {
        'infmort_rate2009':'Rate per 1,000 births',
        'mort_rate2009':'Rate per 1,000 population',
        '_ebll_c':'Lead data provided by Ohio Department of Health. This should not be considered an endorsement of this study or these conclusions by the ODH.',
        'le2009': 'Life expectancy is calculated using the Life Expectancy Calculator created by Daniel Eayres published in the South East Public Health Observatory (SEPHO) website.'
    }

    self.overview_indicators = ['le2009'];


    self.indicators = ko.observableArray([]);

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
};
