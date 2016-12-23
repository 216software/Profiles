"use strict";

/* Got execute on enter from :
   http://stackoverflow.com/questions/23087721/call-function-on-enter-key-press-knockout-js

   bind like this

   data-bind="executeOnEnter: sendMessage, button : buttonSelector"
*/

function ProfilesViewModel (data) {

    var self = this;

    self.type = "ProfilesViewModel";
    self.is_busy = ko.observable(false);
    self.syslog = ko.observable();
    self.active_tab = ko.observable();

    self.click_on_enter = function(selector_id){

        // click selector button
        //
        if ($('#' + selector_id).attr('disabled') != 'disabled')
        {
            $('#' + selector_id)[0].click();
        }
    };

    self.startpagevm = new StartPageViewModel({rootvm:self});
    self.indicatorcomparisonvm = new IndicatorComparisonViewModel({rootvm:self});

    /* For update of tabs at the top of the page, subscribe to afterShow
     */
    pager.afterShow.add(function(){
        self.active_tab(pager.getActivePage().currentId);
    });

    // Utility function -- takes an ko observable array of indicators
    // and returns indicator when title is found
    self.indicator_by_title = function(indicators_array, title){
        return ko.utils.arrayFirst(indicators_array(), function(item) {
              return item.title() == title;
        });

    }

    self.indicator_extra_info = function(indicator){
        /*
        Indicator: [variable description]
        Definition: [variable definition ]
        Universe: [universe]
        Limitations: [limitation]
        Notes: [note]
        Source: [source]
        Data as of: [data as of]
        Numerator tables: [numerator tables]
        Denominator tables: [denominator tables]
        */

        var extra_info = 'Indicator: ' + indicator.pretty_label() +
            '<br />Definition: ' + indicator.definition();

        if(indicator.universe()){
            extra_info += '<br />Universe: ' + indicator.universe()
        }
        if(indicator.limitations()){
            extra_info += '<br />Limitations: ' + indicator.limitations()
        }
        if(indicator.notes()){
            extra_info += '<br />Notes: ' + indicator.notes()
        }
        if(indicator.source()){
            extra_info += '<br />Source: ' + indicator.source()
        }
        if(indicator.data_as_of()){
            extra_info += '<br />Data as of: ' + indicator.data_as_of()
        }
        if(indicator.numerator_tables()){
            extra_info += '<br />Numerator Tables: ' + indicator.numerator_tables()
        }
        if(indicator.denominator_tables()){
            extra_info += '<br />Denominator Tables: ' + indicator.denominator_tables()
        }

        return extra_info;

    }
};
