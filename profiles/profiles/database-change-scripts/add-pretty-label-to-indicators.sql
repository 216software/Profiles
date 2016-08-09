/* The spreadsheets given to us by CNP have different labels than the
 * indicator description. Add them here */
alter table indicators
add column pretty_label citext;


/* Stabilization Tab */
update indicators set pretty_label = 'Residential Occupancy' where title = 'res_occ';
update indicators set pretty_label = 'Residential Occupancy Rate' where title = '_res_occ';
update indicators set pretty_label = 'Housing Density per square mile' where title = 'hsg_den';
update indicators set pretty_label = 'Foreclosure filings' where title = 'f';
update indicators set pretty_label = 'Sheriff''s sales' where title = 'shf';
update indicators set pretty_label = 'Distressed sales' where title = 'distress';
update indicators set pretty_label = 'Distressed sales rate' where title = '_distress';
update indicators set pretty_label = 'Sales, parcels with no history of foreclosure' where title = 'ntal_sales';
update indicators set pretty_label = 'Sales, parcels with no history of foreclosure rate' where title = '_ntal_sales';
update indicators set pretty_label = 'Median sales price, parcels with no history of foreclosure' where title = 'med_ntal_price';

/* Economy */
update indicators set pretty_label = 'Jobs in neighborhood' where title = 'alljobs';
update indicators set pretty_label = 'Commercial Occupancy' where title = '_bus_occ';


