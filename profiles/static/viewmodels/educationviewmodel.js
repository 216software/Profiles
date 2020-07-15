"use strict";

function EducationViewModel (data) {

    var self = this;

    self.type = "EducationViewModel";
    self.rootvm = data.rootvm;

    self.parentvm = data.parentvm;

    self.location_uuid = ko.observable();
    self.initialize = function(){
        if(self.location_uuid()){
            self.parentvm.location_uuid(self.location_uuid());
        }
    };

    self.reading_indicator_titles =  ['rpassed3', '_rpassed3',
        'rpassed4', '_rpassed4',
        'rpassed6', '_rpassed6',
        'rpassed10', '_rpasssed10'];

    self.math_indicator_titles =  ['mpassed3', '_mpassed3',
        'mpassed4', '_mpassed4',
        'mpassed6', '_mpassed6',
        'mpassed10', '_rpasssed10'];


    self.kindergarten_readiness_titles =  ['band1', '_band1',
        'band2', '_band2',
        'band3', '_band3',
        'meanscore',
        ];

    self.kindergarten_indicators = ['qslots']


    self.other_indicators = ['_attend']

    self.overview_indicators = ['rpassed3', 'mpassed3'];

    self.indicator_titles = (self.reading_indicator_titles.concat(
        self.math_indicator_titles)).concat(self.kindergarten_readiness_titles).concat(
        self.other_indicators).concat(self.kindergarten_indicators);


    self.indicators = ko.observableArray([]);

    self.parentvm.selected_location.subscribe(function(){
        self.parentvm.look_up_indicator_and_values(self.indicator_titles,
            self.look_up_indicator_complete);
    });

    self.csv_link =  ko.computed(function(){

        var base_url= "/api/indicator-categories-with-values-by-location-csv";
        base_url += '?location_uuid=' + self.location_uuid();
        base_url += '&page_title=Education';

        for(var i = 0; i<self.indicator_titles.length; i++)
        {
            base_url += '&indicators[]=' + self.indicator_titles[i];
        };
        return base_url;
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

                var i = new Indicator(x.indicator);

                if (['meanscore', 'qslots'].indexOf(i.title()) >= 0){
                    i.percent_change_available(false);
                }
                return i;
            }));

    };

    self.show_chart = {
        "rpass50": true,
        "_rpass50": true,
        "rpass10": true,
        "_rpass10": true,
        "rpass20": true,
        "_rpass20": true,
        "rpass41": true,
        "_rpass41": true,
        "mpass50": true,
        "_mpass50": true,
        "mpass10": true,
        "_mpass10": true,
        "mpass20": true,
        "_mpass20": true,
        "mpass41": true,
        "_mpass41": true,
        "band1": true,
        "_band1": true,
        "band2": true,
        "_band2": true,
        "band3": true,
        "_band3": true,
        "meanscore": true,
        "_attend": true
    };

    self.show_chart = {};

    self.band_observable_timestamps = ko.pureComputed(function(){
        if(self.indicators().length > 0){
            var x = self.observable_timestamps_from_indicators(self.reading_indicator_titles);
            return x;
        }
        else{
            return [];
        }
    });

    self.kindergarten_observable_timestamps = ko.pureComputed(function(){
        if(self.indicators().length > 0){
            var x = self.observable_timestamps_from_indicators(self.kindergarten_indicators);
            return x;
        }
        else{
            return [];
        }
    });



    self.other_indicators_observable_timestamps = ko.pureComputed(function(){
        if(self.indicators().length > 0){
            var x = self.observable_timestamps_from_indicators(self.other_indicators);
            return x;
        }
        else{
            return [];
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
