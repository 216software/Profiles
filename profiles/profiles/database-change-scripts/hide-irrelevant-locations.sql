update locations
set display_me = false
where title in (
    'Unknown neighborhood',
    'Suburbs'
);

-- Copy the CMSD stuff over to the Cleveland location
with cleveland_location as
(
    select location_uuid
    from locations
    where title = 'Cleveland'
),

cmsd as
(
    select locations.location_uuid as cmsd_location_uuid,
    cleveland_location.location_uuid as cleveland_location_uuid

    from locations

    cross join cleveland_location

    where locations.title in (
        'CMSD',
        '__Cleveland Municipal School District'
    )
)

update indicator_location_values
set location_uuid = cmsd.cleveland_location_uuid
from cmsd
where indicator_location_values.location_uuid = cmsd.cmsd_location_uuid
;
