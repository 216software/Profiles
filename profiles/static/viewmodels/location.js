function Location (data) {

    var self = this;
    self.type = "location";
    self.rootvm = data.rootvm;

    self.location_uuid = ko.observable(data.location_uuid);
    self.title = ko.observable(data.title);
    self.description = ko.observable(data.description);
    self.location_type = ko.observable(data.location_type);
    self.location_shape_json = ko.observable(data.location_shape_json);

    // Return NULL or return a [lat, lng] pair.
    self.first_coordinate = ko.computed(function () {

        if (self.location_shape_json()) {

            var first_coordinate = self.location_shape_json().coordinates[0][0][0];

            var lat = first_coordinate[1];
            var lng = first_coordinate[0];

            return [lat, lng];

        }


    });

    self.area = ko.observable();
    self.display_me = data.display_me;
    self.print_friendly_name = data.print_friendly_name;

    self.indicator_values = ko.observableArray([]);

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



    self.short_location_type = ko.computed(function(){
        if(self.location_type() == 'community development corporation'){
            return 'cdc';
        }
        else if(self.location_type() == 'neighborhood'){
            return 'nbhd';
        }
        else{
            return self.location_type();
        }
    });

    self.look_up_indicator_and_values = function(){

        /* At some point, we're going to need the tab we're on
         * so that we only return the correct info -- unless
         * that's computed on the HTML / js side */

        // only do this if we need to:
        //

        if(self.indicator_values() == 0){

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


                        /* Data is mapped categories, to indicator to
                         * values
                         *
                         * category [ indicators [indicator_values, ..], ..  ]
                         **/

                        self.indicator_values(ko.utils.arrayMap(
                            data.indicator_values || [],
                            function (x) {
                                x.rootvm = self.rootvm;
                                return new IndicatorCategory(x);
                            }));

                    }
                    else {
                        toastr.error(data.message);
                    }
                }
            });
        }
    };

    self.look_up_shape_json = function(){

        var d = new $.Deferred()

        $.ajax({
            url: "/api/location-shape-json",
            type: "GET",
            dataType: "json",
            data: {'location_uuid':self.location_uuid()},
            complete: function () {
                self.rootvm.is_busy(false);
            },
            success: function (data) {
                if (data.success) {
                    self.location_shape_json(data.location_shape_json);
                    d.resolve()
                }
                else {
                    toastr.error(data.message);
                    d.reject()
                }
            }
        });

        return d;

    };

    self.leaflet_feature = function(year){

        return {'type':'Feature',
                'properties':{'name':self.title(),
                              'location_type': self.location_type(),
                              'year':year,
                              'indicator_value': self.indicator_value_by_year(year)
            },
            'geometry': self.location_shape_json()
        };
    };

    // Away to see my various indicator values?
};
