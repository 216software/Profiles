alter table people
add column person_uuid uuid not null unique default uuid_generate_v4(),
drop constraint people_pkey cascade,
add constraint people_pkey primary key (person_uuid);

alter table webapp_sessions
add column session_uuid uuid not null unique default uuid_generate_v4(),
add column person_uuid uuid references people (person_uuid)
on delete cascade on update cascade,
drop constraint webapp_sessions_pkey cascade,
add constraint webapp_sessions_pkey primary key (session_uuid);

alter table webapp_session_data
alter column namespace type citext,
add column session_uuid uuid references webapp_sessions (session_uuid)
on delete cascade on update cascade,
drop constraint webapp_session_data_pkey,
add constraint webapp_session_data_pkey primary key (session_uuid, namespace);

alter table people drop column person_id;
alter table webapp_sessions drop column session_id;
alter table webapp_sessions drop column person_id;


