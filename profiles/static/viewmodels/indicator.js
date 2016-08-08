function Indicator (data) {

    /*
     * An indicator with a possible value */

    console.log(data);

    var self = this;
    self.type = "Indicator";
    self.rootvm = data.rootvm;

    self.indicator_uuid = ko.observable(data.indicator_uuid);
    self.title = ko.observable(data.title);
    self.description = ko.observable(data.description);
    self.indicator_value_format = ko.observable(data.indicator_value_format);

    self.indicator_category = ko.observable(data.indicator_category);

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

    self.percent_change_indicator_value = ko.computed(function(){

        var first = self.indicator_values_sorted_asc()[0].value()
        var last = self.indicator_values_sorted_asc()[self.indicator_values().length - 1].value();

        return ((last - first) / first) * 100;

    });

    self.indicator_value_by_year = function(year){
        item = ko.utils.arrayFirst(this.indicator_values(), function(iv) {
            return iv.observation_timestamp_year() == year;
        });

        if (item)
        {
            return item.value();
        }
        else{
            return null;
        }
    };

    console.log(self.indicator_values());

    // Away to see my various indicator values?
};

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
    self.value = ko.observable(data.value).extend({number_format:data.indicator_value_format || 'number'});
    self.observation_timestamp = ko.observable(new moment(data.observation_timestamp));
    self.location_title = ko.observable(data.location_title);

    self.observation_timestamp_year = ko.computed(function(){
        if(self.observation_timestamp() != undefined){
            return self.observation_timestamp().year();
        }
    });
};
