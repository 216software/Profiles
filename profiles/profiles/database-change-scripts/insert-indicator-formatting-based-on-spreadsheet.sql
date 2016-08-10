/* Anything preceded with an underscore is a rate */
update indicators set indicator_value_format = 'percent' where position('_' in title) = 1;
update indicators set indicator_value_format = 'currency' where description like '%price%';

update indicators set indicator_value_format = 'percent' where description like '%Coefficient%';
