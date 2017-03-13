update indicators set title = '_band1' where title = 'pctband1';
update indicators set title = '_band2' where title = 'pctband2';
update indicators set title = '_band3' where title = 'pctband3';

-- Also, Cleveland rpass10 and _rpass10 need to be updated for 2014-2015
-- school year

update indicator_location_values set value = 999999 where location_uuid = (select location_uuid from locations where title = 'Cleveland') and indicator_uuid = (select indicator_uuid from indicators where title = 'rpass10') and date_part('year', observation_timestamp) = '2015';

update indicator_location_values set value = 999999 where location_uuid = (select location_uuid from locations where title = 'Cleveland') and indicator_uuid = (select indicator_uuid from indicators where title = '_rpass10') and date_part('year', observation_timestamp) = '2015';

