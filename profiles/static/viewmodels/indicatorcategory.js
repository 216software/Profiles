function IndicatorCategory (data) {

    /*
     * An indicator with a possible value */

    var self = this;
    self.type = "indicator";
    self.rootvm = data.rootvm;

    self.category = ko.observable(data.indicator_category);

    self.visible = ko.observable(true);

    self.indicators = ko.observableArray(ko.utils.arrayMap(
                            data.indicators || [],
                            function (x) {
                                x.rootvm = self.rootvm;
                                return new Indicator(x);
                            }));


};
