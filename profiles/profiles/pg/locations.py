# vim: set expandtab ts=4 sw=4 filetype=python fileencoding=utf8:

import copy
import logging
import re
import textwrap

import psycopg2.extras

from profiles.pg import RelationWrapper

log = logging.getLogger(__name__)

class LocationsFactory(psycopg2.extras.CompositeCaster):

    def make(self, values):
        d = dict(zip(self.attnames, values))
        return Location(**d)

class Location(object):

    def __init__(self, location_uuid, title, description,
        location_type, location_shape, location_shape_json,
        display_me,
        inserted, updated):

        self.location_uuid = location_uuid
        self.title = title
        self.description = description
        self.location_type = location_type
        self.location_shape = location_shape
        self.location_shape_json = location_shape_json
        self.display_me = display_me

        self.inserted = inserted
        self.updated = updated

    @classmethod
    def insert(cls, pgconn, location_type, title, description,
        location_shape, location_shape_json):

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            insert into locations
            (location_type, title, description, location_shape,
                location_shape_json)
            values
            (%s, %s, %s, %s, %s)
            returning (locations.*)::locations as loc
            """), [location_type, title, description,
                location_shape, location_shape_json])

        return cursor.fetchone().loc


    @property
    def __jsondata__(self):

        d = copy.copy(self.__dict__)

        # We don't want to return the actual shape, just the json
        del d['location_shape']


        d["print_friendly_name"] = self.print_friendly_name

        return d

    @property
    def __jsondata_without_shape__(self):

        d = copy.copy(self.__dict__)

        # We don't want to return the actual shape, just the json
        del d['location_shape']
        del d['location_shape_json']

        d["print_friendly_name"] = self.print_friendly_name

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

            order by location_type, title
            """)

        cursor = pgconn.cursor()

        cursor.execute(qry)

        for row in cursor:
            yield row.x

    def look_up_indicators(self, pgconn):

        """

        Look up all indicators and all values associated with
        this location

        """

        cursor = pgconn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cursor.execute(textwrap.dedent("""

            select indicator_uuid, value

            from indicator_location_values

            where location_uuid = %(location_uuid)s

        """), dict(location_uuid=self.location_uuid))

        for row in cursor.fetchall():
            yield row


    def all_indicator_values_by_observation_timestamp_and_category(self, pgconn):

        """
        Indicator Values sorted by time period
        """

        cursor = pgconn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cursor.execute(textwrap.dedent("""

            with indicator_value_location_full  as
            (
                select (i.*::indicators), ilv.indicator_uuid,
                l.title, ilv.value, ilv.observation_timestamp,
                ilv.observation_range

                from indicator_location_values ilv

                join indicators i on i.indicator_uuid = ilv.indicator_uuid
                join locations l on l.location_uuid = ilv.location_uuid
                order by ilv.observation_timestamp asc
            )
        """), dict(location_uuid=self.location_uuid))

        for row in cursor.fetchall():
            yield row

    def indicators_with_values_by_location(self, pgconn,
        indicators):

        """
        Indicator Values sorted by categories

        We specifically do not return values that are '999999' as this
        indicates the value is suppressed / should not be displayed
        """

        cursor = pgconn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cursor.execute(textwrap.dedent("""


                with indicator_value_location  as
                (
                    select
                    i.indicator_uuid, i.title, i.indicator_value_format,
                    l.title as location_title,
                    ilv.value, ilv.observation_timestamp, i.indicator_category
                    from indicator_location_values ilv

                    join indicators i on i.indicator_uuid = ilv.indicator_uuid
                    join locations l on l.location_uuid = ilv.location_uuid

                    where l.location_uuid = %(location_uuid)s
                    and i.title = any(%(indicators)s)
                    and ilv.value != 999999

                    order by ilv.observation_timestamp asc
                )

                select (i.*)::indicators as indicator,
                array_to_json(array_agg(ilv.*)) as indicator_values

                from indicator_value_location ilv
                join indicators i on ilv.indicator_uuid = i.indicator_uuid

                group by (i.*)


        """), dict(location_uuid=self.location_uuid,
                indicators=indicators))

        for row in cursor.fetchall():
            yield row

    def distinct_observation_timestamp_for_indicators(self, pgconn,
        indicators):

        """
        Give us the distinct observable_timestamps over a given set of
        indicators


        """

        cursor = pgconn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cursor.execute(textwrap.dedent("""

                select distinct observation_timestamp
                from indicator_location_values
                where indicator_uuid = any(
                    select indicator_uuid from indicators where
                    title = any(%(indicators)s))

                and location_uuid = %(location_uuid)s
                order by observation_timestamp asc;

        """), dict(location_uuid=self.location_uuid,
                indicators=indicators))

        for row in cursor.fetchall():
            yield row

    def all_indicator_categories_with_values_by_location(self, pgconn,
        indicators):

        """
        Indicator Values sorted by categories
        """

        cursor = pgconn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cursor.execute(textwrap.dedent("""


            with category_time_indicator as (
                with indicator_value_location_full  as
                (
                    select
                    i.indicator_uuid, i.title, i.indicator_value_format,
                    ilv.indicator_uuid,
                    l.title as location_title,
                    ilv.value, ilv.observation_timestamp, i.indicator_category
                    from indicator_location_values ilv

                    join indicators i on i.indicator_uuid = ilv.indicator_uuid
                    join locations l on l.location_uuid = ilv.location_uuid

                    where l.location_uuid = %(location_uuid)s
                    and i.title in %(indicators)s
                )


                select indicator_category,
                array_to_json(array_agg((ilv.*))) as indicator_values

                from indicator_value_location_full ilv
                group by indicator_category, observation_timestamp
            )


            select cti.indicator_category,
            array_to_json(array_agg(cti.*)) as observation_timestamp_values

            from category_time_indicator cti group by cti.indicator_category

        """), dict(location_uuid=self.location_uuid,
                indicators=indicators))

        for row in cursor.fetchall():
            yield row


    def all_indicator_categories_by_indicator(self, pgconn):

        """
        For every category, give us all of the indicators.

        For each indicator, give us the indicator values for a given
        time period

        So Population (category):
            Male Population (indicator):
                50,000 2010 (indicator_value)
                25,000 2000 (indicator_value)

        """

        cursor = pgconn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cursor.execute(textwrap.dedent("""


            with category_indicator_value as (
                with indicator_value_location_full  as
                (
                    select
                    i.indicator_uuid, i.title, i.indicator_value_format,
                    l.title as location_title,
                    ilv.value, ilv.observation_timestamp, i.indicator_category
                    from indicator_location_values ilv

                    join indicators i on i.indicator_uuid = ilv.indicator_uuid
                    join locations l on l.location_uuid = ilv.location_uuid

                    where l.location_uuid = %(location_uuid)s
                )


                select indicator_category, ilv.indicator_uuid, ilv.title,
                array_to_json(array_agg((ilv.*))) as indicator_values

                from indicator_value_location_full ilv
                group by indicator_category, ilv.indicator_uuid, ilv.title
            )


            select cti.indicator_category,
            array_to_json(array_agg(cti.*)) as indicators

            from category_indicator_value cti group by cti.indicator_category

        """), dict(location_uuid=self.location_uuid))

        for row in cursor.fetchall():
            yield row

    @classmethod
    def by_location_type_and_title(cls, pgconn, location_type, title):

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            select (locations.*)::locations as loc
            from locations
            where location_type = %s
            and title = %s
            """), [location_type, title])

        if cursor.rowcount:
            return cursor.fetchone().loc

        else:
            raise KeyError("Sorry, not location {0} / {1} found!".format(
                location_type,
                title))

    @classmethod
    def find_containing_neighborhoods(cls, pgconn, lat, lng, offset, limit):

        cursor = pgconn.cursor()

        # I don't know what the 4326 parameter means.
        cursor.execute(textwrap.dedent("""
            select (locations.*)::locations as loc
            from locations
            where st_contains(
                location_shape,
                st_geomfromtext('point(%(lng)s %(lat)s)', 4326))
            order by title
            offset %(offset)s
            limit %(limit)s
            """), dict(lat=lat, lng=lng, offset=offset, limit=limit))

        for row in cursor:
            yield row.loc

    @property
    def print_friendly_location_type(self):

        if self.location_type == "community development corporation":
            return "cdc"

        else:
            return self.location_type.lower()

    @property
    def print_friendly_name(self):

        def clean(s):

            s2 = s.lower().strip().strip(".")

            # Replace these characters with a dash.
            s3 = re.sub("([.-]| )+", "-", s2)

            # Just remove these.
            s4 = re.sub("[,_']+", "", s3)

            return s4

        return "{0}-{1}".format(
            clean(self.print_friendly_location_type),
            clean(self.title))

class LocationTypeFactory(psycopg2.extras.CompositeCaster):

    def make(self, values):
        d = dict(zip(self.attnames, values))
        return LocationType(**d)

class LocationType(RelationWrapper):

    def __init__(self, location_type, description, contained_in,
        inserted, updated):

        self.location_type = location_type
        self.description = description
        self.contained_in = contained_in
        self.inserted = inserted
        self.updated = updated

    @classmethod
    def all(cls, pgconn):

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            select (location_types.*)::location_types loctype
            from location_types
            order by location_type
            """))

        for row in cursor:
            yield row.loctype


def all_location_types(pgconn):

    cursor = pgconn.cursor()

    cursor.execute(textwrap.dedent("""

        select location_type from location_types

    """))

    return [row.location_type for row in cursor]
