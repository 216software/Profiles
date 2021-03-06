"use strict";


function IndicatorComparisonViewModel (data) {

    var self = this;


    self.type = "IndicatorComparisonViewModel";
    self.rootvm = data.rootvm;

    self.map = undefined;
    self.added_map_layers = [];
    self.markers = [];
    self.geojson = undefined;
    self.mapInfo = undefined;
    self.mapInfo_div = undefined;
    self.map_divisions = undefined;
    self.map_legend = undefined;
    self.map_legend_div = undefined;


    self.map_selected_year = ko.observable();


    self.locations = ko.observableArray([]);
    self.location_types = ko.observableArray([]);

    /* We might have a selected location from the parameter line */
    self.indicator_uuid = ko.observable();
    self.location_uuid = ko.observable();

    self.selected_indicator = ko.observable(new Indicator({rootvm:data.rootvm}));

    self.indicator_locations = ko.observableArray([]);
    self.observable_timestamps = ko.observableArray([]);


    self.observable_timestamp_options = ko.computed(function(){

        // Matt just sidestepping doing it the right way.
        // return [{value: 2010, text: "2006-2010"}, {value: 2015, text:"2011-2015"}];

        // This is a bit of a hack since we don't exactly handle ranges
        // the best...
        var options = [];

        if(self.rootvm.startpagevm.educationvm.indicator_titles.indexOf(
                self.selected_indicator().title()) >= 0){

            for(var i = 0; i < self.observable_timestamps().length; i++){
                options.push({'value':self.observable_timestamps()[i].year(),
                    'label':(parseInt(self.observable_timestamps()[i].year()) - 1) + '-' +
                        self.observable_timestamps()[i].year() })
            }
        }
        else if(self.observable_timestamps().length > 2){
            for(var i = 0; i < self.observable_timestamps().length; i++){
                options.push({'value':self.observable_timestamps()[i].year(),
                    'label':self.observable_timestamps()[i].year()})
            }

        }


        else if(self.selected_indicator().title() && self.selected_indicator().title().indexOf('burden') >= 0){
            options = ko.utils.arrayMap(self.observable_timestamps(), function(item){
                return {value: item.year(), label:item.year() - 4 + ' - ' + item.year()};
            });
        }

        else if(self.selected_indicator().title() && self.selected_indicator().title().indexOf('ebl') >= 0 ){
            options = ko.utils.arrayMap(self.observable_timestamps(), function(item){
                return {value: item.year(), label:item.year() - 4 + ' - ' + item.year()};
            });
        }
        else if(self.selected_indicator().title() && self.selected_indicator().title().indexOf('mort') >= 0 ){
            options = ko.utils.arrayMap(self.observable_timestamps(), function(item){
                return {value: item.year(), label:item.year() - 4 + ' - ' + item.year()};
            });
        }

        else if(self.observable_timestamps().length == 2){

            // Then our second set of values is really a range
            /*
            options.push({'value':self.observable_timestamps()[0].year(),
                    'label':'2006-'+self.observable_timestamps()[0].year()})

            options.push({'value':self.observable_timestamps()[1].year(),
                    'label':'2011-' + self.observable_timestamps()[1].year()})
            */

            options = ko.utils.arrayMap(self.observable_timestamps(), function(item){
                return {value: item.year(), label:item.year() - 4 + ' - ' + item.year()};
            });


        }



        else if(self.observable_timestamps().length == 1){
            options = ko.utils.arrayMap(self.observable_timestamps(), function(item){
                return {value: item.year(), label:'Avg. ' + (item.year() - 4) + ' - ' + item.year()};
            });

            // Then our second set of values is really a range
            //options.push({'value':self.observable_timestamps()[0].year(),
             //       'label':'Avg. 2009 - ' + self.observable_timestamps()[0].year()})
        }

        return options;
    });

    self.selector_location = ko.observable();

    self.asc = ko.observable(true);
    self.sort_column = ko.observable();
    self.selected_location_type = ko.observable();

    self.location_search = ko.observable();

    self.initialize = function(){

        //We gotta refresh the map
        if(self.map){
            self.map.invalidateSize();
        }

        self.selected_indicator().indicator_uuid(self.indicator_uuid());

        self.selected_indicator().look_up_details();
        self.get_all_location_types().then(self.get_all_locations);

        self.get_all_indicator_values();

        // Reset Sort
        self.asc(true);
        self.sort_column(undefined);

        // When we hit the page again, clear out the map
        if(self.map != undefined){
            self.clear_map();
        }

    };

    self.csv_link =  ko.computed(function(){

        var base_url= "/api/indicator-values-by-indicator-csv";

        base_url += '?indicator_uuid=' + self.selected_indicator().indicator_uuid();
        return base_url;

    });


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

    self.year_click_sort = function(observable_timestamp_option){


        var year = observable_timestamp_option.value;
        self.sort_column(year);


        // now we need to do the actual sort by year here
        // of indicator_locations
        self.indicator_locations.sort(function(left, right){

            var sort_mult = self.asc() ? -1 : 1;
            // need to get in to indicator values and year
            //
            var left_value = left.indicator_value_by_year(year);
            var right_value = right.indicator_value_by_year(year);

            if (typeof(left_value) == 'function' && typeof(right_value) == 'function')
            {
                  return left_value() > right_value() ? 1 * sort_mult : -1 * sort_mult;
            }

           return typeof(left_value) != 'function' && typeof(right_value) != 'function' ? 0 :
                  typeof(right_value) != 'function' ? 1 * sort_mult :
                  -1 * sort_mult;


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
                    'order_by_area':true
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
                                        x.indicator_value_format= self.selected_indicator().indicator_value_format();
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
            url: "/api/all-locations-with-shape-data",
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
        self.map = L.map("comparisonMap").setView([41.49, -81.69], 11);
        L.esri.basemapLayer("Streets").addTo(self.map);
        self.mapInfo = L.control();
        self.legend = L.control({position: 'bottomleft'});
        self.legend.onAdd = self.create_legend;
    };

    self.clear_map = function(){

        self.map.removeLayer(self.geojson);

        for ( var index in self.markers){
            self.map.removeLayer(self.markers[index])
        }

        self.markers = [];

        if(self.legend._map != null){
            self.map.removeControl(self.legend);
        }
        if(self.mapInfo._map != null){
            self.map.removeControl(self.mapInfo);
        }
    };

    self.update_map_button_disable = ko.computed(function(){

        if(self.selected_location_type() != undefined &&
            self.map_selected_year() != undefined){
            return false;
        }
        else{
            return true;
        }

    });

    self.update_map = function(){

        // First clear map if it's got stuff on it
        if(self.geojson != undefined){
            self.clear_map();
        }


        var geoToAdd = [];
        var geoValues = [];


        ko.utils.arrayForEach(self.location_search_filtered(), function(loc){

            var leaf_feature = loc.leaflet_feature(self.map_selected_year().value);

            // only add if we have a value
            if(typeof(leaf_feature.properties.indicator_value) == 'function'
                && leaf_feature.geometry){
                geoToAdd.push(leaf_feature);
                geoValues.push(leaf_feature.properties.indicator_value);
            }
        });

        // Sort geo to add by value asc

        geoValues.sort(function(a, b){
            return a()-b();
        });


        //Make divisions
        self.map_divisions = []

        if (geoValues.length >= 5)
        {
            self.map_divisions = [geoValues[0],
                geoValues[Math.floor(geoValues.length / 4)],
                geoValues[Math.floor(geoValues.length / 2)],
                geoValues[Math.floor(geoValues.length * .75)],
                geoValues[geoValues.length - 1]];
        }
        else{
            self.map_divisions[geoValues[0], geoValues[geoValues.length-1]]
        }

        // This adds the actual layers to the map
        var featureCollection = {"type": "FeatureCollection", "features":geoToAdd};

        console.debug(featureCollection);

        self.geojson = L.geoJson(featureCollection,{
            style: self.makeStyle,
            onEachFeature:self.makeOnEachFeature}).addTo(self.map);

        self.mapInfo.onAdd = function (map) {

            if(self.mapInfo_div == undefined){
                // create a div with a class "info"
                self.mapInfo_div = L.DomUtil.create('div', 'info');
                this._div = self.mapInfo_div;
                this.update();
                return this._div;
            }
            else{
                return self.mapInfo_div;
            }
        };

        // method that we will use to update the control based on feature properties passed
        self.mapInfo.update = function (props) {
            this._div.innerHTML = '<h4>' + self.selected_indicator().pretty_label() +
                (props ? ' - ' + self.map_selected_year().text + '</h4>' +
                '<b>' + props.name + '</b><br />' +
                '<i style="background:' +
                self.get_location_color(props.indicator_value()) + '"></i>' +
                props.indicator_value.formatted()
                :'</h4>' + 'Hover over a location or click on a marker');
        };

        self.mapInfo.addTo(self.map);
        self.legend.addTo(self.map);

    };

    /* Makes an outline of an area on the map*/
    self.create_feature_layer = function(new_location){

        var layer_coordinates = new_location.location_shape_json();

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

    self.create_legend = function(map){
        var div;
        var labels = [];


        if(self.map_legend_div == undefined){
            // create a div with a class "info"
            var div = L.DomUtil.create('div', 'info legend');
            self.map_legend_div = div;
        }
        else{
            div = self.map_legend_div;
        }
        // If we redraw map, clear out the div

        $(div).empty();
        // loop through our density intervals and
        // generate a label with a colored square for each interval
        for (var i = 0; i < self.map_divisions.length - 1; i++) {
            div.innerHTML += '<i style="background:' +
                            self.get_location_color(self.map_divisions[i]() + 1) +
                            '"></i> ' +
                            self.map_divisions[i].formatted() +
                            (self.map_divisions[i + 1].formatted() ? '&ndash;' +
                            self.map_divisions[i + 1].formatted() +
                            '<br>' : '+');
        }

        return div;
    };


    self.makeStyle = function (feature) {

        return {
            fillColor: self.get_location_color(feature.properties.indicator_value()),
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.7
        };
    }

    self.layers_highlighted = [];

    self.highlightFeature = function (e, args) {

        if(self.layers_highlighted.length > 0){
            self.resetAllHighlights();
        }

        var layer = (e.layer == undefined ? e.target.layer : e.target)

        layer.setStyle({
            weight: 5,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.7
        });

        self.mapInfo.update(layer.feature.properties);
        if (!L.Browser.ie && !L.Browser.opera) {
            layer.bringToFront();
        }

        // Add to all layers that we've highlighted
        self.layers_highlighted.push(layer);
    }

    self.resetAllHighlights = function(){

        // clear out all highlighted layers
        while(self.layers_highlighted.length > 0){
            self.resetHighlight(self.layers_highlighted.pop());
        }
    }

    self.resetHighlight = function (e) {

        // Gonna reeset all highlights

        var layer = (e.target != undefined ? e.target : e);

        self.geojson.resetStyle(layer);
        self.mapInfo.update();


    }

    self.makeOnEachFeature = function(feature, layer) {

        layer.on({
            mouseover: self.highlightFeature,
            mouseout: self.resetHighlight,
        });

        // Do not draw markers for neighborhoods.
        if (feature.properties.location_type != "neighborhood") {

            var bounds = layer.getBounds();
            // Get center of bounds
            var center = bounds.getCenter();
            // Use center to put marker on map
            var marker = L.marker(center)

            marker.layer = layer
            layer.marker = marker
            self.markers.push(marker);
            marker.on('click',
                self.highlightFeature).addTo(self.map);

        }

    }


    self.get_location_color = function(value){

        if(self.map_divisions.length == 5){
            return value > self.map_divisions[4]()  ? '#00441b' :
               value > self.map_divisions[3]()   ? '#006d2c' :
               value > self.map_divisions[2]()  ?  '#238b45' :
               value > self.map_divisions[1]()  ? '#41ab5d' :
               '#74c476';
        }
        else{
            return '#238b45';
        }
    }


};

