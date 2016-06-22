create table profiles_schema_changes
(
    script_path citext primary key,
    script_contents text,
    inserted timestamp not null default now(),
    updated timestamp
);

create or replace function set_updated_column ()
returns trigger
as
$$

begin

    NEW.updated = now();
    return NEW;

end;
$$
language plpgsql;

create trigger profiles_schema_changes_set_updated_column
before update
on profiles_schema_changes
for each row
execute procedure set_updated_column();
