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

        if(self.location_uuid()){
            self.parentvm.location_uuid(self.location_uuid());
        }
    };

    /* This should also include the order we want to display */
    self.indicator_titles = ['med_al_price', 'med_sfprice',
        'med_mfprice', 'med_cdprice', 'al_sales', 'sfsale',
        'mfsale', 'cdsale'];

    /* Do a separate look up for census */
    self.census_indicator_titles = ['_grent', 'm_grent', 'cv_grent',
        'cashrent', 'cvcashrent',  'mcashrent',
        '_medinc', 'cv_medinc', 'm_medinc',


        'hhincls10k', 'hhinc10to15k', 'cvhhincls10k', 'cvhhinc10to15k',
        'hhinc15to25k', 'hhinc25to35k', 'cvhhinc15to25k', 'cvhhinc25to35k',
        'hhinc35to50k', 'hhinc50to75k',  'cvhhinc35to50k', 'cvhhinc50to75k',
        'hhinc75to100k', 'hhinc100to150k', 'cvhhinc75to100k', 'cvhhinc100to150k',
        'hhinc150to200k', 'hhinc200kp',  'cvhhinc150to200k', 'cvhhinc200kp',

        'mhhincls10k', 'mhhinc10to15k',
        'mhhinc15to25k', 'mhhinc25to35k',
        'mhhinc35to50k', 'mhhinc50to75k',
        'mhhinc75to100k', 'mhhinc100to150k',
        'mhhinc150to200k', 'mhhinc200kp',


        '_hhincls10k', '_hhinc10to15k',
        '_hhinc15to25k', '_hhinc25to35k',
        '_hhinc35to50k', '_hhinc50to75k', '_hhinc75to100k', '_hhinc100to150k',
        '_hhinc150to200k', '_hhinc200kp',

        'cv_hhincls10k', 'cv_hhinc10to15k',
        'cv_hhinc15to25k', 'cv_hhinc25to35k',
        'cv_hhinc35to50k', 'cv_hhinc50to75k',
        'cv_hhinc75to100k', 'cv_hhinc100to150k',
        'cv_hhinc150to200k', 'cv_hhinc200kp',

        'm_hhincls10k', 'm_hhinc10to15k',
        'm_hhinc15to25k', 'm_hhinc25to35k',
        'm_hhinc35to50k', 'm_hhinc50to75k',
        'm_hhinc75to100k', 'm_hhinc100to150k',
        'm_hhinc150to200k', 'm_hhinc200kp',

        'bpv','_bpv', 'cvbpv', 'mbpv', 'cv_bpv',
        'm_bpv',
        'tpv', '_tpv', 'cvtpv', 'mtpv', 'm_tpv', 'cv_typv',
        'bpv_samehou', 'bpv_diffhou',
        'mbpv_samehou', 'mbpv_diffhou',
        'cvbpv_samehou', 'cvbpv_diffhou',

        '_bpv_samehou', '_bpv_diffhou',
        'm_bpv_samehou', 'm_bpv_diffhou',
        'cv_bpv_samehou', 'cv_bpv_diffhou'

        ];

    self.sales_indicators = ['med_al_price', 'med_sfprice',
        'med_mfprice', 'med_cdprice', 'al_sales', 'sfsale',
        'mfsale', 'cdsale'];

    self.rental_indicators = ['_grent', 'cashrent'];

    self.housing_cost_burden_indicators = [
        "t_cburden30p",
        "_t_cburden30p",
        "t_cburden50p",
        "_t_cburden50p",
        "t_ocburden30p",
        "_t_ocburden30p",
        "t_rcburden30p",
        "_t_rcburden30p",
        "t_ocburden50p",
        "_t_ocburden50p",
        "t_rcburden50p",
        "_t_rcburden50p",

    ];

    // The array.concat method doesn't alter the first array, just
    // returns a new one.
    self.census_indicator_titles = self.census_indicator_titles.concat(
        self.housing_cost_burden_indicators);

    /*

    Housing costs >30% of household income, number
    Housing costs >30% of household income, percent
    Housing costs >50% of household income
    Housing costs >50% of household income, percent
    Owner-occupied housing costs >30%, number t_ocburden30p
    Owner-occupied housing costs >30%, percent
    Renter-occupied housing costs>30%, number
    Renter-occupied housing costs>30%, percent
    Owner-occupied housing costs >50%, number
    Owner-occupied housing costs >50%, percent
    Renter-occupied housing costs>50%, number
    Renter-occupied housing costs>50%, percent"

    */

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

    self.poverty_indicators = ['bpv', '_bpv', 'tpv', 'bpv_samehou',
        '_bpv_samehou', 'bpv_diffhou', '_bpv_diffhou'];

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
     '_medinc': 'cv_medinc',
     '_grent': 'cv_grent',
     'bpv': 'cvbpv',
     '_bpv': 'cv_bpv',
     'tpv': 'cvtpv',
     'bpv_samehou':'cvbpv_samehou',
     'bpv_diffhou':'cvbpv_diffhou',
     '_bpv_samehou':'cv_bpv_samehou',
     '_bpv_diffhou':'cv_bpv_diffhou',
     };

    self.indicator_moe_pairings = {'cashrent':'mcashrent',
     'hhincls10k': 'mhhincls10k',
     'hhinc10to15k': 'mhhinc10to15k',
     'hhinc15to25k': 'mhhinc15to25k',
     'hhinc25to35k':'mhhinc25to35k',
     'hhinc35to50k': 'mhhinc35to50k',
     'hhinc50to75k': 'mhhinc50to75k',
     'hhinc75to100k': 'mhhinc75to100k',
     'hhinc100to150k': 'mhhinc100to150k',
     'hhinc150to200k': 'mhhinc150to200k',
     'hhinc200kp':  'mhhinc200kp',
     '_hhincls10k':'m_hhincls10k',
     '_hhinc10to15k':'m_hhinc10to15k',
     '_hhinc15to25k':'m_hhinc15to25k',
     '_hhinc25to35k':'m_hhinc25to35k',
     '_hhinc35to50k':'m_hhinc35to50k',
     '_hhinc50to75k':'m_hhinc50to75k',
     '_hhinc75to100k':'m_hhinc75to100k',
     '_hhinc100to150k':'m_hhinc100to150k',
     '_hhinc150to200k':'m_hhinc150to200k',
     '_hhinc200kp':'m_hhinc200kp',
     '_medinc': 'm_medinc',
     '_grent': 'm_grent',
     'bpv': 'mbpv',
     '_bpv': 'm_bpv',
     'tpv': 'mtpv',
     'bpv_samehou':'mbpv_samehou',
     'bpv_diffhou':'mbpv_diffhou',
     '_bpv_samehou':'m_bpv_samehou',
     '_bpv_diffhou':'m_bpv_diffhou',


     };

    // add some stuff dynamically.
    $.each(self.housing_cost_burden_indicators, function (index, value) {
        var cv_indicator = "cv" + value;
        var moe_indicator = "m" + value;
        self.indicator_cv_pairings[value] = cv_indicator;
        self.indicator_moe_pairings[value] = moe_indicator;
        self.census_indicator_titles.push(cv_indicator);
        self.census_indicator_titles.push(moe_indicator);
    });

    self.overview_indicators_sales = ['med_al_price'];
    self.overview_indicators_sales_2nd_table = ['_grent'];
    self.overview_indicators_income = ['_medinc', 'bpv'];

    self.indicators = ko.observableArray([]);

    self.csv_link =  ko.computed(function(){

        var base_url= "/api/indicator-categories-with-values-by-location-csv";
        base_url += '?location_uuid=' + self.location_uuid();
        base_url += '&page_title=ProgressMetrics';

        for(var i = 0; i<self.indicator_titles.length; i++)
        {
            base_url += '&indicators[]=' + self.indicator_titles[i];
        };

        for(var i = 0; i<self.census_indicator_titles.length; i++)
        {
            base_url += '&indicators[]=' + self.census_indicator_titles[i];
        };
        return base_url;
    });



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

            var ind_moe = Indicator.indicator_by_title(self.indicators(),
                self.indicator_moe_pairings[indicator_key])
            ind.indicator_MOE(ind_moe);

        }

    };

    self.show_sales_data = ko.observable(false);

    self.toggle_sales_data = function () {
        self.show_sales_data(!self.show_sales_data());
    };

    self.show_rental_data = ko.observable(false);

    self.toggle_rental_data = function () {
        self.show_rental_data(!self.show_rental_data());
    };

    self.show_income_data = ko.observable(false);

    self.toggle_income_data = function () {
        self.show_income_data(!self.show_income_data());
    };

    self.show_poverty_data = ko.observable(false);

    self.toggle_poverty_data = function () {
        self.show_poverty_data(!self.show_poverty_data());
    };

    self.show_housing_cost_burden_data = ko.observable(false);

    self.toggle_housing_cost_burden_data = function () {
        self.show_housing_cost_burden_data(!self.show_housing_cost_burden_data());
    };

    self.show_chart = {
        't_cburden50p': true
    }

};
