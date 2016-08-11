"use strict";

/* Got execute on enter from :
   http://stackoverflow.com/questions/23087721/call-function-on-enter-key-press-knockout-js

   bind like this

   data-bind="executeOnEnter: sendMessage, button : buttonSelector"
*/

function WorkforceViewModel (data) {

    var self = this;

    self.type = "WorkforceViewModel";
    self.rootvm = data.rootvm;

    self.parentvm = data.parentvm;
    self.initialize = function(){
        console.log('initing ', self.type);
    };

    /* This should also include the order we want to display */
    self.indicator_titles = ['lf' ,'_lf', 'cvlf', '_cvlf',
        'emp', '_emp', 'cvemp', 'pop25p', 'cvpop25p', 'hsls9', '_hsls9', 'cvhsls9',
        'hs9to12', '_hs9to12', 'cvhs9to12',
        'hsgrad', '_hsgrad', 'cvhsgrad',
        'somecoll', '_somecoll' , 'cvsomecoll',
        'assoc', '_assoc', 'cvassoc',
        'bs', '_bs', 'cvbs',
        'prof', '_prof', 'cvprof'];

    self.indicators_employment = ['emp', 'lf'];
    self.indicators_pop_by_ed_attainment = ['pop25', 'hsls9', 'hs9to12',
        'hsgrad', 'somecoll', 'assoc', 'bs', 'prof'];

    self.indicator_cv_pairings = {'lf':'cvlf', 'emp':'cvemp',
        'pop25p':'cvpop25p', 'hsls9':'cvhsls9',
        'hs9to12':'cvhs9to12', 'hsgrad':'cvhsgrad',
        'somecoll':'cvsomecoll',
        'assoc':'cvassoc',
        'bs':'cvbs', 'prof':'cvprof'
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
