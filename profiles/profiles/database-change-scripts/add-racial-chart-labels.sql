update indicators

set chart_label = 'White'
where title = 'wsamehse1y'
;

update indicators
set chart_label = 'Black'
where title = 'bsamehse1y'
;

update indicators
set chart_label = 'Asian/Pacific Islander'
where title = 'asamehse1y'
;

update indicators
set chart_label = 'Other Race'
where title = 'osamehse1y'
;

update indicators
set chart_label = 'Hispanic'
where title = 'hsamehse1y'
;

-- diffhs1y
update indicators
set chart_label = 'White'
where title = 'wdiffhs1y'
;

update indicators
set chart_label = 'Black'
where title = 'bdiffhs1y'
;

update indicators
set chart_label = 'Asian/Pacific Islander'
where title = 'adiffhs1y'
;

update indicators
set chart_label = 'Other Race'
where title = 'odiffhs1y'
;

update indicators
set chart_label = 'Hispanic'
where title = 'hdiffhs1y'
;

