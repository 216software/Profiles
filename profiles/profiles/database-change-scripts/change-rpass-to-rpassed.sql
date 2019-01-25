/* 3rd Grade */
delete from indicator_location_values where indicator_uuid = (select indicator_uuid from indicators where title = 'rpassed3');
delete from indicators where title = 'rpassed3';
update indicators set title = 'rpassed3' where title = 'rpass50';
update indicators set title = 'mpassed3' where title = 'mpass50';

delete from indicator_location_values where indicator_uuid = (select indicator_uuid from indicators where title = '_rpassed3');
delete from indicators where title = '_rpassed3';
update indicators set title = '_rpassed3' where title = '_rpass50';
update indicators set title = '_mpassed3' where title = '_mpass50';


/* 4th grade */
delete from indicator_location_values where indicator_uuid = (select indicator_uuid from indicators where title = 'rpassed4');
delete from indicators where title = 'rpassed4';
update indicators set title = 'rpassed4' where title = 'rpass10';
update indicators set title = 'mpassed4' where title = 'mpass10';



delete from indicator_location_values where indicator_uuid = (select indicator_uuid from indicators where title = '_rpassed4');
delete from indicators where title = '_rpassed4';
update indicators set title = '_rpassed4' where title = '_rpass10';
update indicators set title = '_mpassed4' where title = '_mpass10';


/* 6th grade */
delete from indicator_location_values where indicator_uuid = (select indicator_uuid from indicators where title = 'rpassed6');
delete from indicators where title = 'rpassed6';

update indicators set title = 'rpassed6' where title = 'rpass20';
update indicators set title = 'mpassed6' where title = 'mpass20';

delete from indicator_location_values where indicator_uuid = (select indicator_uuid from indicators where title = '_rpassed6');
delete from indicators where title = '_rpassed6';

update indicators set title = '_rpassed6' where title = '_rpass20';
update indicators set title = '_mpassed6' where title = '_mpass20';


/* 10th grade */
delete from indicator_location_values where indicator_uuid = (select indicator_uuid from indicators where title = 'rpassed10');
delete from indicators where title = 'rpassed10';
update indicators set title = 'rpassed10' where title = 'rpass41';
update indicators set title = 'mpassed10' where title = 'mpass41';

delete from indicator_location_values where indicator_uuid = (select indicator_uuid from indicators where title = '_rpassed10');
delete from indicators where title = '_rpassed10';
update indicators set title = '_rpassed10' where title = '_rpass41';
update indicators set title = '_mpassed10' where title = '_mpass41';


