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
        location_type, location_shape, inserted, updated):

        self.location_uuid = location_uuid
        self.title = title
        self.description = description
        self.location_type = location_type
        self.location_shape = location_shape

        self.location_shape_coordinates = None

        self.inserted = inserted
        self.updated = updated

    @property
    def __jsondata__(self):

        d = copy.copy(self.__dict__)
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
    def select_all(cls, pgconn, offset=None, limit=None,
        sort_direction='desc'):

        qry_tmpl = textwrap.dedent("""
            select (locationss.*)::locationss as x
            from locationss

            {where_string}

            order by locationss.inserted {sort_direction}
            offset %(offset)s
            limit %(limit)s
            """)

        where_clauses = []

        where_string = ""

        qry = qry_tmpl.format(
            where_string=where_string,
            sort_direction=sort_direction)

        cursor = pgconn.cursor()

        cursor.execute(
            qry,
            dict(
                offset=offset,
                limit=limit))

        for row in cursor:
            yield row.x



