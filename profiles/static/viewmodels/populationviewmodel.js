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

    self.location_uuid = ko.observable();

    self.initialize = function(){
        if(self.location_uuid()){
            self.parentvm.location_uuid(self.location_uuid());
        }
    };

    /* This should also include the order we want to display*/
    self.indicator_titles = ['pop', 'cvpop', 'mpop',
        'nhw' ,'_nhw', 'cvnhw', 'mnhw', 'cv_nhw', 'm_nhw',
        'nhb', '_nhb', 'cvnhb', 'mnhb', 'cv_nhb', 'm_nhb',
        'nhapi', '_nhapi','cvnhapi', 'mnhapi', 'cv_nhapi', 'm_nhapi',
        'nho', '_nho', 'cvnho', 'mnho', 'cv_nho', 'm_nho',
        'hisp', '_hisp', 'cvhisp', 'mhisp', 'cv_hisp', 'm_hisp'
        ];

    self.total_population = ['pop'];

    self.indicators_population = ['nhw' ,'_nhw', 'nhb', '_nhb',
        'nhapi', '_nhapi', 'nho', '_nho', 'hisp', '_hisp'];

    self.indicators_population_overview = ['nhw' ,'nhb',
        'nhapi', 'nho', 'hisp'];

    self.indicator_cv_pairings = {'pop':'cvpop',
        'nhw':'cvnhw', 'nhb':'cvnhb',
        'nhapi':'cvnhapi',
        'nho':'cvnho', 'hisp':'cvhisp',

        '_nhw':'cv_nhw',
        '_nhb':'cv_nhb',
        '_nhapi':'cv_nhapi',
        '_nho':'cv_nho',
        '_hisp':'cv_hisp',
        }

    self.indicator_moe_pairings = {'pop':'mpop',
        'nhw':'mnhw', 'nhb':'mnhb',
        'nhapi':'mnhapi', 'nho':'mnho',
        'hisp':'mhisp',
        '_nhw':'m_nhw',
        '_nhb':'m_nhb',
        '_nhapi':'mnh_api',
        '_nho':'m_nho',
        '_hisp':'m_hisp',
        }



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
