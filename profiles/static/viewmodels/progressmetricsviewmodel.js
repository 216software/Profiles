"use strict";

/* Got execute on enter from :
   http://stackoverflow.com/questions/23087721/call-function-on-enter-key-press-knockout-js

   bind like this

   data-bind="executeOnEnter: sendMessage, button : buttonSelector"
*/

function ProgressMetricsViewModel (data) {

    var self = this;

    self.type = "ProgressMetricsViewModel";
    self.rootvm = data.rootvm;
    self.parentvm = data.parentvm;

    /* This should also include the order we want to display */
    self.indicator_titles = ['med_al_price', 'med_sfprice',
        'med_fprice', 'med_cdprice', 'al_sales', 'sfsale',
        'mfsale', 'cdsale'];

    /* Do a separate look up for census */
    self.census_indicator_titles = ['_grent', 'cashrent', 'cvcashrent',
        'hhincls10k', 'hhinc10to15k',
        'hinc15to25k', 'hinc25to35',
        'hhinc35to50k', 'hhinc50to75k', 'hinc75to100k', 'hinc100to150k',
        'hhinc35to50k', 'hhinc50to75k', 'hinc75to100k', 'hinc100to150k',
        'hhinc150to200k', 'hhinc200kp'];

    self.sales_indicators = ['med_al_price', 'med_sfprice',
        'med_fprice', 'med_cdprice', 'al_sales', 'sfsale',
        'mfsale', 'cdsale'];

    self.rental_indicators = ['_grent', 'cashrent', 'hhincls10k', 'hhinc10to15k',
        'hinc15to25k', 'hinc25to35',
        'hhinc35to50k', 'hhinc50to75k', 'hinc75to100k', 'hinc100to150k',
        'hhinc35to50k', 'hhinc50to75k', 'hinc75to100k', 'hinc100to150k',
        'hhinc150to200k', 'hhinc200kp'];



    self.indicator_cv_pairings = {'cashrent':'cvcashrent'};

    self.indicators = ko.observableArray([]);

    self.parentvm.selected_location.subscribe(function(){
        self.parentvm.look_up_indicator_and_values(self.indicator_titles,
            self.look_up_indicator_complete);

        self.parentvm.look_up_indicator_and_values(self.census_indicator_titles,
            self.look_up_census_indicator_complete);
    });

    self.observable_timestamps = ko.observableArray([]);
    self.observable_timestamps_census = ko.observableArray([]);

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


    /* Census has less time stamps -- I make separte observables for the
     * census values -- probably could filter in javascript land
     * but this seems faster */
    self.look_up_census_indicator_complete = function(data){

        console.log('got the census stuff');

        self.observable_timestamps_census(ko.utils.arrayMap(
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
        }

    };

};
