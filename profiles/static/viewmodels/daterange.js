function DateRange (data) {

    var self = this;
    self.type = "DateRange";
    self.rootvm = data.rootvm;

    self.starting_date = ko.observable(data.starting_date);
    self.ending_date = ko.observable(data.ending_date);

    // If there is no ending date, but should be treated as the present
    self.no_ending = ko.observable(data.no_ending);

    /* If starting date is after ending date, we have a bug */
    self.starting_date_has_error = ko.computed(function(){

        if((self.starting_date() != undefined && self.starting_date() != '') &&
            self.ending_date() != undefined && self.ending_date() != ''){

            return new moment(self.starting_date()).diff(
                new moment(self.ending_date())) >= 0;
        }
        /* if ending date is blank, check for today being ending date */
        else if(self.starting_date() != undefined && self.starting_date() != '' &&
            self.ending_date() == undefined){

            var diff = moment(self.starting_date()).diff(new moment());

            return moment.duration(diff).days() <= -1;

        }
        else{
           return false;
        }
    });


    self.complete = ko.computed(function(){

        if(self.starting_date() && self.ending_date() &&
            !self.starting_date_has_error()){
            return true;
        }
        if(self.no_ending() == true && self.starting_date() &&
            !self.starting_date_has_error()){
            return true;
        }
        else{
            return false;
        }
    });

};



