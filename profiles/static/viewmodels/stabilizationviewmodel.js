"use strict";

function StabilizationViewModel (data) {

    var self = this;

    self.type = "StabilizationViewModel";
    self.rootvm = data.rootvm;
    self.parentvm = data.parentvm;
    self.initialize = function(){
        console.log('initing ', self.type);
    };

    self.indicator_titles = ['distress', '_distress', 'med_ntal_price', 'ntal_sales',
        'shf', 'f', 'hsg_den', 'res_occ'];

    self.indicators = ko.observableArray([]);

    self.test_observable = ko.observable(0);

    self.parentvm.selected_location.subscribe(function(){
        self.parentvm.look_up_indicator_and_values(self.indicator_titles,
            self.look_up_indicator_complete);
    });

    console.log(self.parentvm);

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

    };

    // so the look up could be here -- based on our indicator
    // and the parentvm's chosen location, we could say something like
    //
    // parentvm.look_up_indicator_values(indicator_list, selected_location,
    //  callback_to_populate values)
    //
    //  the call back is the actual values we're going to look up.
    //
    //  What about changed location? That should trigger a new lookup...
    //  We could subscribe --
    //  $parentvm.selected_location.subscribe(callback)
    //  callback triggers new lookup the same way our init does.
    //
    //  Then, for a given set of indicators, we're able to display what
    //  we want in the groups we want?
    //
    //  Test with stabilization first -- indicators are 'distress' and
    //  '_distress'
    //
    //  We need a list of all years for these values, as well as
    //  the value with a given timestamp. Then we can display

};
