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

    self.map;

    self.initialize = function(selector_id){

        console.log('initing map');

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
                    self.create_feature_layer(data['location'])
                }
                else {
                    toastr.error(data.message);
                }
            }
        });

    };

    /* Makes an outline of an area */
    self.create_feature_layer = function(data){

        console.log(data);

        var layer_coordinates = data['location_shape_json']

        var layers = []
        /*
        for (var layer in layer_coordinates){
            layers.push(L.geoJson(layer))
        }*/

        var layers = [L.geoJson(layer_coordinates, {style: {color:"#444", opacity:.4, fillColor:"#72B5F2", weight:1, fillOpacity:0.6}})];

        L.featureGroup(layers).addTo(self.map);

    }
};
