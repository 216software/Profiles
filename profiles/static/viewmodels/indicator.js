function Indicator (data) {

    /*
     * An indicator with a possible value */

    var self = this;
    self.type = "indicator";
    self.rootvm = data.rootvm;

    self.indicator_uuid = ko.observable(data.indicator_uuid);
    self.title = ko.observable(data.title);
    self.description = ko.observable(data.description);
    self.indicator_value_format = ko.observable(data.indicator_values);

    self.indicator_category = ko.observable(data.indicator_category);

    /* These will only be filled out if we have a value for this indicator as well
    */
    self.value = ko.observable(data.value)
    self.time_period = ko.observable(data.time_period);
    self.location_title = ko.observable(data.location_title);

    // Away to see my various indicator values?
};
