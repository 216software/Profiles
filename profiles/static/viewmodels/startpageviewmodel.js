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

        self.get_all_location_types().then(self.get_all_locations);
    };

    self.get_all_location_types = function(){

        console.log('location types');

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

        console.log('locations');

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

        self.rootvm.is_busy(false);

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

        // Remove any old layers:

        for (var index in self.added_map_layers){
            console.log('removing layer' , self.added_map_layers[index]);
            self.map.removeLayer(self.added_map_layers[index]);
        }
        console.log('changing location on map');

        self.create_feature_layer(self.selected_location());

        pager.navigate('start/location');


        /* Also -- look up data for this location */

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
        console.log('using location uuid param, do the init here');
    };
};
