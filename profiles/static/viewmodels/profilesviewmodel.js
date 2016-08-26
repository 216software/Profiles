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
};
