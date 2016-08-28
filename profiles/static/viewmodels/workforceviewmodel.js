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
    self.location_uuid = ko.observable();

    self.initialize = function(){
        console.log('initing ', self.type);
        if(self.location_uuid()){
            self.parentvm.location_uuid(self.location_uuid());
        }
    };

    /* This should also include the order we want to display */
    self.indicator_titles = ['lf' ,'_lf', 'cvlf', '_cvlf', 'mlf',
        'emp', '_emp', 'cvemp', 'memp',
        'pop25p', 'cvpop25p', 'mpop25',
        'hsls9', '_hsls9', 'cvhsls9', 'mhsls9',
        'hs9to12', '_hs9to12', 'cvhs9to12', 'mhs9to12',
        'hsgrad', '_hsgrad', 'cvhsgrad', 'mhsgrad',
        'somecoll', '_somecoll' , 'cvsomecoll', 'msomecoll',
        'assoc', '_assoc', 'cvassoc', 'massoc',
        'bs', '_bs', 'cvbs', 'mbs',
        'prof', '_prof', 'cvprof', 'mprof'];

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

    self.indicator_moe_pairings = {'lf':'mlf', 'emp':'memp',
        'pop25p':'mpop25p', 'hsls9':'mhsls9',
        'hs9to12':'mhs9to12', 'hsgrad':'mhsgrad',
        'somecoll':'msomecoll',
        'assoc':'massoc',
        'bs':'mbs', 'prof':'mprof'
        }


    self.overview_indicators = ['emp'];

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
            var ind_moe = Indicator.indicator_by_title(self.indicators(),
                self.indicator_moe_pairings[indicator_key])
            ind.indicator_MOE(ind_moe);

        }
    }
};
