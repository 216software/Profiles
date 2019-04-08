function Indicator (data) {

    /*
     * An indicator with a possible value */
    var self = this;
    self.type = "Indicator";
    self.rootvm = data.rootvm;

    self.indicator_uuid = ko.observable(data.indicator_uuid);
    self.title = ko.observable(data.title);
    self.pretty_label = ko.observable(data.pretty_label);
    self.description = ko.observable(data.description);
    self.indicator_value_format = ko.observable(data.indicator_value_format);

    self.definition = ko.observable(data.definition);
    self.universe = ko.observable(data.universe);
    self.limitations = ko.observable(data.limitations);
    self.notes = ko.observable(data.notes);
    self.source = ko.observable(data.data_source);
    self.data_as_of = ko.observable(data.data_as_of);
    self.numerator_tables = ko.observable(data.numerator_tables);
    self.denominator_tables = ko.observable(data.denominator_tables);

    self.percent_change_available = ko.observable(true);

    self.indicator_category = ko.observable(data.indicator_category);

    self.update_self = function(data){
        self.title(data.title);
        self.pretty_label(data.pretty_label);
        self.description(data.description);
        self.indicator_value_format(data.indicator_value_format);

        /* And if we have values, put em here */
    };


    self.indicator_category = ko.observable(data.indicator_category);

    self.racial_split = ko.observableArray([]);

    if(data.racial_split){
            ko.utils.arrayForEach(data.racial_split, function(ind){

                ind.indicator.indicator_values = ind.indicator_values
                // only add if we have a value
                self.racial_split.push(new Indicator(ind.indicator));
            });

    }

    self.look_up_details = function(){

        return $.ajax({
            url: "/api/indicator-details",
            type: "GET",
            data: {'indicator_uuid':self.indicator_uuid()},
            dataType: "json",
            complete: function () {

            },
            success: function (data) {
                if (data.success) {
                    self.update_self(data.indicator);
                }
                else {
                    toastr.error(data.message);
                }
            }
        });
    };

    // If this indicator has a Coefficient Variation associated with it
    self.indicator_CV = ko.observable();
    self.indicator_MOE = ko.observable();

    self.indicator_values = ko.observableArray(ko.utils.arrayMap(
                            data.indicator_values || [],
                            function (x) {
                                x.rootvm = self.rootvm;
                                x.indicator = self;
                                x.indicator.indicator_value_format(x.indicator_value_format);
                                return new IndicatorValue(x);
                            }));

    self.indicator_values_sorted_asc = ko.computed(function(){

        return self.indicator_values.sort(function (left, right) {
            return left.observation_timestamp_year() == right.observation_timestamp_year() ? 0 :
                (left.observation_timestamp_year() < right.observation_timestamp_year() ? -1 : 1) })

    });

    self.most_recent_value = ko.computed(function(){
        if(self.indicator_values().length > 0){
            var val = self.indicator_values_sorted_asc()[self.indicator_values().length - 1];
            return val.value;
        }
    });

    self.most_recent_indicator_value = ko.computed(function(){
        if(self.indicator_values().length > 0){
            var val = self.indicator_values_sorted_asc()[self.indicator_values().length - 1];
            return val;
        }
    });

    self.percent_change_indicator_value = ko.computed(function(){

        if(!self.percent_change_available()){
            return 'n/a';
        }

        if(self.indicator_values().length > 0){
            var first = self.indicator_values_sorted_asc()[0].value()
            var last = self.indicator_values_sorted_asc()[self.indicator_values().length - 1].value();
            if (first == 0){
                return 0;
            }

            // if last is suppressed, get the next to last
            if (last == '999999')
            {
                var x = self.indicator_values_sorted_asc()[
                    self.indicator_values().length - 2]
                if(x){
                    last = x.value();
                }
            }
            result = ((last - first) / first) * 100;
            return format_value(result, 'percent');
        }
    });

    self.average_indicator_value = ko.computed(function(){
        if(self.indicator_values().length > 0){
            var total = 0;
            ko.utils.arrayForEach(self.indicator_values(), function(ind){
                // only add if we have a value
                total += ind.value()
            });
            result = total / self.indicator_values().length;
            return format_value(result, self.indicator_value_format());
        }
    });



    self.indicator_value_by_year = function(year){
        item = ko.utils.arrayFirst(this.indicator_values(), function(iv) {
            return iv.observation_timestamp_year() == year;
        });

        if (item)
        {
            return item.value;
        }
        else{
            return {};
        }
    };

    self.CV_css_mapping = function(value){

        return value > 65 ? 'text-danger' :
            value > 15 ? 'text-warning' :
            'text-success';
    }


    self.print_friendly_CV_and_MOE = function(year){
        var output = '';
        if(self.indicator_CV() != undefined){

            ind_value = self.indicator_CV().indicator_value_by_year(year);
            output = '<br />CV: ' + ind_value.formatted() + ', ';

        }

        if(self.indicator_MOE() != undefined){
            ind_value = self.indicator_MOE().indicator_value_by_year(year);
            output += '<br />MOE ' + ind_value.formatted() + '';
        }
        return output
    };


    self.pretty_CV_and_MOE = function(year){

        var output = '';
        if(self.indicator_CV() != undefined){

            ind_value = self.indicator_CV().indicator_value_by_year(year);
            output = 'CV: <span class="' + self.CV_css_mapping(ind_value()) + '">' +
                format_value(ind_value(),null, 1) + '</span><br />';
            //output = 'CV: <span class="' + self.CV_css_mapping(ind_value()) + '">' +
            //    ind_value.formatted() + '</span><br />';

        }

        if(self.indicator_MOE() != undefined){

            ind_value = self.indicator_MOE().indicator_value_by_year(year);
            output += 'MOE (+/-): ' + format_value(ind_value(),null, 1) + '<br />';
            //output += 'MOE (+/-): ' + ind_value.formatted() + '<br />';
        }

        if(output){
            output += '<p class="small"><a href="/#/faq?tab=datasources">More info on CV &amp; MOE</a></p>';
        }
        return output

    };

    /* If we're a rate, we should display italicized unless
     * we're a not rate, in which case we should not */
    var not_rate_variables = ['_medinc',
        '_grent', '_attend'];

    self.is_a_rate = ko.computed(function(){
        if(self.title() && self.title().length > 0 &&
            not_rate_variables.indexOf(self.title()) == -1){
            return self.title()[0] == '_';
        }
        else{
            return false;
        }
    });
};


/* static-y method :-p
 *
 * Returns an indicator by title, given a list of indicators and a
 * title
 */
Indicator.indicator_by_title = function(indicators, title){

    return ko.utils.arrayFirst(indicators, function (i){
        return i.title() == title;
    });
    return {};

}


function IndicatorValue(data){
    var self = this;
    self.type = "IndicatorValue";
    self.rootvm = data.rootvm;


    /* This should be the indicator that created the value */
    self.indicator = ko.observable(data.indicator);

    // Not sure if the format should be on the actual value, or on
    // the indicator itself
    self.indicator_value_format = ko.observable(data.indicator_value_format);
    /* These will only be filled out if we have a value for this indicator as well
    */
    self.value = ko.observable(data.value).extend(
        {number_format:data.indicator_value_format || 'number'}
    );

    self.observation_timestamp = ko.observable(new moment(data.observation_timestamp));
    self.location_title = ko.observable(data.location_title);

    self.observation_timestamp_year = ko.computed(function(){
        if(self.observation_timestamp() != undefined){
            return self.observation_timestamp().year();
        }
    });
};





