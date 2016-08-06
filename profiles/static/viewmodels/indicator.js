function Indicator (data) {

    /*
     * An indicator with a possible value */

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
    self.value = ko.observable(data.value).extend({number_format:'number'});
    self.observation_timestamp = ko.observable(new moment(data.observation_timestamp));
    self.location_title = ko.observable(data.location_title);
};
