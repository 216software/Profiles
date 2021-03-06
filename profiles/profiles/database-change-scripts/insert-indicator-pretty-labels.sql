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

/* Progress Indicators */
update indicators set pretty_label = 'Median sales price of residential parcels' where title = 'med_al_price';

update indicators set pretty_label = 'Median sales price: single-family' where title = 'med_sfprice';
update indicators set pretty_label = 'Median sales price: multi-family' where title = 'med_mfprice';

update indicators set pretty_label = 'Median sales price: condo parcels' where title = 'med_cdprice';


update indicators set pretty_label = '# of arms-length sales of single parcels' where title = 'al_sales';


update indicators set pretty_label = 'Single-family sales' where title = 'sfsale';
update indicators set pretty_label = 'Multi-family sales' where title = 'mfsale';

update indicators set pretty_label = 'Condo parcel sales' where title = 'cdsale';


update indicators set pretty_label = '# of arms-length sales of single parcels' where title = 'al_sales';

update indicators set pretty_label = 'Median gross rent' where title = '_grent';
update indicators set pretty_label = '# of renter households' where title = 'cashrent';

update indicators set pretty_label = 'Median Household Income' where title = '_medinc';


update indicators set pretty_label = 'Number of households with income less than $10,000' where title = 'hhincls10k';

update indicators set pretty_label = 'Number of households with income $10,000-14,999' where title = 'hhinc10to15k';
update indicators set pretty_label = 'Number of households with income $15,000-24,999' where title = 'hhinc15to25k';
update indicators set pretty_label = 'Number of households with income $25,000-34,999' where title = 'hhinc25to35k';

update indicators set pretty_label = 'Number of households with income $35,000-49,999' where title = 'hhinc35to50k';
update indicators set pretty_label = 'Number of households with income $50,000-74,999' where title = 'hhinc50to75k';
update indicators set pretty_label = 'Number of households with income $75,000-99,999' where title = 'hhinc75to100k';
update indicators set pretty_label = 'Number of households with income $100,000-149,999' where title = 'hhinc100to150k';
update indicators set pretty_label = 'Number of households with income $150,000-199,999' where title = 'hhinc150to200k';
update indicators set pretty_label = 'Number of households with income $200,000+' where title = 'hhinc200kp';


update indicators set pretty_label = '% income less than $10,000' where title = '_hhincls10k';

update indicators set pretty_label = '% income $10,000-14,999' where title = '_hhinc10to15k';
update indicators set pretty_label = '% income $15,000-24,999' where title = '_hhinc15to25k';
update indicators set pretty_label = '% income $25,000-34,999' where title = '_hhinc25to35k';

update indicators set pretty_label = '% income $35,000-49,999' where title = '_hhinc35to50k';
update indicators set pretty_label = '% income $50,000-74,999' where title = '_hhinc50to75k';
update indicators set pretty_label = '% income $75,000-99,999' where title = '_hhinc75to100k';
update indicators set pretty_label = '% income $100,000-149,999' where title = '_hhinc100to150k';
update indicators set pretty_label = '% income $150,000-199,999' where title = '_hhinc150to200k';
update indicators set pretty_label = '% income $200,000+' where title = '_hhinc200kp';






update indicators set pretty_label = 'Poverty Rate' where title = 'bpv';
update indicators set pretty_label = '% Poverty Rate' where title = '_bpv';
update indicators set pretty_label = 'Population for whom poverty status is determined' where title = 'tpv';

update indicators set pretty_label = 'Persons aged 1+  living below poverty level in same house 1 year ago' where title = 'mbpv_samehou';

update indicators set pretty_label = 'Persons aged 1+  living below poverty level in different house 1 year ago' where title = 'mbpv_diffhou';


/* Education */
update indicators set pretty_label = '3rd Grade Reading Comprehension' where title = 'rpass50';

update indicators set pretty_label = '3rd Grade Math Proficiency' where title = 'mpass50';

/* All others, update pretty label to description */
update indicators set pretty_label = description where pretty_label is null;


