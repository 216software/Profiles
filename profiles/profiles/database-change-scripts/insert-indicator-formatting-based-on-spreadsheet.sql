/* Anything preceded with an underscore is a rate */
update indicators set indicator_value_format = 'percent' where position('_' in title) = 1;
update indicators set indicator_value_format = 'currency' where description like '%price%';

update indicators set indicator_value_format = 'percent' where description like '%Coefficient%';

update indicators set indicator_value_format = 'number' where title = any(array['_v', '_Ia', '_II', '_p']);

update indicators set indicator_value_format = 'currency' where title = any(array['_grent', '_medinc']);
