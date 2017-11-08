create table races
(
    race citext not null primary key,
    description text,

    inserted timestamp not null default now(),
    updated timestamp
);

create trigger races_set_updated_column
before update
on races
for each row
execute procedure set_updated_column();

insert into races
(race)
values
('white'),
('black'),
('asian'),
('hispanic'),
('other');

create table indicator_to_race
(
    race citext not null
    references races (race),

    parent_indicator_uuid uuid not null
    references indicators (indicator_uuid),

    race_indicator_uuid uuid not null
    references indicators (indicator_uuid),

    primary key (race, parent_indicator_uuid, race_indicator_uuid),

    inserted timestamp not null default now(),
    updated timestamp
);

create trigger indicator_to_race_set_updated_column
before update
on indicator_to_race
for each row
execute procedure set_updated_column();

insert into indicator_to_race
(race, parent_indicator_uuid, race_indicator_uuid)
with i1 as (
    select indicator_uuid from indicators where title = 'pop'
),

i2 as (
    select indicator_uuid from indicators where title = 'nhb'
)

select 'black', i1.indicator_uuid, i2.indicator_uuid
from i1, i2;

insert into indicator_to_race
(race, parent_indicator_uuid, race_indicator_uuid)
with i1 as (
    select indicator_uuid from indicators where title = 'pop'
),

i2 as (
    select indicator_uuid from indicators where title = 'nhw'
)

select 'white', i1.indicator_uuid, i2.indicator_uuid
from i1, i2;

insert into indicator_to_race
(race, parent_indicator_uuid, race_indicator_uuid)
with i1 as (
    select indicator_uuid from indicators where title = 'pop'
),

i2 as (
    select indicator_uuid from indicators where title = 'nhapi'
)

select 'asian', i1.indicator_uuid, i2.indicator_uuid
from i1, i2;

insert into indicator_to_race
(race, parent_indicator_uuid, race_indicator_uuid)
with i1 as (
    select indicator_uuid from indicators where title = 'pop'
),

i2 as (
    select indicator_uuid from indicators where title = 'nho'
)

select 'other', i1.indicator_uuid, i2.indicator_uuid
from i1, i2;

insert into indicator_to_race
(race, parent_indicator_uuid, race_indicator_uuid)
with i1 as (
    select indicator_uuid from indicators where title = 'pop'
),

i2 as (
    select indicator_uuid from indicators where title = 'hispanic'
)

select 'hispanic', i1.indicator_uuid, i2.indicator_uuid
from i1, i2;




