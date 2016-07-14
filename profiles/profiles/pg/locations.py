# vim: set expandtab ts=4 sw=4 filetype=python fileencoding=utf8:

import copy
import logging
import textwrap

import psycopg2.extras

log = logging.getLogger(__name__)

class LocationsFactory(psycopg2.extras.CompositeCaster):

    def make(self, values):
        d = dict(zip(self.attnames, values))
        return Location(**d)

class Location(object):

    def __init__(self, location_uuid, title, description,
        location_type, location_shape, location_shape_json,
        inserted, updated):

        self.location_uuid = location_uuid
        self.title = title
        self.description = description
        self.location_type = location_type
        self.location_shape = location_shape
        self.location_shape_json = location_shape_json

        self.inserted = inserted
        self.updated = updated

    @property
    def __jsondata__(self):

        d = copy.copy(self.__dict__)
        # We don't want to return the actual shape, just the json
        del d['location_shape']
        return d


    @classmethod
    def by_location_uuid(cls, pgconn, location_uuid):

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            select (locations.*)::locations as location

            from locations

            where location_uuid = %(location_uuid)s
            """), dict(location_uuid=location_uuid))

        return cursor.fetchone().location


    @classmethod
    def select_all(cls, pgconn):

        qry = textwrap.dedent("""
            select (locations.*)::locations as x
            from locations

            order by location_type
            """)

        cursor = pgconn.cursor()

        cursor.execute(qry)

        for row in cursor:
            yield row.x

    def look_up_indicators(self, pgconn, time_period = None):

        """

        Look up all indicators and all values associated with
        this location

        """

        cursor = pgconn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cursor.execute(textwrap.dedent("""

            select indicator_uuid, value, time_period

            from indicator_location_values

            where location_uuid = %(location_uuid)s

        """), dict(location_uuid=self.location_uuid))

        for row in cursor.fetchall():
            yield row



def all_location_types(pgconn):

    cursor = pgconn.cursor()

    cursor.execute(textwrap.dedent("""

        select location_type from location_types

    """))

    return [row.location_type for row in cursor]


