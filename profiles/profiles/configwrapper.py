# vim: set expandtab ts=4 sw=4 filetype=python:

import locale
import logging
import warnings

import jinja2
import psycopg2.extras

from horsemeat import configwrapper

log = logging.getLogger(__name__)

def pctchg(old, new):

    if old is None or new is None:
        return

    else:

        a = float((new - old)) / float(old)

        b = 100.0 * a

        return "{0:.2f}%".format(b)

def units(num):

    return locale.format("%d", num, grouping=True)

def dollar(num):

    return locale.currency(num, grouping=True)


class ConfigWrapper(configwrapper.ConfigWrapper):

    # Where are the config files?
    configmodule = "profiles.yamlfiles"

    @property
    def dispatcher_class(self):

        from profiles.webapp.framework.dispatcher import Dispatcher
        return Dispatcher

    def register_composite_types(self, pgconn):

        from profiles.pg.people import PersonFactory

        psycopg2.extras.register_composite(
            'people',
            pgconn,
            factory=PersonFactory)

        from profiles.pg.sessions import SessionFactory

        psycopg2.extras.register_composite(
            'webapp_sessions',
            pgconn,
            factory=SessionFactory)

        from profiles.pg.locations import LocationsFactory

        psycopg2.extras.register_composite(
            'locations',
            pgconn,
            factory=LocationsFactory)

        from profiles.pg.locations import LocationTypeFactory

        psycopg2.extras.register_composite(
            'location_types',
            pgconn,
            factory=LocationTypeFactory)

        from profiles.pg.indicators import IndicatorsFactory

        psycopg2.extras.register_composite(
            'indicators',
            pgconn,
            factory=IndicatorsFactory)

        from profiles.pg.indicators import IndicatorCategoryFactory

        psycopg2.extras.register_composite(
            'indicator_categories',
            pgconn,
            factory=IndicatorCategoryFactory)

        from profiles.pg.indicators import IndicatorLocationValueFactory

        psycopg2.extras.register_composite(
            'indicator_location_values',
            pgconn,
            factory=IndicatorLocationValueFactory)

        log.info('Just registered composite types in psycopg2')

        return pgconn


    def add_more_stuff_to_jinja2_globals(self):

        j = self.get_jinja2_environment()

        j.add_extension('jinja2.ext.do')

        # TODO: add the emailtemplates folder to frippery

        j.loader.mapping['emailtemplates'] = jinja2.PackageLoader(
            'profiles',
            'emailtemplates')

        j.loader.mapping['pg'] = jinja2.PackageLoader(
            'profiles',
            'pg')

        j.globals['pctchg'] = pctchg
        j.globals['units'] = units
        j.globals['dollar'] = dollar
        j.globals['dollars'] = dollar

        log.info("Added more stuff to jinja2 globals...")


    @classmethod
    def print_example_yaml(cls):

        import pkg_resources

        print pkg_resources.resource_string(
            "profiles",
            "yamlfiles/prod.yaml.example")


    @property
    def num_webapp_workers(self):
        return self.config_dictionary["app"].get("num_webapp_workers", 1)

    @property
    def pidfile_prefix(self):
        return self.config_dictionary["profiles"]["pidfile_prefix"]


    def get_photo_container_name(self, photo_type):
        return self.config_dictionary["rackspace"]["containers"][photo_type]["name"]

    def get_container_cdn_ssl_uri(self, photo_type):
        return self.config_dictionary["rackspace"]["containers"][photo_type]["cdn_ssl_uri"]


    def get_all_photo_types(self):
        return self.config_dictionary["rackspace"]["containers"].keys()

    @property
    def pyrax_mgmt_url(self):
        return self.config_dictionary["rackspace"]["mgmt_url"]

    @property
    def pyrax_tmp_url_key(self):
        return self.config_dictionary["rackspace"]["tempurlkey"]

    def get_pyrax(self):

        d = self.config_dictionary["rackspace"]

        import pyrax

        pyrax.set_setting("identity_type", "rackspace")
        pyrax.set_default_region(d["region"])
        pyrax.set_credentials(d["username"], d["apikey"],
            region=d["region"])

        return pyrax

    @property
    def csv_data_files_folder(self):
        return self.config_dictionary["profiles"]["csv_data_files_folder"]

    @property
    def xls_data_files_folder(self):
        return self.config_dictionary["profiles"]["xls_data_files_folder"]

    @property
    def csv_data_files_folder_2017(self):

        return self.config_dictionary["profiles"]["csv_data_files_folder_2017"]

    @property
    def google_maps_API_key(self):
        return self.config_dictionary["google"]["google_maps_API_key"]

    @property
    def pdf_files_directory(self):
        return self.config_dictionary["profiles"]["pdf_files_directory"]
