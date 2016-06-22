#! /bin/bash
sudo -u postgres dropdb profiles_$1
sudo -u postgres createdb --owner profiles profiles_$1 # _$1 could be _prod or something else!
sudo -u postgres createlang plpythonu profiles_$1
sudo -u postgres psql -d profiles_$1 -c 'create extension "hstore";'
sudo -u postgres psql -d profiles_$1 -c 'create extension "uuid-ossp";'
sudo -u postgres psql -d profiles_$1 -c 'create extension "pgcrypto";'
sudo -u postgres psql -d profiles_$1 -c 'create extension "citext";'
sudo -u postgres psql -d profiles_$1 -c 'create extension "btree_gist";'

echo "Now run python upgrade_database.py dev.yaml"
