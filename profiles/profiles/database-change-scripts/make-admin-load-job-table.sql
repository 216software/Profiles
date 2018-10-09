/* Since we're now going to let a user
   upload data and begin the reload process,

   we need a table to keep track of it

   a job should point to a file name (uuid) in our zip
   folder

   start time, end time (indicates in progress)

   and a message column for updating current status...

*/

create table zip_files
(
    zip_file_uuid uuid primary key default uuid_generate_v4(),

    -- These should point to a zip file on the file system
    original_path citext not null unique,

    original_filename citext,

    inserted timestamptz not null default now(),
    updated timestamptz
);

create trigger zip_files_set_updated_column
before update
on zip_files
for each row
execute procedure set_updated_column();

create table admin_data_load_jobs
(
    job_uuid uuid not null default uuid_generate_v4() primary key,

    job_start_end tsrange not null
    default tsrange(
        now()::timestamp without time zone,
        'infinity'),

    zip_file_uuid uuid not null
    references zip_files (zip_file_uuid),

    -- Log what happens in the job here
    job_log text,

    inserted timestamp not null default now(),
    updated timestamp
);

create trigger admin_data_loads_per_round_updated_column
before update
on  admin_data_load_jobs
for each row
execute procedure set_updated_column();

alter table admin_data_load_jobs
add constraint no_overlapping_admin_data_load_jobs
exclude using gist (
    job_start_end with &&);


