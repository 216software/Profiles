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

    self.reading_indicator_titles =  ['rpass50', '_rpass50',
        'rpass10', '_rpass10',
        'rpass15', '_rpass15',
        'rpass20', '_rpass20',
        'rpass41', '_rpass41'];

    self.math_indicator_titles =  ['mpass50', '_mpass50',
        'mpass10', '_mpass10',
        'mpass15', '_mpass15',
        'mpass20', '_mpass20',
        'mpass41', '_mpass41'];

    self.kindergarten_readiness_titles =  ['band1', '_band1',
        'band2', '_band2',
        'band3', '_band3',
        'meanscore', ];

    self.other_indicators = ['qslots', '_attend']

    self.overview_indicators = ['rpass50', 'mpass50'];



    self.indicator_titles = (self.reading_indicator_titles.concat(
        self.math_indicator_titles)).concat(self.kindergarten_readiness_titles).concat(
        self.other_indicators);


    self.indicators = ko.observableArray([]);

    self.parentvm.selected_location.subscribe(function(){
        self.parentvm.look_up_indicator_and_values(self.indicator_titles,
            self.look_up_indicator_complete);
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

    };
};
