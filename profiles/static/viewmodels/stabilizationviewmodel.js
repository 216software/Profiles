"use strict";

function StabilizationViewModel (data) {

    var self = this;

    self.type = "StabilizationViewModel";
    self.rootvm = data.rootvm;
    self.parentvm = data.parentvm;


    self.location_uuid = ko.observable();

    self.initialize = function(){
        if(self.location_uuid()){
            self.parentvm.location_uuid(self.location_uuid());
        }
    };

    /* This should also include the order we want to display */
    self.indicator_titles = ['res_occ', '_res_occ',
        'hsg_den', 'f', '_f',
        'shf','_shf',
        'distress', '_distress',
        'ntal_sales', '_ntal_sales',
        'med_ntal_price',
       'evict',
       'move_out',
       '_evict',
       '_move_out' ];

    self.stabilization_titles = ['res_occ', '_res_occ',
        'hsg_den', 'f','_f',
        'shf', '_shf',
        'distress', '_distress',
        'ntal_sales', '_ntal_sales',
        'med_ntal_price'];

    self.eviction_titles = [
        'evict',
       '_evict',
       'move_out',
       '_move_out'];

    self.eviction_observable_timestamps = ko.pureComputed(function(){
        if(self.indicators().length > 0){
            var x = self.observable_timestamps_from_indicators(self.eviction_titles);
            return x;
        }
        else{
            return [moment({y: 2010}), moment({y: 2015})];
        }
    });

    self.stabilization_observable_timestamps = ko.pureComputed(function(){
        if(self.indicators().length > 0){
            var x = self.observable_timestamps_from_indicators(self.stabilization_titles);
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


    /* Don't need this at the moment
    self.indicator_titles_extra_formatting = {
        'hsg_den':'Number of residential parcels per square mile; includes only single family, multi-family, and condominium parcels.',
        'distress':'Distressed sales are arms-length transactions for $10,000 or less. Residential single family, multi-family, and condominium parcels only included.',
        'ntal_sales':'Arms-length transactions with no history of foreclosure from 2006 onward. Residential single family, multi-family, and condominium parcels only included. Rate is of all arms-arms length transactions on residential single family, multi-family, and condominium parcels. <br />Note: Arm\'s length sales include all property sales except those transferred at Sheriff sale, purchased by a bank, financial institution, GSE or local government, or recorded with a zero price. Bulk sales and self-sales are also excluded.'
    };*/

    self.overview_indicators = ['res_occ']

    self.indicators = ko.observableArray([]);

    self.csv_link =  ko.computed(function(){

        var base_url= "/api/indicator-categories-with-values-by-location-csv";
        base_url += '?location_uuid=' + self.location_uuid();
        base_url += '&page_title=Stabilization';

        for(var i = 0; i<self.indicator_titles.length; i++)
        {
            base_url += '&indicators[]=' + self.indicator_titles[i];
        };
        return base_url;
    });



    self.extra_formatting_old = function(title){
        return self.indicator_titles_extra_formatting[title];
    };

    self.extra_formatting = function(title){

        return extra_info;

    }

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
