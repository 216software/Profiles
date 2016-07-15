function Location (data) {

    var self = this;
    self.type = "location";
    self.rootvm = data.rootvm;

    self.location_uuid = ko.observable(data.location_uuid);
    self.title = ko.observable(data.title);
    self.description = ko.observable(data.description);
    self.location_type = ko.observable(data.location_type);
    self.location_shape_json = ko.observable(data.location_shape_json);

    // Away to see my various indicator values?

};
