"use strict";

/* Got execute on enter from :
   http://stackoverflow.com/questions/23087721/call-function-on-enter-key-press-knockout-js

   bind like this

   data-bind="executeOnEnter: sendMessage, button : buttonSelector"
*/

function EquityViewModel (data) {

    var self = this;

    self.type = "EquityViewModel";
    self.rootvm = data.rootvm;
    self.parentvm = data.parentvm;

    self.show_chart = ko.observable(false);
    self.expand_everything = ko.observable(0);

    self.indicatorcomparisonvm = new IndicatorComparisonByRaceViewModel(data);

    // Parameter location uuid -- set this on
    // the start page vm
    self.location_uuid = ko.observable();

    self.location_uuid.subscribe(function(){
        self.by_race_selector(undefined);
    });
    self.by_race_selector = ko.observable();

    self.initialize = function(){

        if(self.location_uuid()){
            self.parentvm.location_uuid(self.location_uuid());
        }

        self.parentvm.expand_everything(self.expand_everything());


    };

    self.selected_chart_year = ko.observable();
    self.selected_chart_year.subscribe(function(){
        self.show_chart(true);
        self.update_chart()
    });

    self.update_chart = function(i){

        if(self.by_race_selector() && self.selected_chart_year())
        {
            self.indicatorcomparisonvm.location_uuid(self.location_uuid());
            self.indicatorcomparisonvm.indicator_uuid(self.by_race_selector().indicator_uuid());
            self.indicatorcomparisonvm.year(self.selected_chart_year());
            self.indicatorcomparisonvm.update_chart();
        }
    }



    self.housing_cost_burden_indicators = [
        "t_cburden30p",
        "_t_cburden30p",
    ];


    // TODO look into housing cost burden data
    self.housing_cost_observable_timestamps = ko.pureComputed(function(){
        if(self.indicators().length > 0){
            var x = self.observable_timestamps_from_indicators(self.housing_cost_burden_indicators);
            return x;
        }
        else{
            return [moment({y: 2010}), moment({y: 2015})];
        }
    });

    self.housing_cost_pretty_timestamps = ko.pureComputed(function(){
        return ko.utils.arrayMap(self.housing_cost_observable_timestamps(), function(item){
            return {value: item.year(), label:item.year() - 4 + ' - ' + item.year()};
        });

    });




    // The array.concat method doesn't alter the first array, just
    // returns a new one.
    //self.census_indicator_titles = self.census_indicator_titles.concat(
        //self.housing_cost_burden_indicators);

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


    self.poverty_indicators = ['bpv', '_bpv'];

    self.poverty_observable_timestamps = ko.pureComputed(function(){
        if(self.indicators().length > 0){
            var x = self.observable_timestamps_from_indicators(self.poverty_indicators);
            return x;
        }
        else{
            return [moment({y: 2010}), moment({y: 2015})];
        }
    });

    self.poverty_pretty_timestamps = ko.pureComputed(function(){
        return ko.utils.arrayMap(self.poverty_observable_timestamps(), function(item){
            return {value: item.year(), label:item.year() - 4 + ' - ' + item.year()};
        });

    });

    self.indicator_titles = self.housing_cost_burden_indicators.concat(self.poverty_indicators);
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

    });

    self.overview_indicators_sales = ['med_al_price'];
    self.overview_indicators_sales_2nd_table = ['_grent'];
    self.overview_indicators_income = ['_medinc', 'bpv'];

    self.indicators = ko.observableArray([]);

    self.indicators.subscribe(function(){
        // on initial load, show housing cost burden data
        if(self.indicators().length > 0){
            self.toggle_housing_cost_burden_data();



            console.log('initial load complete');

            //for each indicator,look up by race values
        }

    });

    self.csv_link =  ko.computed(function(){

        var base_url= "/api/indicator-categories-with-values-by-location-csv";
        base_url += '?location_uuid=' + self.location_uuid();
        base_url += '&page_title=Equity';

        for(var i = 0; i<self.indicator_titles.length; i++)
        {
            base_url += '&indicators[]=' + self.indicator_titles[i];
        };

        /*for(var i = 0; i<self.census_indicator_titles.length; i++)
        {
            base_url += '&indicators[]=' + self.census_indicator_titles[i];
        };*/
        return base_url;
    });

    self.parentvm.selected_location.subscribe(function(){
        var with_race = true;
        self.parentvm.look_up_indicator_and_values(self.indicator_titles,
            self.look_up_indicator_complete, with_race);

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
                var i = new Indicator(x.indicator);
                return i;
            }));

        self.by_race_selector(self.indicators()[0]);

    };

    self.observable_timestamps_from_indicators = function(indicator_titles){
        var observable_timestamps = [];
        for (var i =0; i< indicator_titles.length; i++){
            var i = Indicator.indicator_by_title(self.indicators(),
                indicator_titles[i])

            if(i == null){
                break;
            }

            for(var j = 0; j< i.indicator_values().length; j++){
                observable_timestamps.push(i.indicator_values()[j].observation_timestamp());
            }

        }

        return observable_timestamps;
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

            if(ind){
                var ind_cv = Indicator.indicator_by_title(self.indicators(),
                    self.indicator_cv_pairings[indicator_key])
                ind.indicator_CV(ind_cv);

                var ind_moe = Indicator.indicator_by_title(self.indicators(),
                    self.indicator_moe_pairings[indicator_key])
                ind.indicator_MOE(ind_moe);
            }

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
        //self.update_chart();
        self.show_poverty_data(!self.show_poverty_data());
    };

    self.show_housing_cost_burden_data = ko.observable(false);

    self.toggle_housing_cost_burden_data = function () {
        //self.update_chart();
        self.show_housing_cost_burden_data(!self.show_housing_cost_burden_data());
    };

    self.expand_everything.subscribe(function () {

        var ee = Boolean(Number(self.expand_everything()));

        self.show_sales_data(ee);
        self.show_rental_data(ee);
        self.show_income_data(ee);
        self.show_poverty_data(ee);
        self.show_housing_cost_burden_data(ee);

    });

    self.drawVisualization = function() {

        var data = new google.visualization.DataTable();

        data.addColumn("string", "Race");
        data.addColumn("number", self.indicator().pretty_label());
        data.addColumn({id: "floor", type: "number", role: "interval"})
        data.addColumn({id: "ceiling", type: "number", role: "interval"})

        for (var i=0; i<self.racial_split().length; i++) {
            var o = self.racial_split()[i];
            var row = [o.chart_label, o.value, o.floor, o.ceiling];
            data.addRow(row);
        }

        var options = {
            title : self.indicator().pretty_label() + ", " + self.year() + ", " + self.location().title(),
            intervals: {
                'lineWidth': 2,
                'color': '383737',
                'style': 'sticks'
            }
        };

        var chart = new google.visualization.ColumnChart(
            document.getElementById('comparisonChart'));
        chart.draw(data, options);
    }


};
