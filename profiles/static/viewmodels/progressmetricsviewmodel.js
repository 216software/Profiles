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

    // Parameter location uuid -- set this on
    // the start page vm
    self.location_uuid = ko.observable();

    self.initialize = function(){

        console.log('progress metrics init');

        if(self.location_uuid()){
            self.parentvm.location_uuid(self.location_uuid());
        }
    };

    /* This should also include the order we want to display */
    self.indicator_titles = ['med_al_price', 'med_sfprice',
        'med_mfprice', 'med_cdprice', 'al_sales', 'sfsale',
        'mfsale', 'cdsale'];

    /* Do a separate look up for census */
    self.census_indicator_titles = ['_grent', 'cashrent', 'cvcashrent', '_medinc',
        'hhincls10k', 'hhinc10to15k', 'cvhhincls10k', 'cvhhinc10to15k',
        'hhinc15to25k', 'hhinc25to35k', 'cvhhinc15to25k', 'cvhhinc25to35k',
        'hhinc35to50k', 'hhinc50to75k',  'cvhhinc35to50k', 'cvhhinc50to75k',
        'hhinc75to100k', 'hhinc100to150k', 'cvhhinc75to100k', 'cvhhinc100to150k',
        'hhinc150to200k', 'hhinc200kp',  'cvhhinc150to200k', 'cvhhinc200kp',
        'bpv', 'tpv', 'mbpv_samehou', 'mbpv_diffhou',
        '_hhincls10k', '_hhinc10to15k',
        '_hhinc15to25k', '_hhinc25to35k',
        '_hhinc35to50k', '_hhinc50to75k', '_hhinc75to100k', '_hhinc100to150k',
        '_hhinc150to200k', '_hhinc200kp',

        'cv_hhincls10k', 'cv_hhinc10to15k',
        'cv_hhinc15to25k', 'cv_hhinc25to35k',
        'cv_hhinc35to50k', 'cv_hhinc50to75k',
        'cv_hhinc75to100k', 'cv_hhinc100to150k',
        'cv_hhinc150to200k', 'cv_hhinc200kp',

        'bpv','_bpv', 'tpv', '_tpv',
        'mbpv_samehou', 'mbpv_diffhou'
        ];

    self.sales_indicators = ['med_al_price', 'med_sfprice',
        'med_mfprice', 'med_cdprice', 'al_sales', 'sfsale',
        'mfsale', 'cdsale'];

    self.rental_indicators = ['_grent', 'cashrent'];

    self.income_indicators= ['_medinc', 'hhincls10k', '_hhincls10k',
        'hhinc10to15k', '_hhinc10to15k',
        'hhinc15to25k','_hhinc15to25k',
        'hhinc25to35k','_hhinc25to35k',
        'hhinc35to50k','_hhinc35to50k',
        'hhinc50to75k','_hhinc50to75k',
        'hhinc75to100k','_hhinc75to100k',
        'hhinc100to150k','_hhinc100to150k',
        'hhinc150to200k', '_hhinc150to200k',
        'hhinc200kp','_hhinc200kp'];

    self.poverty_indicators = ['bpv', '_bpv', 'tpv', 'mbpv_samehou', 'mbpv_diffhou'];

    self.indicator_cv_pairings = {'cashrent':'cvcashrent',
     'hhincls10k': 'cvhhincls10k',
     'hhinc10to15k': 'cvhhinc10to15k',
     'hhinc15to25k': 'cvhhinc15to25k',
     'hhinc25to35k':'cvhhinc25to35k',
     'hhinc35to50k': 'cvhhinc35to50k',
     'hhinc50to75k': 'cvhhinc50to75k',
     'hhinc75to100k': 'cvhhinc75to100k',
     'hhinc100to150k': 'cvhhinc100to150k',
     'hhinc150to200k': 'cvhhinc150to200k',
     'hhinc200kp':  'cvhhinc200kp',
     '_hhincls10k':'cv_hhincls10k',
     '_hhinc10to15k':'cv_hhinc10to15k',
     '_hhinc15to25k':'cv_hhinc15to25k',
     '_hhinc25to35k':'cv_hhinc25to35k',
     '_hhinc35to50k':'cv_hhinc35to50k',
     '_hhinc50to75k':'cv_hhinc50to75k',
     '_hhinc75to100k':'cv_hhinc75to100k',
     '_hhinc100to150k':'cv_hhinc100to150k',
     '_hhinc150to200k':'cv_hhinc150to200k',
     '_hhinc200kp':'cv_hhinc200kp',
     };

    self.overview_indicators_sales = ['med_al_price', '_grent'];
    self.overview_indicators_income = ['_medinc', 'bpv'];

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
