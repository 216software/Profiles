-- We want cleveland to be a city -- we have duplicate cleveland cities

delete from indicator_location_values where location_uuid = (select location_uuid from locations where title = 'Cleveland City' and location_type = 'community development corporation');
delete from locations where title = 'Cleveland City' and location_type = 'community development corporation';
update locations set location_type = 'city' and title = 'Cleveland' where title = 'Cleveland City';
