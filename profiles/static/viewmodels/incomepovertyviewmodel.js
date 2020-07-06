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

    self.initialize = function(){
        if(self.location_uuid()){
            self.parentvm.location_uuid(self.location_uuid());
        }
    };

    /* This should also include the order we want to display */
    self.indicator_titles = ['lf' ,'_lf', 'cvlf', 'cv_lf', 'mlf', 'm_lf',
        'emp',  'cvemp', 'memp',
        '_emp',  'cv_emp', 'm_emp',
        'lshs', '_lshs', 'cvlshs', 'mlshs', 'cv_lshs', 'm_lshs',
        'hsgrad', '_hsgrad', 'cvhsgrad', 'mhsgrad', 'cv_hsgrad', 'm_hsgrad',
        'somecollassoc', '_somecollassoc', 'cvsomecollassoc', 'msomecollassoc', 'cv_somecollassoc', 'm_somecollassoc',
        'bsp', '_bsp', 'cvbsp', 'mbsp', 'cv_bsp', 'm_bsp',

        'worker16p', 'cvworker16p', 'mworker16p',
        'drove', 'cvdrove', 'mdrove',
        '_drove', 'cv_drove', 'm_drove',
        'public_tran', 'cvpublic_tran', 'mpublic_tran',
        '_public_tran', 'cv_public_tran', 'm_public_tran',
        'other_tran', 'cvother_tran', 'mother_tran',
        '_other_tran', 'cv_other_tran', 'm_other_tran',
        'walk', 'cvwalk', 'mwalk',
        '_walk', 'cv_walk', 'm_walk',
        'workathome', 'cvworkathome', 'mworkathome',
        '_workathome', 'cv_workathome', 'm_workathome',
        'travel_ls30', 'cvtravel_ls30', 'mtravel_ls30',
        '_travel_ls30','cv_travel_ls30', 'm_travel_ls30',
        'travel_30to60','cvtravel_30to60', 'mtravel_30to60',
        '_travel_30to60','cv_travel_30to60', 'm_travel_30to60',
        'travel_60p','cvtravel_60p', 'mtravel_60p',
        '_travel_60p','cv_travel_60p', 'm_travel_60p',

        'h_primjobs',
        'h_within',
        '_h_within',
        'h_outside',
        '_h_outside',
        'h_age1',
        '_h_age1',
        'h_age2',
        '_h_age2',
        'h_age3',
        '_h_age3',
        'h_earn1',
        '_h_earn1',
        'h_earn2',
        '_h_earn2',
        'h_earn3',
        '_h_earn3',
        'h_sector1',
        '_h_sector1',
        'h_sector2',
        '_h_sector2',
        'h_sector3',
        '_h_sector3',
        ];

    self.indicators_employment = ['emp', '_emp', 'lf', '_lf'];

    self.old_indicators_pop_by_ed_attainment = ['pop25',
        'hsls9', '_hsls9',
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

    self.indicators_workers_by_transport = [
        'worker16p',
        'drove',
        '_drove',
        'public_tran',
        '_public_tran',
        'other_tran',
        '_other_tran',
        'walk',
        '_walk',
        'workathome',
        '_workathome']

    self.indicators_workers_by_commute = [
   'travel_ls30',
   '_travel_ls30',
   'travel_30to60',
   '_travel_30to60',
   'travel_60p',
   '_travel_60p',
    ];

    self.indicators_residing = [
        'h_primjobs',
        'h_within',
        '_h_within',
        'h_outside',
        '_h_outside',
        'h_age1',
        '_h_age1',
        'h_age2',
        '_h_age2',
        'h_age3',
        '_h_age3',
        'h_earn1',
        '_h_earn1',
        'h_earn2',
        '_h_earn2',
        'h_earn3',
        '_h_earn3',
        'h_sector1',
        '_h_sector1',
        'h_sector2',
        '_h_sector2',
        'h_sector3',
        '_h_sector3',
        ]


    self.indicator_cv_pairings = {
        'lf':'cvlf',
        'emp':'cvemp',
        'lshs': 'cvlshs',
        '_lf':'cv_lf',
        '_emp':'cv_emp',
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
        // '_prof':'cv_prof',
        //
        //
        'worker16p' : 'cvworker16p',
        'drove' : 'cvdrove',
        '_drove' : 'cv_drove',
        'public_tran' : 'cvpublic_tran',
        '_public_tran' : 'cv_public_tran',
        'other_tran' : 'cvother_tran',
        '_other_tran' : 'cv_other_tran',
        'walk' : 'cvwalk',
        '_walk' : 'cv_walk',
        'workathome' : 'cvworkathome',
        '_workathome' : 'cv_workathome',
       'travel_ls30': 'cvtravel_ls30',
       '_travel_ls30': 'cv_travel_ls30',
       'travel_30to60': 'cvtravel_30to60',
       '_travel_30to60': 'cv_travel_30to60',
       'travel_60p': 'cvtravel_60p',
       '_travel_60p': 'cv_travel_60p',
        }

    self.indicator_moe_pairings = {'lf':'mlf', 'emp':'memp',
        '_lf':'m_lf', '_emp':'cv_emp',
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
        '_prof':'m_prof',
        'worker16p' : 'mworker16p',
        'drove' : 'mdrove',
        '_drove' : 'm_drove',
        'public_tran' : 'mpublic_tran',
        '_public_tran' : 'm_public_tran',
        'other_tran' : 'mother_tran',
        '_other_tran' : 'm_other_tran',
        'walk' : 'mwalk',
        '_walk' : 'm_walk',
        'workathome' : 'mworkathome',
        '_workathome' : 'm_workathome',
       'travel_ls30': 'mtravel_ls30',
       '_travel_ls30': 'm_travel_ls30',
       'travel_30to60': 'mtravel_30to60',
       '_travel_30to60': 'm_travel_30to60',
       'travel_60p': 'mtravel_60p',
       '_travel_60p': 'm_travel_60p',

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
        base_url += '&page_title=IncomePoverty';

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

    self.show_chart = {
        "emp": true,
        "_emp": true,
        "lf": true,
        "_lf": true,
        "lshs": true,
        "_lshs": true,
        "hsgrad": true,
        "_hsgrad": true,
        "somecollassoc": true,
        "_somecollassoc": true,
        "bsp": true,
        "_bsp": true
    };

    self.show_chart = {};

    self.residence_observable_timestamps = ko.pureComputed(function(){
        if(self.indicators().length > 0){
            var x = self.observable_timestamps_from_indicators(self.indicators_residing);
            return x;
        }
        else{
            return [moment({y: 2010}), moment({y: 2015})];
        }
    });

    self.worker_observable_timestamps = ko.pureComputed(function(){
        if(self.indicators().length > 0){
            var x = self.observable_timestamps_from_indicators(self.indicators_workers_by_transport);
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
