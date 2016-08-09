delete from locations
where length(title) >= 115
and location_uuid not in (
    select location_uuid
    from indicator_location_values
);

delete from locations
where length(title) = 0
and location_uuid not in (
    select location_uuid
    from indicator_location_values
);

alter table locations
add column display_me boolean not null default true;

update locations
set display_me = false
where title ~ '^_';

with good_loc as (
    select *
    from locations
    where location_type = 'county'
    and title = 'Cuyahoga county'
),

bad_loc as (
    select *
    from locations
    where location_type = 'neighborhood'
    and title = 'Cuyahoga county'
)

update indicator_location_values
set location_uuid = good_loc.location_uuid
from good_loc
cross join bad_loc
where indicator_location_values.location_uuid = bad_loc.location_uuid
;
