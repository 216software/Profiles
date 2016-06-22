create table album_special_urls
(
    album_uuid uuid not null
    references albums (album_uuid)
    on delete cascade,

    short_code citext not null,

    effective daterange not null
    default daterange(current_timestamp::date, (current_timestamp + interval '30 days')::date),

    primary key (short_code, effective),

    inserted_by uuid not null
    references people (person_uuid)
    on delete restrict,

    inserted timestamptz not null default now(),
    updated timestamptz
);

create trigger album_special_urls_set_updated_column
before update
on album_special_urls
for each row
execute procedure set_updated_column();
