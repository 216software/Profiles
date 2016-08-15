"use strict";

/* Got execute on enter from :
   http://stackoverflow.com/questions/23087721/call-function-on-enter-key-press-knockout-js

   bind like this

   data-bind="executeOnEnter: sendMessage, button : buttonSelector"
*/

function StartPageViewModel (data) {

    var self = this;

    self.type = "StartPageViewModel";
    self.rootvm = data.rootvm;

    self.map = undefined;
    self.added_map_layers = [];

    self.locations = ko.observableArray([]);
    self.location_types = ko.observableArray([]);

    /* We might have a selected location from the parameter line */
    self.location_uuid = ko.observable(data.location_uuid);

    self.selected_location = ko.observable(new Location({rootvm:data.rootvm}));

    self.selector_location = ko.observable();

    self.selected_location_type = ko.observable();

    self.filtered_locations = ko.computed(function(){

         if(self.selected_location_type() != undefined) {

             return ko.utils.arrayFilter(

                self.locations(),

                function(loc) {

                    if (loc.display_me
                        && loc.location_type() == self.selected_location_type()) {
                        return true;

                    } else {
                        return false;
                    }
                }
            ).sort(function(a, b) {
                if (a.title() < b.title()) {
                    return -1;
                } else if (a.title() > b.title()) {
                    return 1;
                } else {
                    return 0;
                }});
        }

        else {
            return self.locations();
        }
    });

    self.stabilizationvm = new StabilizationViewModel({'rootvm':data.rootvm,
        'parentvm':self});

    self.economyvm = new EconomyViewModel({'rootvm':data.rootvm,
        'parentvm':self});

    self.workforcevm = new WorkforceViewModel({'rootvm':data.rootvm,
        'parentvm':self});

    self.educationvm = new EducationViewModel({'rootvm':data.rootvm,
        'parentvm':self});

    self.healthvm = new HealthViewModel({'rootvm':data.rootvm,
        'parentvm':self});

    self.safetyvm= new SafetyViewModel({'rootvm':data.rootvm,
        'parentvm':self});

    self.populationvm = new PopulationViewModel({'rootvm':data.rootvm,
        'parentvm':self});

    self.progressmetricsvm = new ProgressMetricsViewModel({'rootvm':data.rootvm,
        'parentvm':self});




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


    self.change_location = function(){

        /* Updates the map and then looks up values for
         * a given location */

        // Set selected to location to the one that has been selected
        self.selected_location(self.selector_location());

        // Remove any old layers:
        for (var index in self.added_map_layers){
            console.log('removing layer' , self.added_map_layers[index]);
            self.map.removeLayer(self.added_map_layers[index]);
        }
        console.log('changing location on map');

        self.create_feature_layer(self.selected_location());

        /* Also -- look up data for this location */
        //self.look_up_indicator_and_values();
    }

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


    /* We need to load indicators based on current location and current
     * tab */

    self.indicators = ko.observableArray([]);

    self.look_up_indicator_and_values = function(indicators, success_callback){

        /* At some point, we're going to need the tab we're on
         * so that we only return the correct info -- unless
         * that's computed on the HTML / js side */

        // only do this if we need to:
        //
        self.rootvm.is_busy(true);

        return $.ajax({
            url: "/api/indicator-categories-with-values-by-location",
            type: "GET",
            dataType: "json",
            processData: true,

            data: {'location_uuid':self.selected_location().location_uuid(),
                   'indicators':indicators
                   },

            complete: function () {
                self.rootvm.is_busy(false);
            },
            success: function (data) {
                if (data.success) {
                    console.log(data);

                    success_callback(data);

                    self.indicators(ko.utils.arrayMap(
                        data.indicator_values || [],
                        function (x) {
                            x.rootvm = self.rootvm;
                            return new Indicator(x);
                        }));

                }
                else {
                    toastr.error(data.message);
                }
            }
        });
    };

    self.address_to_geocode = ko.observable();

    self.geocode_results = ko.observableArray([]);

    self.geocode_finished_callback = function (geocode_results, geocode_status) {

        self.geocode_results(geocode_results);

        self.rootvm.is_busy(false);

    };

    self.geocode_address = function () {

        if (!self.address_to_geocode()
            || self.address_to_geocode() < 5) {

            toastr.error("Sorry, I need a longer address!")

        } else {

            self.rootvm.syslog("Geocoding address " + self.address_to_geocode());
            self.rootvm.is_busy(true);

            var geocoder = new google.maps.Geocoder();

            geocoder.geocode(
                {address: self.address_to_geocode()},
                self.geocode_finished_callback);
        }

    };

    self.google_maps_api_loaded = ko.observable(false);

    self.mark_google_maps_api_loaded = function () {
        self.google_maps_api_loaded(true);
    };

    self.containing_neighborhoods = ko.observableArray([]);

    self.find_containing_neighborhood = function (geocode_result) {

        var lat = geocode_result.geometry.location.lat();
        var lng = geocode_result.geometry.location.lng();

        return $.ajax({
            url: "/api/find-containing-neighborhoods",
            type: "GET",

            data: {
                lat: geocode_result.geometry.location.lat(),
                lng: geocode_result.geometry.location.lng()
            },

            dataType: "json",

            complete: function (o, s) {

                if (s != "success") {
                    toastr.error("Sorry, something went wrong!");
                }
            },

            success: function (data) {

                if (data.success) {

                    self.rootvm.syslog(data.message);

                    self.containing_neighborhoods(
                        ko.utils.arrayMap(
                            data.containing_neighborhoods,

                        function (loc) {
                            loc.rootvm = self.rootvm;
                            return new Location(loc);
                        }));
                }

                else {
                    toastr.error(data.message);
                }
            }
        });

    };

    self.center_map_here = function (geocode_result) {

        var lat = geocode_result.geometry.location.lat();
        var lng = geocode_result.geometry.location.lng();

        self.map.setView([lat, lng], 14);
        L.marker([lat, lng]).addTo(self.map);

    };

    self.set_selected_location = function (loc) {

        self.selected_location_type(loc.location_type());

        self.selector_location(ko.utils.arrayFirst(
            self.filtered_locations(),
            function (filtered_loc) {
                return filtered_loc.title() == loc.title();
            }));

        self.address_to_geocode(null);
        self.geocode_results([]);
        self.containing_neighborhoods([]);

    };

};