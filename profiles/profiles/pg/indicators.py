# vim: set expandtab ts=4 sw=4 filetype=python fileencoding=utf8:

import copy
import logging
import textwrap

import psycopg2.extras

from profiles.pg import RelationWrapper

log = logging.getLogger(__name__)

class IndicatorsFactory(psycopg2.extras.CompositeCaster):

    def make(self, values):
        d = dict(zip(self.attnames, values))
        return Indicator(**d)

class Indicator(RelationWrapper):

    def __init__(self, indicator_uuid, title, description,
        pretty_label, indicator_value_format, indicator_category, source_document,
        sas_variable, formula, extra_notes,
        definition, universe, limitations, note, data_source,
        data_as_of, numerator_tables, denominator_tables,

        inserted, updated):

        self.indicator_uuid = indicator_uuid
        self.title = title
        self.description = description
        self.pretty_label = pretty_label
        self.indicator_value_format = indicator_value_format
        self.indicator_category = indicator_category
        self.source_document = source_document
        self.sas_variable = sas_variable
        self.formula = formula
        self.extra_notes = extra_notes

        self.definition = definition
        self.universe = universe
        self.limitations = limitations
        self.note = note
        self.data_source = data_source
        self.data_as_of = data_as_of
        self.numerator_tables = numerator_tables
        self.denominator_tables = denominator_tables


        self.inserted = inserted
        self.updated = updated

    @property
    def __jsondata__(self):

        d = copy.copy(self.__dict__)
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

            """)

        cursor = pgconn.cursor()

        cursor.execute(qry)

        for row in cursor:
            yield row.x

    @classmethod
    def insert(cls, pgconn, title, description,
        indicator_value_format, indicator_category,
        source_document, sas_variable):

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            insert into indicators
            (title, description, indicator_value_format,
            indicator_category, source_document, sas_variable)
            values
            (%s, %s, %s, %s, %s, %s)
            returning (indicators.*)::indicators as ind
            """),
            [title, description, indicator_value_format,
            indicator_category, source_document, sas_variable])

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

    @classmethod
    def by_sas_variable(cls, pgconn, sas_variable):

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            select indicators.*::indicators as ind
            from indicators
            where sas_variable = %s
            """), [sas_variable])

        for row in cursor:
            yield row.ind

    def update_description(self, pgconn, new_description):

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            update indicators
            set description = %s
            where indicator_uuid = %s
            returning indicators.*::indicators as updated_ind
            """), [new_description, self.indicator_uuid])

        if cursor.rowcount:

            updated_ind = cursor.fetchone().updated_ind

            log.info("Updated description on {0} to {1}".format(
                updated_ind,
                new_description))

            return updated_ind

        else:
            raise KeyError("Could not find indicator {0}!".format(self))

    def update_pretty_label(self, pgconn, new_pretty_label):

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            update indicators
            set pretty_label = %s
            where indicator_uuid = %s
            returning indicators.*::indicators as updated_ind
            """), [new_pretty_label, self.indicator_uuid])

        if cursor.rowcount:

            updated_ind = cursor.fetchone().updated_ind

            log.info("Updated pretty_label on {0} to {1}".format(
                updated_ind,
                updated_ind.pretty_label))

            return updated_ind

        else:
            raise KeyError("Could not find indicator {0}!".format(self))

    @classmethod
    def update_description_by_title(cls, pgconn, title, description):

        """
        Use the title to find this indicator.  Then update the
        description.  Then return the updated indicator.
        """

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            update indicators
            set description = %s
            where title = %s
            returning indicators.*::indicators as updated_ind
            """), [description, title])

        if cursor.rowcount:

            updated_ind = cursor.fetchone().updated_ind

            log.info("Updated description on {0} to {1}".format(
                updated_ind,
                description))

            return updated_ind

        else:
            raise KeyError("Could not find indicator {0}!".format(title))


    @classmethod
    def update_extra_details_by_title(cls, pgconn, title, description,
        definition,
        universe, limitations, note, data_source, data_as_of,
        numerator_tables, denominator_tables):

        """
        Use the title to find this indicator.  Then update
        with extra information.  Then return the updated indicator.
        """

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            update indicators

            set description = %(description)s,
            pretty_label = %(description)s,
            definition = %(definition)s,
            universe = %(universe)s,
            limitations = %(limitations)s,
            note = %(note)s,
            data_source = %(data_source)s,
            data_as_of = %(data_as_of)s,
            numerator_tables = %(numerator_tables)s,
            denominator_tables = %(denominator_tables)s

            where title = %(title)s

            returning (indicators.*)::indicators as updated_ind
            """), locals())

        if cursor.rowcount:

            updated_ind = cursor.fetchone().updated_ind

            log.info("Updated extra details on {0} {1}".format(
                updated_ind, updated_ind.universe))


            return updated_ind

        else:
            raise KeyError("Could not find indicator {0}!".format(title))




    def __repr__(self):

        return """<{0}.{1} (title="{2}")>""".format(
            self.__class__.__module__,
            self.__class__.__name__,
            self.title)


    def distinct_observation_timestamps(self, pgconn):

        """
        Give us the distinct observable_timestamps for a given
        indicator

        """
        cursor = pgconn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cursor.execute(textwrap.dedent("""

                select distinct observation_timestamp,
                observation_timestamp_label
                from indicator_location_values
                where indicator_uuid = %(indicator_uuid)s
                order by observation_timestamp asc;

        """), dict(indicator_uuid=self.indicator_uuid))

        for row in cursor.fetchall():
            yield row


    def all_indicator_location_values(self, pgconn, order_by_area=False):

        """
        Give us all the values for a given indicator
        across all times and locations

        """

        cursor = pgconn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        if order_by_area:
            order_by_clause = "order by st_area(l.location_shape) desc"
        else:
            order_by_clause = "order by l.title asc"

        qry = textwrap.dedent("""

            select (l.*)::locations as location,
            st_area(l.location_shape) as location_area,
            array_to_json(array_agg((ilv.*)::indicator_location_values))
            as indicator_location_values

            from indicator_location_values ilv
            join locations l on l.location_uuid = ilv.location_uuid

            where indicator_uuid = %(indicator_uuid)s

            and l.display_me = true

            group by l.location_uuid

            {order_by_clause}

        """)

        qry = qry.format(order_by_clause=order_by_clause)

        cursor.execute(qry, dict(indicator_uuid=self.indicator_uuid))

        for row in cursor.fetchall():
            yield row




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

class IndicatorLocationValueFactory(psycopg2.extras.CompositeCaster):

    def make(self, values):
        d = dict(zip(self.attnames, values))
        return IndicatorLocationValue(**d)

class IndicatorLocationValue(RelationWrapper):

    def __init__(self, indicator_uuid, location_uuid,
        observation_timestamp, observation_range,
        value, observation_timestamp_label, inserted, updated):

        self.indicator_uuid = indicator_uuid
        self.location_uuid = location_uuid
        self.observation_timestamp = observation_timestamp
        self.observation_range = observation_range
        self.observation_timestamp_label = observation_timestamp_label
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

    @classmethod
    def by_ilo(cls, pgconn, indicator, location, observation_timestamp):

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            select indicator_location_values.*::indicator_location_values as ilv
            from indicator_location_values
            where (indicator_uuid, location_uuid, observation_timestamp)
            = (%s, %s, %s)
            """), [indicator, location, observation_timestamp])

        if cursor.rowcount:
            return cursor.fetchone().ilv

        else:
            raise KeyError("Sorry, no ILV with {0}, {1}, {2} found!".format(
                indicator,
                location,
                observation_timestamp))

    @classmethod
    def update_value(cls, pgconn, indicator, location,
        observation_timestamp, value):

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            update indicator_location_values

            set value = %s

            where (indicator_uuid, location_uuid, observation_timestamp)
            = (%s, %s, %s)

            returning indicator_location_values.*::indicator_location_values as ilv
            """), [value, indicator, location, observation_timestamp])

        if cursor.rowcount:
            ilv = cursor.fetchone().ilv
            log.info("Updated {0}'s value to {1}.".format(ilv, value))
            return ilv

        else:
            raise KeyError("Sorry, no ILV with {0}, {1}, {2} found!".format(
                indicator,
                location,
                observation_timestamp))

    def update_my_value(self, pgconn, new_value):

        if float(new_value) != self.value:

            return self.update_value(
                pgconn,
                self.indicator_uuid,
                self.location_uuid,
                self.observation_timestamp,
                float(new_value))

    @staticmethod
    def look_up_racial_split(pgconn, indicator_title,
        location_uuid, dt):

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            select
            indicators.pretty_label,
            ilv.value,

            ilv.value - ilv_moe.value as floor,
            ilv.value + ilv_moe.value as ceiling

            from indicator_location_values ilv

            join indicators
            on ilv.indicator_uuid = indicators.indicator_uuid

            left join indicators moe
            on 'm' || indicators.title = moe.title

            left join indicator_location_values ilv_moe
            on moe.indicator_uuid = ilv_moe.indicator_uuid
            and ilv_moe.location_uuid = %(location_uuid)s
            and ilv_moe .observation_timestamp = %(dt)s

            where indicators.title = any (%(race_indicator_titles)s)
            and ilv.location_uuid = %(location_uuid)s
            and ilv.observation_timestamp = %(dt)s

            order by indicators.pretty_label

            """), dict(
                race_indicator_titles=IndicatorLocationValue.find_racial_sub_indicators(indicator_title),
                location_uuid=location_uuid,
                dt=dt))

        for row in cursor:
            yield row._asdict()

    @staticmethod
    def find_racial_sub_indicators(indicator_title):

        if not indicator_title.startswith("t_"):

            raise ValueError("Sorry, I can only do this when "
                "indicator starts with 't_', not {0}.".format(
                    indicator_title))

        else:

            return ["{0}_{1}".format(c, indicator_title[2:]) for c in 'abhow']


    @staticmethod
    def find_available_observation_timestamps(pgconn, indicator_uuid,
        location_uuid):

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            select ilv.observation_timestamp,

            coalesce(
                ilv.observation_timestamp_label,
                to_char(
                    ilv.observation_timestamp,
                    'YYYY')) as observation_timestamp_label

            from indicator_location_values ilv
            where ilv.indicator_uuid = %(indicator_uuid)s
            and ilv.location_uuid = %(location_uuid)s
            order by ilv.observation_timestamp
            """), locals())

        for row in cursor:
            yield row._asdict()

