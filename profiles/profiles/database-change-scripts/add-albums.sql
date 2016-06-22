create table albums
(
    album_uuid uuid primary key default uuid_generate_v4(),
    title text not null,

    album_date date null,

    created_by uuid references people (person_uuid),

    removed boolean default false,

    inserted timestamptz not null default now(),
    updated timestamptz
);

create trigger albums_set_updated_column
before update
on albums
for each row
execute procedure set_updated_column();


