/*
    Indicator Categories are things like:
        Population or
        Income or
        Property Prices
*/

create table indicator_categories
(
    title citext primary key,
    description text,
    inserted timestamp not null default now(),
    updated timestamp
);

create trigger indicator_categories_set_updated_column
before update
on indicator_categories
for each row
execute procedure set_updated_column();

insert into indicator_categories
(title)
values
('Population'),
('Income');

/* Let's store what type of value an indicator keeps track
   of so we know how to format it (meaning, is it a number
   or a currency, etc)
*/
create table indicator_value_formats
(
    format citext primary key,
    description text,
    inserted timestamp not null default now(),
    updated timestamp
);

create trigger indicator_value_formats_set_updated_column
before update
on indicator_value_formats
for each row
execute procedure set_updated_column();

insert into indicator_value_formats
(format)
values
('number'),
('currency');


/* Indicators or Variables are what we're measuring.
   They're part of a greater category -- so we
   might have something like total-population which is
   part of Population, or median income which is part
   of the income category */
create table indicators
(
    indicator_uuid uuid not null default uuid_generate_v4() primary key,
    title citext unique,

    description text,

    indicator_value_format citext not null default 'number'
    references indicator_value_formats (format),

    inserted timestamp not null default now(),
    updated timestamp
);

create trigger indicators_set_updated_column
before update
on indicators
for each row
execute procedure set_updated_column();

/* Indicators relate to each other --

   might want to rethink this, but for now,
   let's do a table of indicator ratios

   where we set a numerator and denominator
   from our list of indicators */

create table indicator_ratios
(
    indicator_numerator uuid not null
    references indicators (indicator_uuid),

    indicator_denominator uuid not null
    references indicators (indicator_uuid),

    primary key (indicator_numerator, indicator_denominator),

    inserted timestamp not null default now(),
    updated timestamp

);

create trigger indicator_ratios_set_updated_column
before update
on indicator_ratios
for each row
execute procedure set_updated_column();


/* We need to set up some geographies or places.

   Indicators are good as they give us a data point,
   but we also need to link these data points
   to specific places.

   These places should also be mappable
*/

/* Place types are like state, country, etc */
create table location_types
(
    location_type citext not null primary key,

    description text,

    contained_in citext
    references location_types (location_type),

    inserted timestamp not null default now(),
    updated timestamp
);

create trigger location_types_set_updated_column
before update
on location_types
for each row
execute procedure set_updated_column();

insert into location_types
(location_type, contained_in)
values
('county', null),
('city', 'county'),
('neighborhood', 'city'),
('community development corporation', 'city');

/* This is an actual place */
create table locations
(
    location_uuid uuid primary key default uuid_generate_v4(),

    title citext not null,

    description text,

    location_type citext not null
    references location_types(location_type),

    /* Do we want to store the map polygon here? */

    location_shape geometry(MultiPolygon, 4326),

    location_shape_json json,

    inserted timestamp not null default now(),
    updated timestamp

);

create trigger location_set_updated_column
before update
on locations
for each row
execute procedure set_updated_column();


/* So we don't have to return a geometry to the HTML / frontend
   let's set up a trigger to transform geometry multipolygon
   into a more easily readable json shape object */
create or replace function set_location_shape_json ()
returns trigger
as
$$

begin
    new.location_shape_json:= ST_AsGeoJSON(new.location_shape);
    return new;
end;
$$
language plpgsql;

create trigger locations_setlocation_shape_json
before insert or update
on locations
for each row
execute procedure set_location_shape_json();


/* For each indicator, we can have values that relate to
   a point in time and a specific place. We should
   record  */


