"use strict";

/* Got execute on enter from :
   http://stackoverflow.com/questions/23087721/call-function-on-enter-key-press-knockout-js

   bind like this

   data-bind="executeOnEnter: sendMessage, button : buttonSelector"
*/

function CommunityViewModel (data) {

    var self = this;

    self.type = "CommunityViewModel";
    self.rootvm = data.rootvm;
    self.parentvm = data.parentvm;

    self.map = undefined;
    self.added_map_layers = [];

    self.locations = ko.observableArray([]);
    self.location_types = ko.observableArray([]);

    /* We might have a selected location from the parameter line */
    self.location_uuid = ko.observable(data.location_uuid);

    self.selected_location = ko.observable(new Location({rootvm:data.rootvm}));
    self.selected_location_type = ko.observable();

    self.filtered_locations = ko.computed(function(){

         if(self.selected_location_type() != undefined){
             return ko.utils.arrayFilter(self.locations(), function(l) {
                return l.location_type() == self.selected_location_type();
            });
        }
        else{
            return self.locations();
        }

    });

    self.initialize = function(){

        self.get_all_location_types().then(self.get_all_locations).
            then(self.selected_location_initialize);
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

        self.map = L.map("popmapid").setView([41.49, -81.69], 10);
        L.esri.basemapLayer("Streets").addTo(self.map);

        self.rootvm.is_busy(true);

        /* Look up map location */

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

    };


    self.change_location = function(){

        /* Updates the map and then looks up values for
         * a given location */

        // Remove any old layers:
        for (var index in self.added_map_layers){
            self.map.removeLayer(self.added_map_layers[index]);
        }

        self.create_feature_layer(self.selected_location());

        pager.navigate('start/location?location_uuid=' +
            self.selected_location().location_uuid());

        /* Also -- look up data for this location */
        self.selected_location().look_up_indicator_and_values();
    }

    /* Makes an outline of an area on the map*/
    self.create_feature_layer = function(new_location){


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

    self.selected_location_initialize = function(){

        if(self.location_uuid() != undefined){
            self.selected_location(ko.utils.arrayFirst(self.locations(), function(loc){
                return self.location_uuid() == loc.location_uuid();
            }));

            // Also, we want our map layer to be updated accordingly
            self.change_location();

        }
        else{
            return false;
        }
    };

    self.indicator_titles = ["_voter"];

    self.indicators = ko.observableArray([]);

    self.csv_link =  ko.computed(function(){

        var base_url= "/api/indicator-categories-with-values-by-location-csv";
        base_url += '?location_uuid=' + self.location_uuid();
        base_url += '&page_title=ProgressMetrics';

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

    self.look_up_indicator_complete = function(data) {

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
