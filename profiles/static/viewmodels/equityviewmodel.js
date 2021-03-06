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
            self.indicatorcomparisonvm.year(self.selected_chart_year().value);
            self.indicatorcomparisonvm.update_chart();
        }
    }



    self.housing_cost_burden_indicators = [
        "_t_cburden30p",
        /*
        "t_cburden30p",
         * "t_cburden50p",
        "_t_cburden50p",
        "t_ocburden30p",
        "_t_ocburden30p",
        "t_rcburden30p",
        "_t_rcburden30p",
        "t_ocburden50p",
        "_t_ocburden50p",
        "t_rcburden50p",
        "_t_rcburden50p",*/
    ];


    // TODO look into housing cost burden data
    self.housing_cost_observable_timestamps = ko.pureComputed(function(){
        if(self.indicators().length > 0){
            var x = self.observable_timestamps_from_indicators(self.housing_cost_burden_indicators);
            return x;
        }
        else{
            return [];
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


    self.poverty_indicators = ['_bpv'];

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


    self.health_indicators = ['_mort_rate',
        '_infmort_rate',
    ];

    self.health_observable_timestamps = ko.pureComputed(function(){
        if(self.indicators().length > 0){
            var x = self.observable_timestamps_from_indicators(self.health_indicators);
            return x;
        }
        else{
            return [moment({y: 2010}), moment({y: 2015})];
        }
    });

    self.health_pretty_timestamps = ko.pureComputed(function(){
        return ko.utils.arrayMap(self.health_observable_timestamps(), function(item){
            return {value: item.year(), label:item.year() - 4 + ' - ' + item.year()};
        });
    });

    self.health_indicators_two= ['_ebll_c'];

    self.health_two_observable_timestamps = ko.pureComputed(function(){
        if(self.indicators().length > 0){
            var x = self.observable_timestamps_from_indicators(self.health_indicators_two);
            return x;
        }
        else{
            return [moment({y: 2010}), moment({y: 2015})];
        }
    });

    self.health_two_pretty_timestamps = ko.pureComputed(function(){
        return ko.utils.arrayMap(self.health_two_observable_timestamps(), function(item){
            return {value: item.year(), label:item.year() - 4 + ' - ' + item.year()};
        });
    });


    self.education_indicators = [
        /*'rpassed3',
        'rpassed10',
        'mpassed3',
        'mpassed10',*/
        '_rpassed3',
        '_rpassed10',
        '_mpassed3',
        '_mpassed10',
    ];

    self.education_observable_timestamps = ko.pureComputed(function(){
        if(self.indicators().length > 0){
            var x = self.observable_timestamps_from_indicators(self.education_indicators);
            return x;
        }
        else{
            return [moment({y: 2010}), moment({y: 2015})];
        }
    });

    self.education_pretty_timestamps = ko.pureComputed(function(){
        return ko.utils.arrayMap(self.education_observable_timestamps(), function(item){
            return {value: item.year(), label:item.year() - 1 + ' - ' + item.year() + ' school year'};
        });
    });




    self.income_indicators = [
        '_hhincls10k',
        /*'hhincls10k',
         *'hhinc35to50k',
        '_hhinc35to50k',
        'hhinc50to75k',
        '_hhinc50to75k',
        'hhinc150to200k',
        '_hhinc150to200k',
        'hhinc200kp',*/
        '_hhinc200kp',
    ];

    self.income_observable_timestamps = ko.pureComputed(function(){
        if(self.indicators().length > 0){
            var x = self.observable_timestamps_from_indicators(self.income_indicators);
            return x;
        }
        else{
            return [moment({y: 2010}), moment({y: 2015})];
        }
    });

    self.income_pretty_timestamps = ko.pureComputed(function(){
        return ko.utils.arrayMap(self.income_observable_timestamps(), function(item){
            return {value: item.year(), label:item.year() - 4 + ' - ' + item.year()};
        });
    });


    self.indicator_titles = self.housing_cost_burden_indicators.concat(self.poverty_indicators);

    self.indicator_titles = self.indicator_titles.concat(self.health_indicators);
    self.indicator_titles = self.indicator_titles.concat(self.health_indicators_two);
    self.indicator_titles = self.indicator_titles.concat(self.education_indicators);
    self.indicator_titles = self.indicator_titles.concat(self.income_indicators);
    self.indicator_cv_pairings = {};

    self.indicator_moe_pairings = {};

    // add some stuff dynamically.
    $.each(self.housing_cost_burden_indicators, function (index, value) {
        var cv_indicator = "cv" + value;
        var moe_indicator = "m" + value;
        self.indicator_cv_pairings[value] = cv_indicator;
        self.indicator_moe_pairings[value] = moe_indicator;
    });

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



    self.show_income_data = ko.observable(false);

    self.toggle_income_data = function () {
        self.show_income_data(!self.show_income_data());
    };

    self.show_health_data = ko.observable(false);

    self.toggle_health_data = function () {
        self.show_health_data(!self.show_health_data());
    };

    self.show_education_data = ko.observable(false);

    self.toggle_education_data = function () {
        self.show_education_data(!self.show_education_data());
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
