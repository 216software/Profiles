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
        if(self.location_uuid()){
            self.parentvm.location_uuid(self.location_uuid());
        }
    };

    /* This should also include the order we want to display */
    self.indicator_titles = ['lf' ,'_lf', 'cvlf', '_cvlf', 'mlf',
        'emp', '_emp', 'cvemp', 'memp',
        'pop25p', 'cvpop25p', 'mpop25',
        'hsls9', '_hsls9', 'cvhsls9', 'mhsls9',
        'cv_hsls9', 'm_hsls9',
        'hs9to12', '_hs9to12',
        'cvhs9to12', 'mhs9to12',
        'cv_hs9to12', 'm_hs9to12',
        'hsgrad', '_hsgrad', 'cvhsgrad', 'mhsgrad',
        'cv_hsgrad', 'm_hsgrad',
        'somecoll', '_somecoll' , 'cvsomecoll', 'msomecoll',
        'cv_somecoll', 'm_somecoll',
        'assoc', '_assoc', 'cvassoc', 'massoc',
        'cv_assoc', 'm_assoc',
        'bs', '_bs', 'cvbs', 'mbs',
        'cv_bs', 'm_bs',
        'prof', '_prof', 'cvprof', 'mprof',
        'cv_prof', 'm_prof'
        ];

    self.indicators_employment = ['emp', 'lf'];


    self.indicators_pop_by_ed_attainment = ['pop25', 'hsls9', '_hsls9',
        'hs9to12', '_hs9to12',
        'hsgrad', '_hsgrad',
        'somecoll', '_somecoll',
        'assoc', '_assoc',
        'bs', '_bs',
        'prof', '_prof'];

    self.indicator_cv_pairings = {'lf':'cvlf', 'emp':'cvemp',
        'pop25p':'cvpop25p',
        'hsls9':'cvhsls9',
        '_hsls9':'cv_hsls9',
        'hs9to12':'cvhs9to12',
        '_hs9to12':'cv_hs9to12',
        'hsgrad':'cvhsgrad',
        '_hsgrad':'cv_hsgrad',
        'somecoll':'cvsomecoll',
        '_somecoll':'cv_somecoll',
        'assoc':'cvassoc',
        '_assoc':'cv_assoc',
        'bs':'cvbs', '_bs':'cv_bs',
        'prof':'cvprof',
        '_prof':'cv_prof'
        }

    self.indicator_moe_pairings = {'lf':'mlf', 'emp':'memp',
        'pop25p':'mpop25p', 'hsls9':'mhsls9',
        '_hsls9':'m_hsls9',
        'hs9to12':'mhs9to12',
        '_hs9to12':'m_hs9to12',
        'hsgrad':'mhsgrad',
        '_hsgrad':'m_hsgrad',
        'somecoll':'msomecoll',
        '_somecoll':'m_somecoll',
        'assoc':'massoc',
        '_assoc':'m_assoc',
        'bs':'mbs',
        '_bs':'m_bs',
        'prof':'mprof',
        '_prof':'m_prof'
        }


    self.overview_indicators = ['emp'];

    self.indicators = ko.observableArray([]);

    self.parentvm.selected_location.subscribe(function(){
        self.parentvm.look_up_indicator_and_values(self.indicator_titles,
            self.look_up_indicator_complete);

        self.parentvm.look_up_indicator_csv(self.indicator_titles,
            function(){console.log('hi')});

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
            var ind_cv = Indicator.indicator_by_title(self.indicators(),
                self.indicator_cv_pairings[indicator_key])
            ind.indicator_CV(ind_cv);
            var ind_moe = Indicator.indicator_by_title(self.indicators(),
                self.indicator_moe_pairings[indicator_key])
            ind.indicator_MOE(ind_moe);

        }
    }
};
