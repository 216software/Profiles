#!/bin/bash


#Make sure user is super on database
#alter user communityprofiles with superuser;


# with new postgis, simpley enabling the extension means
# we don't need to do a template

#dropdb $1 -U communityprofiles -h localhost
#createdb -T template_postgis $1 -U communityprofiles -h localhost

#python manage.py syncdb

#python manage.py migrate maps
#python manage.py migrate
python manage.py loaddata profiles/fixtures/datasources.json
python manage.py loaddata profiles/fixtures/datadomains.json

# Need times before indicators (Rob added this)
python manage.py loaddata profiles/fixtures/times.json

python manage.py loaddata profiles/fixtures/sample_indicator.json
python manage.py loaddata profiles/fixtures/sample_indicators_parts.json

echo ""
echo "---------------------------------------------------------------------------------------------------------"
echo " Now run something like ./manage.py load_geographies census/tools/sample_data/pageo2010.sample.sf1 2010 "
