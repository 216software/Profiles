# vim: set expandtab ts=4 sw=4 filetype=python fileencoding=utf8:

import copy
import logging
import textwrap

import psycopg2.extras

log = logging.getLogger(__name__)

class indicatorsFactory(psycopg2.extras.CompositeCaster):

    def make(self, values):
        d = dict(zip(self.attnames, values))
        return indicator(**d)

class indicator(object):

    def __init__(self, indicator_uuid, title, description,
        indicator_type, indicator_shape, indicator_shape_json,
        inserted, updated):

        self.indicator_uuid = indicator_uuid
        self.title = title
        self.description = description
        self.indicator_type = indicator_type
        self.indicator_shape = indicator_shape
        self.indicator_shape_json = indicator_shape_json

        self.inserted = inserted
        self.updated = updated

    @property
    def __jsondata__(self):

        d = copy.copy(self.__dict__)
        # We don't want to return the actual shape, just the json
        del d['indicator_shape']
        return d


    @classmethod
    def by_indicator_uuid(cls, pgconn, indicator_uuid):

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            select (indicators.*)::indicators as indicator

            from indicators

            where indicator_uuid = %(indicator_uuid)s
            """), dict(indicator_uuid=indicator_uuid))

        return cursor.fetchone().indicator


    @classmethod
    def select_all(cls, pgconn):

        qry = textwrap.dedent("""
            select (indicators.*)::indicators as x
            from indicators

            order by indicator_type
            """)

        cursor = pgconn.cursor()

        cursor.execute(qry)

        for row in cursor:
            yield row.x

    def look_up_indicators(self, pgconn, time_period = None):

        """

        Look up all indicators and all values associated with
        this indicator

        """

        pass

def all_indicator_categories(pgconn):

    cursor = pgconn.cursor()

    cursor.execute(textwrap.dedent("""

        select category from indicator_categories

    """))

    return [row.category for row in cursor]


