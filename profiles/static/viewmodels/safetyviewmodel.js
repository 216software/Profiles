"use strict";

/* Got execute on enter from :
   http://stackoverflow.com/questions/23087721/call-function-on-enter-key-press-knockout-js

   bind like this

   data-bind="executeOnEnter: sendMessage, button : buttonSelector"
*/

function SafetyViewModel (data) {

    var self = this;

    self.type = "SafetyViewModel";
    self.rootvm = data.rootvm;

    self.parentvm = data.parentvm;
    self.initialize = function(){
        console.log('initing ', self.type);
    };

    /* This should also include the order we want to display */
    self.indicator_titles = ['Ia', '_Ia',
        'v', '_v', 'p', '_p', 'II', '_II'];

    self.overview_indicators = ['Ia', 'II'];

    self.indicators = ko.observableArray([]);

    self.parentvm.selected_location.subscribe(function(){
        self.parentvm.look_up_indicator_and_values(self.indicator_titles,
            self.look_up_indicator_complete);
    });

    self.observable_timestamps = ko.observableArray([]);

    self.look_up_indicator_complete = function(data){

        console.log('look_up_indicator complete');

        console.log(data);

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
                console.log(x.indicator);
                return new Indicator(x.indicator);
            }));

    }

};