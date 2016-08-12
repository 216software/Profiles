/* The spreadsheets given to us by CNP have different labels than the
 * indicator description. Add them here */

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

/* Workforce */
update indicators set pretty_label = 'Employment' where title = 'emp';
update indicators set pretty_label = '% employment' where title = '_emp';

update indicators set pretty_label = 'Labor force participation' where title = 'lf';
update indicators set pretty_label = '% labor force participation' where title = '_lf';



update indicators set pretty_label = 'Population 25 years and older' where title = 'pop25p';
update indicators set pretty_label = 'Less than 9th grade' where title = 'hsls9';
update indicators set pretty_label = '% of population less than 9th grade' where title = '_hsls9';

update indicators set pretty_label = '9th to 12th grade, no diploma' where title = 'hs9to12';
update indicators set pretty_label = '% of population 9th to 12th grade, no diploma' where title = '_hs9to12';

update indicators set pretty_label = 'High school graduate (includes equivalency)' where title = 'hsgrad';
update indicators set pretty_label = '% of population high school graduate' where title = '_hsgrad';

update indicators set pretty_label = 'Some college, no degree' where title = 'somecoll';
update indicators set pretty_label = '% of population some college' where title = '_somecoll';

update indicators set pretty_label = 'Associate''s Degree' where title = 'assoc';
update indicators set pretty_label = '% of associate''s degree' where title = '_assoc';

update indicators set pretty_label = 'Bachelor''s Degree' where title = 'bs';
update indicators set pretty_label = '% of bachelor''s degree' where title = '_bs';

update indicators set pretty_label = 'Graduate or professional degree' where title = 'prof';
update indicators set pretty_label = '% of grad or professional degree' where title = '_prof';

/* Population */

update indicators set pretty_label = 'Total population' where title = 'pop';

update indicators set pretty_label = 'Non-hispanic white' where title = 'nhw';
update indicators set pretty_label = '% Non-hispanic white' where title = '_nhw';

update indicators set pretty_label = 'Non-hispanic black' where title = 'nhb';
update indicators set pretty_label = '% Non-hispanic black' where title = '_nhb';

update indicators set pretty_label = 'Non-hispanic Asian/Pacific Islander' where title = 'nhapi';
update indicators set pretty_label = '% Non-hispanic Asian/Pacific Islander' where title = '_nhapi';

update indicators set pretty_label = 'Non-hispanic other' where title = 'nho';
update indicators set pretty_label = '% Non-hispanic other' where title = '_nho';

update indicators set pretty_label = 'Hispanic' where title = 'hisp';
update indicators set pretty_label = '% Hispanic' where title = '_hisp';

/* Health */
update indicators set pretty_label = 'Mortality/Life Expectancy' where title = 'le2009';

update indicators set pretty_label = 'Infant Mortality' where title = 'infmort_rate2009';
update indicators set pretty_label = 'Mortality' where title = 'mort_rate2009';
update indicators set pretty_label = 'Blood Lead Levels' where title = '_ebll_c';


