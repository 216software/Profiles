"use strict";

var geojson;

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

        self.map = L.map("comparisonMap").setView([41.49, -81.69], 10);
        L.esri.basemapLayer("Streets").addTo(self.map);

        self.rootvm.is_busy(true);

    };

    self.add_location_outlines = function(){

        var geoToAdd = []

        ko.utils.arrayForEach(self.location_search_filtered(), function(loc){
            geoToAdd.push(loc.leaflet_feature('2011'));
        });

        var featureCollection = {"type": "FeatureCollection", "features":geoToAdd};

        console.log(featureCollection);

        geojson = L.geoJson(featureCollection,{
            style: makeStyle,
            onEachFeature:makeOnEachFeature}).addTo(self.map);



        mapInfo.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
            this.update();
            return this._div;
        };

        // method that we will use to update the control based on feature properties passed
        mapInfo.update = function (props) {
            console.log(props);
            this._div.innerHTML = '<h4>' + self.selected_indicator().pretty_label() +
                '</h4>' +
                (props ?
                '<b>' + props.name + '</b><br />' + props.indicator_value.formatted()
                : 'Hover over a state');
        };

        mapInfo.addTo(self.map);

        /*
        var geoToAdd = [L.geoJson(layer_coordinates,
            {style:
                {color:"#444",
                 opacity:.4,
                 fillColor:"#72B5F2",
                 weight:1,
                 fillOpacity:0.6}})];

            */

    };

    /* Makes an outline of an area on the map*/
    self.create_feature_layer = function(new_location){

        var layer_coordinates = new_location.location_shape_json();



        /*
        for (var layer in layer_coordinates){
            layers.push(L.geoJson(layer))
        }*/

        var geoToAdd = [L.geoJson(layer_coordinates,
            {style:
                {color:"#444",
                 opacity:.4,
                 fillColor:"#72B5F2",
                 weight:1,
                 fillOpacity:0.6}})];

        var fg = L.featureGroup(geoToAdd)
        fg.addTo(self.map);

        self.added_map_layers.push(fg);

    }


    /* These are mapping things */
};
var mapInfo = L.control();

function makeStyle(feature) {
    return {
        fillColor: '#FC4E2A', //getColor(feature.properties.density),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    mapInfo.update(layer.feature.properties);
    if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
    }


}

function resetHighlight(e) {
    geojson.resetStyle(e.target);
    mapInfo.update();
}

function makeOnEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
    });
}
