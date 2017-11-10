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
    self.indicator_titles = ['lf' ,'_lf', 'cvlf', 'cv_lf', 'mlf', 'm_lf',
        'emp',  'cvemp', 'memp',
        '_emp',  'cv_emp', 'm_emp',
        'pop25p', 'cvpop25p', 'mpop25',
        'hs9to12', '_hs9to12',
        'cvhs9to12', 'mhs9to12',
        'cv_hs9to12', 'm_hs9to12',
        'lshs', '_lshs', 'cvlshs', 'mlshs', 'cv_lshs', 'm_lshs',
        'hsgrad', '_hsgrad', 'cvhsgrad', 'mhsgrad', 'cv_hsgrad', 'm_hsgrad',
        'somecollassoc', '_somecollassoc', 'cvsomecollassoc', 'msomecollassoc', 'cv_somecollassoc', 'm_somecollassoc',
        'bsp', '_bsp', 'cvbsp', 'mbsp', 'cv_bsp', 'm_bsp',

        'somecoll', '_somecoll' , 'cvsomecoll', 'msomecoll',
        'cv_somecoll', 'm_somecoll',
        'assoc', '_assoc', 'cvassoc', 'massoc',
        'cv_assoc', 'm_assoc',
        'bs', '_bs', 'cvbs', 'mbs',
        'cv_bs', 'm_bs',
        'prof', '_prof', 'cvprof', 'mprof',
        'cv_prof', 'm_prof'
        ];

    self.indicators_employment = ['emp', '_emp', 'lf', '_lf'];

    self.old_indicators_pop_by_ed_attainment = ['pop25', 'hsls9', '_hsls9',
        'hs9to12', '_hs9to12',
        'hsgrad', '_hsgrad',
        'somecoll', '_somecoll',
        'assoc', '_assoc',
        'bs', '_bs',
        'prof', '_prof'];

    // This is the correct list
    self.indicators_pop_by_ed_attainment = [
        'lshs',
        '_lshs',
        'hsgrad',
        '_hsgrad',
        'somecollassoc',
        '_somecollassoc',
        'bsp',
        '_bsp',
    ];

    self.indicator_cv_pairings = {
        'lf':'cvlf',
        'emp':'cvemp',
        'lshs': 'cvlshs',
        '_lf':'cv_lf',
        '_emp':'cv_emp',
        'pop25p':'cvpop25p',
        // 'hs9to12':'cvhs9to12',
        // '_hs9to12':'cv_hs9to12',
        'hsgrad':'cvhsgrad',
        '_hsgrad':'cv_hsgrad',
        // 'somecoll':'cvsomecoll',
        // '_somecoll':'cv_somecoll',
        // 'assoc':'cvassoc',
        // '_assoc':'cv_assoc',
        // 'bs':'cvbs',
        // '_bs':'cv_bs',
        // 'prof':'cvprof',
        // '_prof':'cv_prof'
        }

    self.indicator_moe_pairings = {'lf':'mlf', 'emp':'memp',
        '_lf':'m_lf', '_emp':'cv_emp',
        'pop25p':'mpop25p',
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

    // add some stuff dynamically.
    $.each(self.indicators_pop_by_ed_attainment, function (index, value) {
        var cv_indicator = "cv" + value;
        var moe_indicator = "m" + value;
        self.indicator_cv_pairings[value] = cv_indicator;
        self.indicator_moe_pairings[value] = moe_indicator;
    });

    self.overview_indicators = ['emp'];

    self.indicators = ko.observableArray([]);

    self.csv_link =  ko.computed(function(){

        var base_url= "/api/indicator-categories-with-values-by-location-csv";
        base_url += '?location_uuid=' + self.location_uuid();
        base_url += '&page_title=Workforce';

        for(var i = 0; i<self.indicator_titles.length; i++)
        {
            base_url += '&indicators[]=' + self.indicator_titles[i];
        };
        return base_url;
    });



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

        for (var indicator_key in self.indicator_cv_pairings) {
            var ind = Indicator.indicator_by_title(self.indicators(), indicator_key)

            console.debug(indicator_key);

            if (!ind) {
                console.debug("indicator_key", indicator_key, "not found");
            }

            var ind_cv = Indicator.indicator_by_title(self.indicators(),
                self.indicator_cv_pairings[indicator_key])

            ind.indicator_CV(ind_cv);


            var ind_moe = Indicator.indicator_by_title(
                self.indicators(),
                self.indicator_moe_pairings[indicator_key]);

            ind.indicator_MOE(ind_moe);

        }
    }
};
