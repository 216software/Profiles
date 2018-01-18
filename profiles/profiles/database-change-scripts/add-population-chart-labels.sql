update indicators

set chart_label = 'Non-hispanic White'
where title = 'nhw'
;

update indicators
set chart_label = 'Non-hispanic Black'
where title = 'nhb'
;

update indicators
set chart_label = 'Non-hispanic Asian/Pacific Islander'
where title = 'nhapi'
;

update indicators
set chart_label = 'Non-Hispanic Other Race'
where title = 'nho'
;

update indicators
set chart_label = 'Hispanic'
where title = 'hisp'
;

