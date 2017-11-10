update indicators
set pretty_label = description
where pretty_label is null
and description is not null
;
