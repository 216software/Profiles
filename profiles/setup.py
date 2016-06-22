# vim: set expandtab ts=4 sw=4 filetype=python fileencoding=utf8:

from setuptools import find_packages, setup

setup(

    name="profiles",

    version="0.0.1",

    packages=find_packages(),

    include_package_data=True,

    package_dir={"profiles": "profiles"},

    scripts=[
        "profiles/scripts/run-webapp",
        "profiles/scripts/profiles-upgrade-database",
        "profiles/scripts/profiles-rebuild-database",
        "profiles/scripts/profiles-config",
        "profiles/scripts/profiles-yaml-example",
        "profiles/scripts/profiles-load-dump",
        "profiles/scripts/process-thumbnails.py",
    ],

)
