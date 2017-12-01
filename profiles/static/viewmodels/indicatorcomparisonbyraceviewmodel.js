"use strict";


function IndicatorComparisonByRaceViewModel (data) {

    /* We want to be able to chart an indicator by race.
     *
     * There are two use cases -- a single indicator by race
     * such as Jobs in Neighborhood,
     *
     * but then also a double indicator by race, such as population
     * split by age category by race
     *
     * so we should get an array of arrays with titles like:
     *
     * ['overarching Indicator - Title', 'White', 'Black', 'Asian', 'etc']
     *
     * We can send a list of these indicator titles too the server
     */

    var self = this;


    self.type = "IndicatorComparisonByRaceViewModel";
    self.rootvm = data.rootvm;

    self.initialize = function(){

        self.selected_indicator().indicator_uuid(self.indicator_uuid());

        // Don't do any AJAX requests unless we have a selected
        // location.

        if (self.rootvm.startpagevm.location_uuid()) {

            self.get_all_indicator_values();

            self.selected_indicator().look_up_details().then(function(){

                google.charts.load('current', {'packages':['corechart']});
                google.charts.setOnLoadCallback(self.drawVisualization);

            });
        }
    };


    self.drawVisualization = function() {

        // TODO: replace these bogus numbers with real numbers.
        var data = google.visualization.arrayToDataTable([
         ['Race', self.selected_indicator().pretty_label()],
         ['White',  165],
         ['Black',  135],
         ['Asian',  157],
         ['Other',  139],
        ]);

        var options = {
          title : 'Indicator by Race',
          vAxis: {title: 'Count'},
          hAxis: {title: 'Race'},
          seriesType: 'bars',
        };
        var chart = new google.visualization.ComboChart(
            document.getElementById('comparisonChart'));
        chart.draw(data, options);
    }

    self.indicator_uuid = ko.observable();
    self.location_uuid = ko.observable();
    self.year = ko.observable();

    self.selected_indicator = ko.observable(new Indicator({rootvm:data.rootvm}));

    // This is an x by x chart -- so we assume counts for the variables
    // but then we break down into different arrays by race
    self.indicator_values_by_race = ko.observableArray([]);
    self.observable_timestamps = ko.observableArray([]);

    self.observable_timestamp_options = ko.computed(function(){

        // This is a bit of a hack since we don't exactly handle ranges
        // the best...
        var options = [];

        if(self.rootvm.startpagevm.educationvm.indicator_titles.indexOf(
                self.selected_indicator().title()) >= 0){

            for(var i = 0; i < self.observable_timestamps().length; i++){
                options.push({'value':self.observable_timestamps()[i].year(),
                    'text':(parseInt(self.observable_timestamps()[i].year()) - 1) + '-' +
                        self.observable_timestamps()[i].year() })
            }
        }
        else if(self.observable_timestamps().length > 2){
            for(var i = 0; i < self.observable_timestamps().length; i++){
                options.push({'value':self.observable_timestamps()[i].year(),
                    'text':self.observable_timestamps()[i].year()})
            }

        }
        else if(self.observable_timestamps().length == 2){

            // Then our second set of values is really a range
            options.push({'value':self.observable_timestamps()[0].year(),
                    'text':self.observable_timestamps()[0].year()})
            options.push({'value':self.observable_timestamps()[1].year(),
                    'text':'2010 - ' + self.observable_timestamps()[1].year()})

        }

        else if(self.observable_timestamps().length == 1){

            // Then our second set of values is really a range
            options.push({'value':self.observable_timestamps()[0].year(),
                    'text':'Avg. 2009 - ' + self.observable_timestamps()[0].year()})
        }

        return options;
    });

    self.get_all_indicator_values = function () {

        self.rootvm.is_busy(true);

        return $.ajax({
            url: "/api/indicator-values-by-race",
            type: "GET",
            dataType: "json",
            processData: true,

            data: {
                'indicator_uuid': self.selected_indicator().indicator_uuid(),
                'location_uuid': self.location_uuid(),
                'year': self.year()
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

                    self.indicator_values_by_race(ko.utils.arrayMap(
                        data.indicatorvalues || [],
                        function (x) {
                            console.log(x);
                        }));

                }
                else {
                    toastr.error(data.message);
                }
            }
        });
    };

    self.sourceLoaded = function(){
        console.log('indicator comparison by race source loaded')
    };

    self.update_chart = function(){

        // First clear map if it's got stuff on it
        if(self.geojson != undefined){
            self.clear_map();
        }


        var geoToAdd = []
        var geoValues = []


        ko.utils.arrayForEach(self.location_search_filtered(), function(loc){
            var leaf_feature = loc.leaflet_feature(self.map_selected_year().value);

            // only add if we have a value
            if(typeof(leaf_feature.properties.indicator_value) == 'function'){
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


    /* These are mapping things */


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

