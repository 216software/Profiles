"use strict";

/* Got execute on enter from :
   http://stackoverflow.com/questions/23087721/call-function-on-enter-key-press-knockout-js

   bind like this

   data-bind="executeOnEnter: sendMessage, button : buttonSelector"
*/

function IncomePovertyViewModel (data) {

    var self = this;

    self.type = "IncomePovertyViewModel";
    self.rootvm = data.rootvm;

    self.parentvm = data.parentvm;
    self.location_uuid = ko.observable();
    self.indicatorcomparisonvm = new IndicatorComparisonByRaceViewModel(data);

    self.location_uuid.subscribe(function(){
        self.by_race_selector(undefined);
    });
    self.by_race_selector = ko.observable();

    self.expand_everything = ko.observable();

    self.initialize = function(){
        if(self.location_uuid()){
            self.parentvm.location_uuid(self.location_uuid());
        }
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

    /* This should also include the order we want to display */
    self.indicator_titles = [
        'pa_ssi', 'mpa_ssi', 'cvpa_ssi',
        '_pa_ssi', 'm_pa_ssi', 'cv_pa_ssi',
        'pa_snap', 'mpa_snap', 'cvpa_snap',
        '_pa_snap', 'm_pa_snap', 'cv_pa_snap',
        'pa_medicaid', 'mpa_medicaid', 'cvpa_medicaid',
        '_pa_medicaid', 'm_pa_medicaid', 'cv_pa_medicaid',
        ];

    self.indicators_house = ['pa_ssi', '_pa_ssi', 'pa_snap', '_pa_snap'];



    // This is the correct list
    self.indicators_ind = [
        'pa_medicaid',
        '_pa_medicaid',
    ];




    self.indicator_cv_pairings = {
        }

    self.indicator_moe_pairings = {
    }

    // add some stuff dynamically.
    $.each(self.indicators_house, function (index, value) {
        var cv_indicator = "cv" + value;
        var moe_indicator = "m" + value;
        self.indicator_cv_pairings[value] = cv_indicator;
        self.indicator_moe_pairings[value] = moe_indicator;
    });
    $.each(self.indicators_ind, function (index, value) {
        var cv_indicator = "cv" + value;
        var moe_indicator = "m" + value;
        self.indicator_cv_pairings[value] = cv_indicator;
        self.indicator_moe_pairings[value] = moe_indicator;
    });

    self.overview_indicators = ['pa_ssi'];

    self.indicators = ko.observableArray([]);

    self.csv_link =  ko.computed(function(){

        var base_url= "/api/indicator-categories-with-values-by-location-csv";
        base_url += '?location_uuid=' + self.location_uuid();
        base_url += '&page_title=IncomePoverty';

        for(var i = 0; i<self.indicator_titles.length; i++)
        {
            base_url += '&indicators[]=' + self.indicator_titles[i];
        };
        return base_url;
    });



    self.parentvm.selected_location.subscribe(function(){
        self.parentvm.look_up_indicator_and_values(self.indicator_titles,
            self.look_up_indicator_complete, true);
    });

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

        for (var indicator_key in self.indicator_cv_pairings) {
            var ind = Indicator.indicator_by_title(self.indicators(), indicator_key)

            if (!ind) {
                console.debug("indicator_key", indicator_key, "not found");
            }

            if(ind){
                var ind_cv = Indicator.indicator_by_title(self.indicators(),
                    self.indicator_cv_pairings[indicator_key])

                ind.indicator_CV(ind_cv);


                var ind_moe = Indicator.indicator_by_title(
                    self.indicators(),
                    self.indicator_moe_pairings[indicator_key]);

                ind.indicator_MOE(ind_moe);
            }

        }
    }


    self.pretty_timestamps = ko.pureComputed(function(){
        return ko.utils.arrayMap(self.observable_timestamps(), function(item){
            return {value: item.year(), label:item.year() - 4 + ' - ' + item.year()};
        });

    });


    self.show_chart = ko.observable(false);

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

    self.ind_observable_timestamps = ko.pureComputed(function(){
        if(self.indicators().length > 0){
            var x = self.observable_timestamps_from_indicators(self.indicators_ind);
            return x;
        }
        else{
            return [moment({y: 2010}), moment({y: 2015})];
        }
    });

    self.house_observable_timestamps = ko.pureComputed(function(){
        if(self.indicators().length > 0){
            var x = self.observable_timestamps_from_indicators(self.indicators_house);
            return x;
        }
        else{
            return [moment({y: 2010}), moment({y: 2015})];
        }
    });



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


};
