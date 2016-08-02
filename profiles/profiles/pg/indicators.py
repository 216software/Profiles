# vim: set expandtab ts=4 sw=4 filetype=python fileencoding=utf8:

import copy
import logging
import textwrap

import psycopg2.extras

from profiles.pg import RelationWrapper

log = logging.getLogger(__name__)

class indicatorsFactory(psycopg2.extras.CompositeCaster):

    def make(self, values):
        d = dict(zip(self.attnames, values))
        return indicator(**d)

class indicator(object):

    def __init__(self, indicator_uuid, title, description,
        indicator_value_format, indicator_category,
        source_document,
        inserted, updated):

        self.indicator_uuid = indicator_uuid
        self.title = title
        self.description = description
        self.indicator_value_format = indicator_value_format
        self.indicator_category = indicator_category
        self.source_document = source_document
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

    @classmethod
    def insert(cls, pgconn, title, description,
        indicator_value_format, indicator_category,
        source_document):

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            insert into indicators
            (title, description, indicator_value_format,
            indicator_category, source_document)
            values
            (%s, %s, %s, %s, %s)
            returning (indicators.*)::indicators as ind
            """),
            [title, description, indicator_value_format,
            indicator_category, source_document])

        return cursor.fetchone().ind


    @classmethod
    def by_title(cls, pgconn, title):

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            select (indicators.*)::indicators ind
            from indicators
            where title = %s
            """), [title])

        if cursor.rowcount:
            return cursor.fetchone().ind

        else:
            raise KeyError(
                "Sorry, no indicator with title {0} found!".format(
                    title))


# Matt can't abide classes named in lower-case.
Indicator = indicator

def all_indicator_categories(pgconn):

    cursor = pgconn.cursor()

    cursor.execute(textwrap.dedent("""

        select category from indicator_categories

    """))

    return [row.category for row in cursor]

class IndicatorCategoryFactory(psycopg2.extras.CompositeCaster):

    def make(self, values):
        d = dict(zip(self.attnames, values))
        return IndicatorCategory(**d)

class IndicatorCategory(RelationWrapper):

    def __init__(self, category, description, inserted, updated):
        self.category = category
        self.description = description
        self.inserted = inserted
        self.updated = updated

    @classmethod
    def all(cls, pgconn):

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            select (indicator_categories.*)::indicator_categories ic
             from indicator_categories
            """))

        for row in cursor:
            yield row.ic

    @classmethod
    def insert(cls, pgconn, category, description):

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            insert into indicator_categories
            (category, description)
            values
            (%s, %s)
            returning indicator_categories.*::indicator_categories as ic
            """), [category, description])

        return cursor.fetchone().ic

    @classmethod
    def by_category(cls, pgconn, category):

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            select indicator_categories.*::indicator_categories as ic
            from indicator_categories
            where category = %s
            """), [category])

        if cursor.rowcount:

            return cursor.fetchone().ic

        else:

            raise KeyError("No indicator_category {0}!".format(
                category))

class IndicatorLocationValue(RelationWrapper):

    def __init__(self, indicator_uuid, location_uuid,
        observation_timestamp, observation_range,
        value, inserted, updated):

        self.indicator_uuid = indicator_uuid
        self.location_uuid = location_uuid
        self.observation_timestamp = observation_timestamp
        self.observation_range = observation_range
        self.value = value
        self.inserted = inserted
        self.updated = updated

    @classmethod
    def insert(cls, pgconn, indicator_uuid, location_uuid,
        observation_timestamp, observation_range, value):

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            insert into indicator_location_values
            (
                indicator_uuid, location_uuid, observation_timestamp,
                observation_range, value
            )
            values
            (%s, %s, %s, %s, %s)
            returning
            (indicator_location_values.*)::indicator_location_values as indlocval
            """), [indicator_uuid, location_uuid, observation_timestamp,
            observation_range, value])

        return cursor.fetchone().indlocval

