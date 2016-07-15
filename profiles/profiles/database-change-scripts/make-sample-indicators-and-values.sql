insert into indicators (title, description, indicator_value_format, indicator_category)
values ('Total Population', 'Total Population', 'number', 'population');

insert into indicators (title, description, indicator_value_format, indicator_category)
values ('Male Population', 'Population Number of Male Inhabitants', 'number', 'population');

insert into indicators (title, description, indicator_value_format, indicator_category)
values ('Female Population', 'Population Number of Female Inhabitants', 'number', 'population');

/* Ok, now to insert some values */


/* 2010 values */
insert into indicator_location_values (indicator_uuid, location_uuid, time_period, value)
 select indicator_uuid, location_uuid, '2010', 10000

from indicators i, locations l
where i.title = 'Total Population' and l.title = 'Hough';

insert into indicator_location_values (indicator_uuid, location_uuid, time_period, value)
 select indicator_uuid, location_uuid, '2010', 5000

from indicators i, locations l
where i.title = 'Male Population' and l.title = 'Hough';

insert into indicator_location_values (indicator_uuid, location_uuid, time_period, value)
 select indicator_uuid, location_uuid, '2010', 5000

from indicators i, locations l
where i.title = 'Female Population' and l.title = 'Hough';


/* 2000 values */
insert into indicator_location_values (indicator_uuid, location_uuid, time_period, value)
 select indicator_uuid, location_uuid, '2000', 15000

from indicators i, locations l
where i.title = 'Total Population' and l.title = 'Hough';

insert into indicator_location_values (indicator_uuid, location_uuid, time_period, value)
 select indicator_uuid, location_uuid, '2000', 7000

from indicators i, locations l
where i.title = 'Male Population' and l.title = 'Hough';

insert into indicator_location_values (indicator_uuid, location_uuid, time_period, value)
 select indicator_uuid, location_uuid, '2000', 8000

from indicators i, locations l
where i.title = 'Female Population' and l.title = 'Hough';
