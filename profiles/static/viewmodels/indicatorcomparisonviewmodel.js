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

    self.initialize = function(){

        console.log('indicator comparison initing');

        console.log('look up indicator_uuid ', self.indicator_uuid());

        self.selected_indicator().indicator_uuid(self.indicator_uuid());

        self.selected_indicator().look_up_details();
        self.get_all_location_types().then(self.get_all_locations);

        self.get_all_indicator_values();
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

                    console.log(data);
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
