delete from indicator_location_values
where location_uuid in (
    select location_uuid
    from locations

    where title in (
        'Stockyards, Clark Fulton, Brooklyn Center Comm. Dev. Corp.',
        'Cleveland Municipal School District')
)
;

delete from locations
where title in (
    'Stockyards, Clark Fulton, Brooklyn Center Comm. Dev. Corp.',
    'Cleveland Municipal School District')
;

update locations
set title = 'Burten Bell Carr Dev. Corp.'
where title = 'Burton Bell Carr Dev. Corp.'
;
