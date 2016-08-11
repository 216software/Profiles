alter table indicators
alter column indicator_value_format drop not null,
alter column indicator_category drop not null;
