"use strict";

function IndicatorComparisonViewModel (data) {

    var self = this;

    self.type = "IndicatorComparisonViewModel";
    self.rootvm = data.rootvm;

    self.map = undefined;
    self.added_map_layers = [];

    self.locations = ko.observableArray([]);
    self.location_types = ko.observableArray([]);

    /* We might have a selected location from the parameter line */
    self.indicator_uuid = ko.observable();
    self.location_uuid = ko.observable();

    self.selected_indicator = ko.observable(new Indicator({rootvm:data.rootvm}));

    self.indicator_locations = ko.observableArray([]);
    self.observable_timestamps = ko.observableArray([]);

    self.selector_location = ko.observable();

    self.asc = ko.observable(true);
    self.sort_column = ko.observable();
    self.selected_location_type = ko.observable();

    self.location_search = ko.observable();

    self.initialize = function(){

        console.log('indicator comparison initing');

        console.log('look up indicator_uuid ', self.indicator_uuid());

        self.selected_indicator().indicator_uuid(self.indicator_uuid());

        self.selected_indicator().look_up_details();
        self.get_all_location_types().then(self.get_all_locations);

        self.get_all_indicator_values();
    };

    self.location_type_filtered = ko.computed(function(){

       if(self.selected_location_type() != undefined){

            return ko.utils.arrayFilter(self.indicator_locations(), function(item){
                return item.location_type() == self.selected_location_type();
            });

        }
        else{
            return self.indicator_locations();
        }
    });

    self.location_search_filtered = ko.computed(function(){

       console.log('self.location_search ', self.location_search());

       if(self.location_search()){
            return ko.utils.arrayFilter(self.location_type_filtered(), function(item){
                return item.title().indexOf(self.location_search()) >= 0;
            });

        }
        else{
            return self.location_type_filtered();
        }

    });


    self.location_click_sort = function(){

        self.sort_column('location');

        // now we need to do the actual sort by year here
        // of indicator_locations
        self.indicator_locations.sort(function(left, right){

            var sort_mult = self.asc() ? -1 : 1;

            // need to get in to indicator values and year
            return left.title() > right.title()
                ? 1 * sort_mult : -1 * sort_mult;

        });
        self.asc(!self.asc());
   }

    self.year_click_sort = function(moment_year){

        console.log('clicked ', moment_year.year());

        self.sort_column(moment_year.year());

        var year = moment_year.year();

        // now we need to do the actual sort by year here
        // of indicator_locations
        self.indicator_locations.sort(function(left, right){

            var sort_mult = self.asc() ? -1 : 1;

            // need to get in to indicator values and year
            return left.indicator_value_by_year(year)()>right.indicator_value_by_year(year)()
                ? 1 * sort_mult : -1 * sort_mult;

        });

        self.asc(!self.asc());

    };


    self.get_all_indicator_values = function(){

        self.rootvm.is_busy(true);

        return $.ajax({
            url: "/api/indicator-values-by-indicator",
            type: "GET",
            dataType: "json",
            processData: true,

            data: {'indicator_uuid':self.selected_indicator().indicator_uuid(),
                   },

            complete: function () {
                self.rootvm.is_busy(false);
            },
            success: function (data) {
                if (data.success) {

                    self.observable_timestamps(ko.utils.arrayMap(
                        data.distinct_observable_timestamps || [],
                        function(x){
                            return new moment(x.observation_timestamp);
                        }
                    ));

                    self.indicator_locations(ko.utils.arrayMap(
                        data.indicatorvalues || [],
                        function (x) {
                            x.location.rootvm = self.rootvm;
                            var l = new Location(x.location);
                            l.indicator_values(ko.utils.arrayMap(
                                x.indicator_location_values|| [],
                                    function (x) {
                                        x.rootvm = self.rootvm;
                                        x.indicator = self.selected_indicator();
                                        return new IndicatorValue(x);
                                    }
                            ));

                            return l;

                        }));

                }
                else {
                    toastr.error(data.message);
                }
            }
        });
    };



    self.get_all_location_types = function(){

        /* Look up the different location_types */

        return $.ajax({
            url: "/api/location-types",
            type: "GET",
            dataType: "json",
            complete: function () {

            },
            success: function (data) {
                if (data.success) {
                    self.location_types(data.location_types);
                }
                else {
                    toastr.error(data.message);
                }
            }
        });
    }

    self.get_all_locations = function(){

        return $.ajax({
            url: "/api/all-locations",
            type: "GET",
            dataType: "json",
            complete: function () {

            },
            success: function (data) {
                if (data.success) {

                self.locations(
                        ko.utils.arrayMap(
                            data.locations || [],
                            function (x) {
                                x.rootvm = self.rootvm;
                                return new Location(x);
                }));

                }
                else {
                    toastr.error(data.message);
                }
            }
        });
    };

    /* We need to do this after the source is loaded and part of the DOM
     * so that we can instantiate the map here */
    self.sourceLoaded = function(){

        self.map = L.map("mapid").setView([41.49, -81.69], 10);
        L.esri.basemapLayer("Streets").addTo(self.map);

        self.rootvm.is_busy(true);

        /* Look up map location */

        /*
        return $.ajax({
            url: "/api/location",
            type: "GET",
            dataType: "json",
            complete: function () {
                self.rootvm.is_busy(false);
            },
            success: function (data) {
                if (data.success) {
                    self.create_feature_layer(new Location(data['location']))
                }
                else {
                    toastr.error(data.message);
                }
            }
        });
        */

    };

    /* Makes an outline of an area on the map*/
    self.create_feature_layer = function(new_location){

        console.log(new_location.location_shape_json());

        var layer_coordinates = new_location.location_shape_json();

        /*
        for (var layer in layer_coordinates){
            layers.push(L.geoJson(layer))
        }*/

        var geoToAdd = [L.geoJson(layer_coordinates, {style: {color:"#444", opacity:.4, fillColor:"#72B5F2", weight:1, fillOpacity:0.6}})];

        var fg = L.featureGroup(geoToAdd)
        fg.addTo(self.map);

        self.added_map_layers.push(fg);

    }

};
