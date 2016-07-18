function Location (data) {

    var self = this;
    self.type = "location";
    self.rootvm = data.rootvm;

    self.location_uuid = ko.observable(data.location_uuid);
    self.title = ko.observable(data.title);
    self.description = ko.observable(data.description);
    self.location_type = ko.observable(data.location_type);
    self.location_shape_json = ko.observable(data.location_shape_json);

    self.indicators = ko.observableArray([]);

    self.look_up_indicator_and_values = function(){

        /* At some point, we're going to need the tab we're on
         * so that we only return the correct info -- unless
         * that's computed on the HTML / js side */

        // only do this if we need to:
        //
        console.log(self.indicators().length == 0);
        if(self.indicators() == 0){

            self.rootvm.is_busy(true);

            return $.ajax({
                url: "/api/indicator-categories-with-values-by-location",
                type: "GET",
                dataType: "json",
                data: {'location_uuid':self.location_uuid()},
                complete: function () {

                    self.rootvm.is_busy(false);
                },
                success: function (data) {
                    if (data.success) {
                        console.log(data);
                        self.indicators.push(1);
                    }
                    else {
                        toastr.error(data.message);
                    }
                }
            });
        }
    };

    // Away to see my various indicator values?
};
