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
    self.indicatorcomparisonbyracevm = new IndicatorComparisonByRaceViewModel({rootvm:self});

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
        if(indicator.title()){
            extra_info += '<br />SAS variable: ' + indicator.title()
        }


        return extra_info;

    }



    /* Export a table we've built up to CSV.
     *
     * Code based on:
     * https://gist.github.com/kalebdf/ee7a5e7f44416b2116c0
    */
    // Temporary delimiter characters unlikely to be typed by keyboard
    // This is to avoid accidentally splitting the actual contents
    self.tmpColDelim = String.fromCharCode(11); // vertical tab character
    self.tmpRowDelim = String.fromCharCode(0); // null character

    // actual delimiter characters for CSV format
    self.colDelim = '","';
    self.rowDelim = '"\r\n"';

    self.exportTableToCSV = function(context, tableIDs, filename) {

        // console.log($table);

        var csv = '"';
        for (var i = 0; i < tableIDs.length; i++){
            var $table = $('#' + tableIDs[i]);

            var $headers = $table.find('tr:has(th)')
                ,$rows = $table.find('tr:has(td)');

            // Grab text from table into CSV formatted string
            csv += self.formatRows($headers.map(self.grabRow));
            csv += self.rowDelim;
            csv += self.formatRows($rows.map(self.grabRow));
            csv += self.rowDelim;

        }

        csv += '"';

            // Data URI
        var csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csv);

        // For IE (tested 10+)
        if (window.navigator.msSaveOrOpenBlob) {
            var blob = new Blob([decodeURIComponent(encodeURI(csv))], {
                type: "text/csv;charset=utf-8;"
            });
            navigator.msSaveBlob(blob, filename);
        } else {
            $(event.target)
                .attr({
                    'download': filename
                    ,'href': csvData
                    //,'target' : '_blank' //if you want it to open in a new window
            });
        }
    };

    //------------------------------------------------------------
        // Helper Functions
        //------------------------------------------------------------
        // Format the output so it has the appropriate delimiters
    self.formatRows = function(rows){
        return rows.get().join(self.tmpRowDelim)
            .split(self.tmpRowDelim).join(self.rowDelim)
            .split(self.tmpColDelim).join(self.colDelim);
    };
    // Grab and format a row from the table
    self.grabRow = function (i,row){

        var $row = $(row);
        //for some reason $cols = $row.find('td') || $row.find('th') won't work...
        var $cols = $row.find('td');
        if(!$cols.length) $cols = $row.find('th');

        return $cols.map(self.grabCol)
                    .get().join(self.tmpColDelim);
    };

    // Grab and format a column from the table
    self.grabCol = function(j,col){
        var $col = $(col);
        var $text = null;

        // We might have a whole bunch of spans
        if($col.find('strong').length >= 1){
            $text = $col.find('strong').text()
        }
        else if($col.find('span').length > 1){
            $text = $col.find('span').first().text();
        }
        else if($col.find('span.show-only-print').length > 0){
            $text = $col.find('span').first().text();
        }
        else{
            $text = $col.text();
        }
        return $text.replace('"', '""'); // escape double quotes

    };
};
