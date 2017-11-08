with bad as
(
    select location_uuid as bad_loc_uuid
    from locations

    -- Notice the missing dot at the end...
    where title = 'Collinwood Nottingham Villages Dev. Corp'
),

good as
(
    select locations.location_uuid as good_loc_uuid, bad.bad_loc_uuid
    from locations

    cross join bad

    -- Notice the dot at the end...
    where locations.title = 'Collinwood Nottingham Villages Dev. Corp.'
)

update indicator_location_values ilv
set location_uuid = good.good_loc_uuid
from good
where ilv.location_uuid = good.bad_loc_uuid

returning ilv.*
;

delete from locations
where title = 'Collinwood Nottingham Villages Dev. Corp'
;

