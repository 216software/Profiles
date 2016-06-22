create table photos
(
    photo_uuid uuid primary key default uuid_generate_v4(),
    container text not null,

    cdn_url citext,

    description text,

    original_filename text,
    mimetype text,

    width integer,
    height integer,


    /* Small */
    thumbnail_cdn_url citext,
    thumbnail_uuid uuid,

    thumbnail_width integer,
    thumbnail_height integer,

    /* Web optimized size photo */

    web_optimized_cdn_url citext,
    web_optimized_uuid uuid,

    web_optimized_width integer,
    web_optimized_height integer,

    uploaded_by uuid references people (person_uuid),

    uploaded_by_name citext,

    /* It's possible a file will be uploaded, and we won't know who's
     * doing the uploading
    uploaded_by_temp_user text references temp_users (name),*/

    upload_finished timestamptz,

    removed boolean default false,

    inserted timestamptz not null default now(),
    updated timestamptz
);

create trigger photos_set_updated_column
before update
on photos
for each row
execute procedure set_updated_column();


/* Link table to connect the album to the photo */
create table album_photos
(
   album_uuid uuid references albums (album_uuid) on delete set null,

   photo_uuid uuid references photos (photo_uuid) on delete cascade,

   inserted timestamptz not null default now(),
   updated timestamptz
);


create trigger album_photos_set_updated_column
before update
on album_photos
for each row
execute procedure set_updated_column();

