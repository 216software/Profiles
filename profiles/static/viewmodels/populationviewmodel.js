"use strict";

/* Got execute on enter from :
   http://stackoverflow.com/questions/23087721/call-function-on-enter-key-press-knockout-js

   bind like this

   data-bind="executeOnEnter: sendMessage, button : buttonSelector"
*/

function PopulationViewModel (data) {

    var self = this;

    self.type = "PopulationViewModel";
    self.rootvm = data.rootvm;

    self.parentvm = data.parentvm;
    self.initialize = function(){
        console.log('initing ', self.type);
    };

    /* This should also include the order we want to display*/
    self.indicator_titles = ['pop', 'cvpop', 'nhw' ,'_nhw', 'cvnhw', 'nhb', '_nhb', 'cvnhb',
        'nhapi', '_nhapi','cvnhapi','nho', '_nho', 'cvnho', 'hisp', '_hisp', 'cvhisp'];

    self.total_population = ['pop'];

    self.indicators_population = ['nhw' ,'_nhw', 'nhb', '_nhb',
        'nhapi', '_nhapi', 'nho', '_nho', 'hisp', '_hisp'];

    self.indicators_population_overview = ['nhw' ,'nhb',
        'nhapi', 'nho', 'hisp'];

    self.indicator_cv_pairings = {'pop':'cvpop',
        'nhw':'cvnhw', 'nhb':'cvnhb',
        'nhapi':'cvnhapi', 'nho':'cvnho',
        'nho':'cvnho', 'hisp':'cvhisp',
        }


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

        for (var indicator_key in self.indicator_cv_pairings) {
            var ind = Indicator.indicator_by_title(self.indicators(), indicator_key)
            var ind_cv = Indicator.indicator_by_title(self.indicators(),
                self.indicator_cv_pairings[indicator_key])
            ind.indicator_CV(ind_cv);
        }
    }
};
