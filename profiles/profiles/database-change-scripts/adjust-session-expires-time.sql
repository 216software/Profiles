alter table webapp_sessions
alter column expires
set default now() + interval '30 days';
