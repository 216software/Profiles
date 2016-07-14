create table time_periods
(

    time_period citext primary key not null,

    /* A year or quarter? */

    description text,

    inserted timestamp not null default now(),
    updated timestamp
);

create trigger time_periods_set_updated_column
before update
on time_periods
for each row
execute procedure set_updated_column();

insert into time_periods
(time_period)
values
('2010');


create table indicator_location_values
(
   indicator_uuid uuid not null
   references indicators (indicator_uuid),

   location_uuid uuid not null
   references locations (location_uuid),

   time_period citext not null
   references time_periods (time_period),

   primary key (indicator_uuid, location_uuid, time_period),

   value float not null,

   inserted timestamp not null default now(),
   updated timestamp
);

create trigger indicator_location_values_set_updated_column
before update
on indicator_location_values
for each row
execute procedure set_updated_column();


/* Queries -- get indicator all location values for given time period

   For a given location, get all of my indicators for a given category.
*/
