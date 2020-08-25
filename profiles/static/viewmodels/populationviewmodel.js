"use strict";

/* Got execute on enter from :
   http://stackoverflow.com/questions/23087721/call-function-on-enter-key-press-knockout-js

   bind like this

   data-bind="executeOnEnter: sendMessage, button : buttonSelector"
*/

function PopulationViewModel (data) {

    var self = this;

    self.type = "PopulationViewModel";
    self.rootvm = data.rootvm;

    self.parentvm = data.parentvm;

    self.location_uuid = ko.observable();
    self.indicatorcomparisonvm = new IndicatorComparisonByRaceViewModel(data);

    self.location_uuid.subscribe(function(){
        self.by_race_selector(undefined);
    });
    self.by_race_selector = ko.observable();

    self.expand_everything = ko.observable();
    self.show_population_by_race = ko.observable(false);
    self.show_population_by_age = ko.observable(false);
    self.show_population_by_nativity = ko.observable(false);

    self.initialize = function(){
        if(self.location_uuid()){
            self.parentvm.location_uuid(self.location_uuid());
        }
    };

    self.selected_chart_year = ko.observable();
    self.selected_chart_year.subscribe(function(){
        self.show_chart(true);
        self.update_chart()
    });

    self.update_chart = function(i){

        if(self.by_race_selector() && self.selected_chart_year())
        {
            self.indicatorcomparisonvm.location_uuid(self.location_uuid());
            self.indicatorcomparisonvm.indicator_uuid(self.by_race_selector().indicator_uuid());
            self.indicatorcomparisonvm.year(self.selected_chart_year().value);
            self.indicatorcomparisonvm.update_chart();
        }
    }

    /* This should also include the order we want to display*/
    self.indicator_titles = ['pop', 'cvpop', 'mpop',
        'nhw' ,'_nhw', 'cvnhw', 'mnhw', 'cv_nhw', 'm_nhw',
        'nhb', '_nhb', 'cvnhb', 'mnhb', 'cv_nhb', 'm_nhb',
        'nhapi', '_nhapi','cvnhapi', 'mnhapi', 'cv_nhapi', 'm_nhapi',
        'nho', '_nho', 'cvnho', 'mnho', 'cv_nho', 'm_nho',
        'hisp', '_hisp', 'cvhisp', 'mhisp', 'cv_hisp', 'm_hisp',
        'popls5', '_popls5', 'cvpopls5', 'mpopls5', 'cv_popls5', 'm_popls5',
        'pop5to9', '_pop5to9', 'cvpop5to9', 'mpop5to9', 'cv_pop5to9', 'm_pop5to9',
        'pop10to14', '_pop10to14', 'cvpop10to14', 'mpop10to14', 'cv_pop10to14',
        'm_pop10to14',
        'pop15to19', '_pop15to19', 'cvpop15to19', 'mpop15to19', 'cv_pop15to19',
        'm_pop15to19',
        'pop20to24', '_pop20to24', 'cvpop20to24', 'mpop20to24', 'cv_pop20to24',
        'm_pop20to24',
        'pop25to34', '_pop25to34', 'cvpop25to34', 'mpop25to34', 'cv_pop25to34',
        'm_pop25to34',
        'pop35to44', '_pop35to44', 'cvpop35to44', 'mpop35to44', 'cv_pop35to44',
        'm_pop35to44',
        'pop45to54', '_pop45to54', 'cvpop45to54', 'mpop45to54', 'cv_pop45to54',
        'm_pop45to54', 'pop55to64', '_pop55to64', 'cvpop55to64', 'mpop55to64',
        'cv_pop55to64', 'm_pop55to64',

        'pop65to74', '_pop65to74', 'cvpop65to74', 'mpop65to74', 'cv_pop65to74',
        'm_pop65to74',
        'pop75to84', '_pop75to84', 'cvpop75to84', 'mpop75to84', 'cv_pop75to84',
        'm_pop75to84',
        'pop85p', '_pop85p', 'cvpop85p', 'mpop85p', 'cv_pop85p', 'm_pop85p',
        'native', '_native', 'foreign', '_foreign'

    ];

    self.total_population = ['pop'];

    self.indicators_population = ['nhw' ,'_nhw', 'nhb', '_nhb',
        'nhapi', '_nhapi', 'nho', '_nho', 'hisp', '_hisp'];

    self.indicators_age_population = [
        'popls5',  '_popls5',  'pop5to9',  '_pop5to9',
        'pop10to14',  '_pop10to14',  'pop15to19',  '_pop15to19',
        'pop20to24',  '_pop20to24',  'pop25to34',  '_pop25to34',
        'pop35to44',  '_pop35to44',  'pop45to54',  '_pop45to54',
        'pop55to64',  '_pop55to64',
        'pop65to74',  '_pop65to74',  'pop75to84',  '_pop75to84',
        'pop85p', '_pop85p'];

    self.indicators_nativity_population = [
        'native', '_native', 'foreign', '_foreign'
    ];


    self.indicators_population_overview = ['nhw' ,'nhb',
        'nhapi', 'nho', 'hisp'];

    self.indicator_cv_pairings = {
        'pop':'cvpop',
        'nhw':'cvnhw',
        'nhb':'cvnhb',
        'nhapi':'cvnhapi',
        'nho':'cvnho',
        'hisp':'cvhisp',
        '_nhw':'cv_nhw',
        '_nhb':'cv_nhb',
        '_nhapi':'cv_nhapi',
        '_nho':'cv_nho',
        '_hisp':'cv_hisp',
    }

    self.indicator_moe_pairings = {'pop':'mpop',
        'nhw':'mnhw', 'nhb':'mnhb',
        'nhapi':'mnhapi', 'nho':'mnho',
        'hisp':'mhisp',
        '_nhw':'m_nhw',
        '_nhb':'m_nhb',
        '_nhapi':'m_nhapi',
        '_nho':'m_nho',
        '_hisp':'m_hisp',
        }

    // add some stuff dynamically.
    $.each(self.indicators_age_population, function (index, value) {
        var cv_indicator = "cv" + value;
        var moe_indicator = "m" + value;
        self.indicator_cv_pairings[value] = cv_indicator;
        self.indicator_moe_pairings[value] = moe_indicator;
    });

    self.indicators = ko.observableArray([]);

    self.parentvm.selected_location.subscribe(function(){
        var with_race = true;
        self.parentvm.look_up_indicator_and_values(
            self.indicator_titles,
            self.look_up_indicator_complete, with_race);
    });

    self.csv_link =  ko.computed(function(){

        var base_url= "/api/indicator-categories-with-values-by-location-csv";
        base_url += '?location_uuid=' + self.location_uuid();
        base_url += '&page_title=Population';

        for(var i = 0; i<self.indicator_titles.length; i++)
        {
            base_url += '&indicators[]=' + self.indicator_titles[i];
        };
        return base_url;
    });

    self.observable_timestamps = ko.observableArray([]);

    self.look_up_indicator_complete = function(data){

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

        for (var indicator_key in self.indicator_cv_pairings) {

            var ind = Indicator.indicator_by_title(
                self.indicators(),
                indicator_key);

            if(ind){

                var ind_cv = Indicator.indicator_by_title(
                    self.indicators(),
                    self.indicator_cv_pairings[indicator_key]);

                ind.indicator_CV(ind_cv);

                var ind_moe = Indicator.indicator_by_title(self.indicators(),
                    self.indicator_moe_pairings[indicator_key]);

                ind.indicator_MOE(ind_moe);
            }
        }

    }

    self.pretty_timestamps = ko.pureComputed(function(){
        return ko.utils.arrayMap(self.observable_timestamps(), function(item){
            return {value: item.year(), label:item.year() - 4 + ' - ' + item.year()};
        });

    });

    self.show_chart = ko.observable(false);

    self.drawVisualization = function() {

        var data = new google.visualization.DataTable();

        data.addColumn("string", "Race");
        data.addColumn("number", self.indicator().pretty_label());
        data.addColumn({id: "floor", type: "number", role: "interval"})
        data.addColumn({id: "ceiling", type: "number", role: "interval"})

        for (var i=0; i<self.racial_split().length; i++) {
            var o = self.racial_split()[i];
            var row = [o.chart_label, o.value, o.floor, o.ceiling];
            data.addRow(row);
        }

        var options = {
            title : self.indicator().pretty_label() + ", " + self.year() + ", " + self.location().title(),
            intervals: {
                'lineWidth': 2,
                'color': '383737',
                'style': 'sticks'
            }
        };

        var chart = new google.visualization.ColumnChart(
            document.getElementById('comparisonChart'));
        chart.draw(data, options);
    }

};
