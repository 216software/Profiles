create or replace view pretty_indicator_location_values

as select indicators.title as indicator,
locations.title as location,
indlocval.observation_timestamp,
indlocval.observation_range,
indlocval.value,
indicators.indicator_uuid,
locations.location_uuid,
indlocval.inserted,
indlocval.updated

from indicator_location_values indlocval

join indicators
on indlocval.indicator_uuid = indicators.indicator_uuid

join locations
on indlocval.location_uuid = locations.location_uuid;
