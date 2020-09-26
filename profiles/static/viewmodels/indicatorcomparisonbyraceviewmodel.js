"use strict";


function IndicatorComparisonByRaceViewModel (data) {

    var self = this;

    self.type = "IndicatorComparisonByRaceViewModel";
    self.rootvm = data.rootvm;

    self.chart_id = ko.observable('comparisonChart' || data.chart_id);
    self.show_racial_breakdown_rows = ko.observable(false);

    self.initialize = function(){

        $.when(
            self.get_indicator_values_by_race()
        ).then(
            function() {
                google.charts.load('current', {'packages':['corechart']});
                google.charts.setOnLoadCallback(self.drawVisualization);
            });
    };

    self.drawVisualization = function() {

        var data = new google.visualization.DataTable();

        data.addColumn("string", "Race");
        data.addColumn("number", self.indicator().pretty_label());
        data.addColumn({id: "floor", type: "number", role: "interval"})
        data.addColumn({id: "ceiling", type: "number", role: "interval"})

        for (var i=0; i<self.racial_split().length; i++) {
            var o = self.racial_split()[i];
            if(o.value < 999999){
                //an o.value of 999999 means not available
                var row = [o.chart_label, o.value, o.floor, o.ceiling];
                data.addRow(row);
            }
        }

        if(self.indicator()){
            var options = {
                title : self.indicator().pretty_label() + ", " + self.year() + ", " + self.location().title(),
                intervals: {
                    'lineWidth': 2,
                    'color': '383737',
                    'style': 'sticks'
                },
                legend: {position:'none'}
            };

            var chart = new google.visualization.ColumnChart(
                document.getElementById(self.chart_id()));
            chart.draw(data, options);
        }
    }

    self.indicator_uuid = ko.observable();
    self.location_uuid = ko.observable();
    self.year = ko.observable();
    self.selected_observation_timestamp = ko.observable();

    // This is an x by x chart -- so we assume counts for the variables
    // but then we break down into different arrays by race
    self.indicator_values_by_race = ko.observableArray([]);
    self.racial_sort_order = ['black', 'white', 'hispanic', 'asian', 'other'];

    self.racial_split = ko.observableArray([]);
    self.location = ko.observable();
    self.indicator = ko.observable();
    self.available_observation_timestamps = ko.observableArray([]);

    self.get_indicator_values_by_race = function () {

        self.rootvm.is_busy(true);

        return $.ajax({
            url: "/api/indicator-values-by-race",
            type: "GET",
            dataType: "json",
            processData: true,

            data: {
                'indicator_uuid': self.indicator_uuid(),
                'location_uuid': self.location_uuid(),
                'year': self.year()
            },

            complete: function () {
                self.rootvm.is_busy(false);
            },

            success: function (data) {

                if (data.success) {

                    self.racial_split(data.racial_split);

                    data.location.rootvm = self.rootvm;
                    self.location(new Location(data.location));

                    data.indicator.rootvm = self.rootvm;
                    self.indicator(new Indicator(data.indicator));

                    self.available_observation_timestamps(
                        data.available_observation_timestamps);

                    self.racial_split.sort(function(left, right){
                        var leftIndex = null;
                        var rightIndex = null;
                        for (var i = 0; i < self.racial_sort_order.length; i++){
                            var left_char_index = left.chart_label.toLowerCase().indexOf(
                                self.racial_sort_order[i]);

                            if(left_char_index != -1 && left_char_index == 0 || (left_char_index > 0 && left.chart_label[left_char_index - 1] != '-')) {

                                leftIndex = i;
                            }
                            var right_char_index = right.chart_label.toLowerCase().indexOf(
                                self.racial_sort_order[i])

                            if(right_char_index != -1 && right_char_index == 0 || (right_char_index > 0 && right.chart_label[right_char_index - 1] != '-')) {
                                rightIndex = i;
                            }

                            if(leftIndex != undefined && rightIndex != undefined){
                                break;
                            }
                        }

                        return leftIndex < rightIndex ? -1 : 1
                    });


                }
                else {
                    toastr.error(data.message);
                }
            }
        });
    };

    self.update_chart = function() {

        self.get_indicator_values_by_race().then(
            function() {
                //self.year(self.selected_observation_timestamp());
                google.charts.load('current', {'packages':['corechart']});
                google.charts.setOnLoadCallback(self.drawVisualization);
            });

    };

};

