alter table indicator_location_values

rename column time_period to observation_timestamp;


alter table indicator_location_values

drop constraint indicator_location_values_time_period_fkey,

alter column observation_timestamp type timestamptz
USING to_date(observation_timestamp, 'YYYY'),

add column observation_range tstzrange,

add constraint only_one check (
    observation_range is null
    or observation_timestamp is null);

