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
        chart_label,

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
        self.chart_label = chart_label

        self.inserted = inserted
        self.updated = updated

        # Maybe set this

        self.racial_split = []
        self.indicator_CV = None
        self.indicator_moe = None


    @property
    def __jsondata__(self):

        d = copy.copy(self.__dict__)
        return d

    def __eq__(self, other):
        return self.indicator_uuid == other.indicator_uuid

    def __ne__(self, other):
        if other:
            return self.indicator_uuid != other.indicator_uuid
        else:
            return True

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
        source_document, sas_variable, chart_label):

        cursor = pgconn.cursor()

        if indicator_value_format is None and '_' == title[0]:
            indicator_value_format = 'percent'


        cursor.execute(textwrap.dedent("""
            insert into indicators
            (title, description, indicator_value_format,
            indicator_category, source_document, sas_variable,
            chart_label)
            values
            (%s, %s, %s, %s, %s, %s, %s)
            returning (indicators.*)::indicators as ind
            """),
            [title, description, indicator_value_format,
            indicator_category, source_document, sas_variable,
            chart_label])

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

    def set_all_visible(self, pgconn, visible=False):

        """
        Set all values for this indicator to visible (true / false)

        """

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""

            update indicator_location_values

            set visible = %(visible)s

            where indicator_uuid = %(indicator_uuid)s

        """), dict(visible=visible, indicator_uuid=self.indicator_uuid))

        return self

    def set_visible_years(self, pgconn, start_year, end_year, visible=False):

        """
        Set all values for this indicator to visible (true / false)

        """

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""

            update indicator_location_values

            set visible = %(visible)s

            where indicator_uuid = %(indicator_uuid)s
            and date_part('year', observation_timestamp) >= %(start_year)s
            and date_part('year', observation_timestamp) <= %(end_year)s

        """), dict(visible=visible, indicator_uuid=self.indicator_uuid,
            end_year=end_year, start_year=start_year))

        return self

    def set_visible_year(self, pgconn, year, visible=False):

        """
        Set all values for this indicator to visible (true / false)

        """

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""

            update indicator_location_values

            set visible = %(visible)s

            where indicator_uuid = %(indicator_uuid)s
            and observation_timestamp is not null
            and date_part('year', observation_timestamp) = %(year)s


        """), dict(visible=visible, indicator_uuid=self.indicator_uuid, year=year))

        return self

    def update_description(self, pgconn, new_description, chart_label):

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            update indicators

            set description = %s,
            chart_label = %s

            where indicator_uuid = %s
            returning indicators.*::indicators as updated_ind
            """), [new_description, chart_label, self.indicator_uuid])

        if cursor.rowcount:

            updated_ind = cursor.fetchone().updated_ind

            log.info("Updated description, chart_label on {0} to {1}, {2}".format(
                updated_ind,
                new_description,
                chart_label))

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
    def update_description_by_title(cls, pgconn, title, description,
        chart_label):

        """
        Use the title to find this indicator.  Then update the
        description.  Then return the updated indicator.
        """

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            update indicators

            set description = %s,
            chart_label = %s

            where title = %s
            returning indicators.*::indicators as updated_ind
            """), [description, chart_label, title])

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
        numerator_tables, denominator_tables, chart_label):

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
            denominator_tables = %(denominator_tables)s,
            chart_label = %(chart_label)s

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

    def lookup_my_racial_split(self, pgconn, location_uuid):

        """"

        Looks up an indicator location value racial split

        """
        racial_indicators= IndicatorLocationValue.find_racial_sub_indicators(
            self.title)

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
                and ilv.visible = true
                --and ilv.value != 999999

                order by ilv.observation_timestamp asc
            )

            select (i.*)::indicators as indicator,
            array_to_json(array_agg(ilv.*)) as indicator_values

            from indicator_value_location ilv
            join indicators i on ilv.indicator_uuid = i.indicator_uuid

            group by (i.*)

        """), dict(location_uuid=location_uuid,
                indicators=racial_indicators))

        self.racial_split = [row for row in cursor.fetchall()]

        return self

    def lookup_cv_and_moe(self, pgconn, location_uuid):

        """"

        Looks up an indicator location value racial split

        """
        cv_ind = 'cv' + self.title
        m_ind = 'm' + self.title
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
                and ilv.visible = true
                --and ilv.value != 999999

                order by ilv.observation_timestamp asc
            )

            select (i.*)::indicators as indicator,
            array_to_json(array_agg(ilv.*)) as indicator_values

            from indicator_value_location ilv
            join indicators i on ilv.indicator_uuid = i.indicator_uuid

            group by (i.*)

        """), dict(location_uuid=location_uuid,
                indicators=[cv_ind, m_ind]))

        if cursor.rowcount > 1:
            self.indicator_CV, self.indicator_moe = cursor.fetchall()


        return self

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
                and visible = True
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
        value, observation_timestamp_label, visible, inserted, updated):

        self.indicator_uuid = indicator_uuid
        self.location_uuid = location_uuid
        self.observation_timestamp = observation_timestamp
        self.observation_range = observation_range
        self.observation_timestamp_label = observation_timestamp_label
        self.value = value
        self.visible = visible
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
        observation_timestamp, value, visible=True):

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            update indicator_location_values

            set value = %s, visible = %s

            where (indicator_uuid, location_uuid, observation_timestamp)
            = (%s, %s, %s)

            returning indicator_location_values.*::indicator_location_values as ilv
            """), [value, visible, indicator, location, observation_timestamp])

        if cursor.rowcount:
            ilv = cursor.fetchone().ilv
            log.info("Updated {0}'s value to {1}.".format(ilv, value))
            return ilv

        else:
            raise KeyError("Sorry, no ILV with {0}, {1}, {2} found!".format(
                indicator,
                location,
                observation_timestamp))

    def update_my_value(self, pgconn, new_value, visible=True):

        if float(new_value) != self.value or self.visible != visible:

            return self.update_value(
                pgconn,
                self.indicator_uuid,
                self.location_uuid,
                self.observation_timestamp,
                float(new_value),
                visible=visible)

    @staticmethod
    def look_up_racial_split(pgconn, indicator_title,
        location_uuid, dt):

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            select
            (indicators.*)::indicators as i,
            (ilv.*) as indicator_value,
            indicators.chart_label,

            round(ilv.value - ilv_moe.value) as floor,
            round(ilv.value + ilv_moe.value) as ceiling

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

        """
        The CWRU folks have no single pattern for how they racial splits
        on statistics.
        """
        # This one is my favorite -- it is completely unlike the other
        # patterns.
        if indicator_title == "pop":
            return ["nhw", "nhb", "nhapi", "nho", "hisp"]

        # rpass50 => w_rpass50
        if indicator_title in set([
            "rpassed3", "rpassed4", "rpassed6", "rpassed10",
            "mpassed3", "mpassed4", "mpassed6", "mpassed10"
        ]):

            return ["{0}_{1}".format(c, indicator_title) for c in 'abhow']

        # _rpass50 => _w_rpass50
        elif indicator_title in set([
            "_rpassed50", "_rpassed20", "_rpassed10", "_rpassed41",
            "_mpassed50", "_mpassed20", "_mpassed10", "_mpassed41",
        ]):

            return ["_{0}{1}".format(c, indicator_title) for c in 'abhow']

        # _attend => w_attend
        elif indicator_title in set(["_attend"]):
            return ["{0}{1}".format(c, indicator_title) for c in 'abhow']

        # _emp => _wemp
        elif indicator_title in set(["_emp", "_lf", "_lshs", "_hsgrad",
            "_somecollassoc", "_bsp", "_bpv", "_native", "_foreign",
            "_samehse1y", "_diffhs1y","_drove", "_walk", "_public_tran",
            "_other_tran", "_workathome"
        ]):
            log.info(indicator_title)
            return ["_{0}{1}".format(c, indicator_title[1:]) for c in 'abhow']

        # t_cburden50p => w_cburden50p
        elif indicator_title.startswith("t_"):
            return ["{0}{1}".format(c, indicator_title[1:]) for c in 'abhow']

        elif indicator_title.startswith("_hh"):
            return ["_{0}{1}".format(c, indicator_title[1:]) for c in 'abhow']

        # _t_cburden50p => _w_cburden50p
        elif indicator_title.startswith("_t_c"):
            return ["_{0}_{1}".format(c, indicator_title[3:]) for c in 'abhow']

        # _pa_snap => _wpa_snap
        elif indicator_title.startswith("_pa_snap"):
            return ["_{0}{1}".format(c, indicator_title[1:]) for c in 'abhow']

        elif indicator_title.startswith("_"):
            return ["_{0}{1}".format(c, indicator_title) for c in 'abhow']

        # _t_cburden50p => _w_cburden50p
        elif indicator_title.startswith("_"):
            return ["_{0}_{1}".format(c, indicator_title[3:]) for c in 'abhow']

        # xyz => wxyz
        else:
            return ["{0}{1}".format(c, indicator_title) for c in 'abhow']

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

