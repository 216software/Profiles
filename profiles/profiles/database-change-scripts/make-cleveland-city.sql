-- We want cleveland to be a city -- we have duplicate cleveland cities


--delete from indicator_location_values where location_uuid = (select location_uuid from locations where title = 'Cleveland City' and location_type = 'community development corporation');
--delete from locations where title = 'Cleveland City' and location_type = 'community development corporation';

update locations set location_type = 'city' , title = 'Cleveland' where title = 'Cleveland City' and location_type = 'neighborhood';
update indicator_location_values set location_uuid = (select location_uuid from locations where title = 'Cleveland') where location_uuid = (select location_uuid from locations where title = 'Cleveland Municipal School District');

-- We don't want to see the other cleveland
update locations set display_me = false where title = 'Cleveland City';
