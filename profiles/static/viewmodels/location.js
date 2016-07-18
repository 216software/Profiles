function Location (data) {

    var self = this;
    self.type = "location";
    self.rootvm = data.rootvm;

    self.location_uuid = ko.observable(data.location_uuid);
    self.title = ko.observable(data.title);
    self.description = ko.observable(data.description);
    self.location_type = ko.observable(data.location_type);
    self.location_shape_json = ko.observable(data.location_shape_json);

    self.look_up_indicator_and_values = function(){

        self.rootvm.is_busy(true);

        return $.ajax({
            url: "/api/location",
            type: "GET",
            dataType: "json",
            complete: function () {

                self.rootvm.is_busy(false);
            },
            success: function (data) {
                if (data.success) {
                    self.create_feature_layer(new Location(data['location']))
                }
                else {
                    toastr.error(data.message);
                }
            }
        });

    });

    // Away to see my various indicator values?
};
