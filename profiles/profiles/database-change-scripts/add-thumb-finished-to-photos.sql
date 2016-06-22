/*
    To differentiate between an upload being finished
    and the thumbnails themselves being finished, let's
    add a new column

*/
alter table photos add column thumbs_finished timestamptz;

update photos set thumbs_finished = upload_finished;


