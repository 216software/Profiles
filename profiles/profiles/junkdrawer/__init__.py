# vim: set expandtab ts=4 sw=4 filetype=python fileencoding=utf8:

import csv
import datetime
import logging
import os
import re
import string
import textwrap

import openpyxl

from profiles import pg

log = logging.getLogger(__name__)

def xls2csv(xls_file_path, csv_file_path):

    """
    Convert an XLS file to one or many CSV files.
    """

    log.debug("Working on xls file {0}.".format(xls_file_path))
    print xls_file_path

    wb = openpyxl.load_workbook(xls_file_path, data_only=True)

    sheet_names = wb.get_sheet_names()

    if len(sheet_names) > 1:

        raise Exception("Sorry, I can only handle one-worksheet files!  "
            " Use multi_page_xls2csv instead for {0}.".format(
            xls_file_path))

    else:

        f = open(csv_file_path, "w")
        out = csv.writer(f)

        ws = wb.active

        for row in ws.rows:

            out.writerow([cell.value for cell in row])

        f.close()

        log.info("Saved {0}.".format(csv_file_path))

        return csv_file_path

def multi_page_xls2csv(xls_file_path, csv_folder_path):

    wb = openpyxl.load_workbook(xls_file_path, data_only=True)

    sheet_names = wb.get_sheet_names()

    if len(sheet_names) == 1:

        log.critical("Sorry, {0} has {1} sheets and I can only "
            "handle multi-sheet files!".format(
            xls_file_path,
            len(sheet_names)))

    else:

        for sheet_name in sheet_names:

            if 'base chart outline' in sheet_name.lower():
                log.info("skipping base chart outline")
                continue

            out_file_path = os.path.join(
                csv_folder_path,
                "{0}.csv".format(sheet_name))

            f = open(out_file_path, "w")
            out = csv.writer(f)

            ws = wb.get_sheet_by_name(sheet_name)

            for row_number, row in enumerate(ws.rows, start=1):
                non_empty_cells = [unicode(cell.value) for cell
                    in row
                    if cell.value is not None \
                        and unicode(cell.value).strip()]


                # This is in here because Tsui sometimes puts in two
                # header rows in her spreadsheets.
                if row_number == 1 and len(non_empty_cells) == 1:

                    log.debug(
                        "Will not write out row {0!r}.".format(
                            ", ".join(non_empty_cells)))

                    continue

                else:


                    out.writerow([unicode(cell.value).encode("utf-8") if\
                    cell.value and u"='" not in unicode(cell.value)  \
                    else None for cell in row])

            f.close()

            log.info("Saved {0}.".format(out_file_path))
            yield out_file_path


def guess_sql_type_to_use(s):

    """
    >>> f = guess_sql_type_to_use

    >>> f("99")
    'integer'

    >>> f("3.14")
    'numeric'

    >>> f("-3.14")
    'numeric'

    >>> f("abc")
    'text'

    """

    if s.isdigit():
        return "integer"

    # This tests if every character in s is either a digit OR is a
    # negative sign or a dot.
    elif all([c.isdigit() or c in "-." for c in s]):
        return "numeric"

    else:
        return "text"


def make_first_insert_line(table_name, d):

    """
    >>> d = {'a': 1, 'b':2, 'c':3}

    >>> make_first_insert_line('abc', d) == '''
    ... insert into abc
    ... columns
    ... (a, b, c)
    ... values
    ... (1, 2, 3)
    ... ;
    ... '''
    True

    """

    s = textwrap.dedent("""
        insert into {0}
        columns
        ({1})
        values
        ({2})
        ;
        """.format(
            table_name,
            ", ".join(sorted(d.keys())),
            ", ".join(str(d[k]) for k in sorted(d.keys()))))

    return s



def make_n_insert_lines(table_name, rows):

    """
    >>> d = {'a': 1, 'b':2, 'c':3}

    >>> make_n_insert_lines('abc', [d, d, d]) == '''
    ... insert into abc
    ... columns
    ... (a, b, c)
    ... values
    ... (1, 2, 3),
    ... (1, 2, 3),
    ... (1, 2, 3)
    ... ;
    ... '''
    True

    """

    iterator = iter(rows)

    first_row = iterator.next()

    column_names = sorted(first_row.keys())

    values = []

    values_string = "({0})".format(", ".join(str(first_row[k]) for k in column_names))

    values.append(values_string)

    for row in iterator:

        values_string = "({0})".format(", ".join(str(row[k]) for k in column_names))

        values.append(values_string)

    s = textwrap.dedent("""
        insert into {0}
        columns
        ({1})
        values
        {2}
        ;
        """.format(
            table_name,
            ", ".join(column_names),
            ",\n        ".join(values)))

    return s

class CSVchunker(object):

    def __init__(self, open_csv_file):
        self.open_csv_file = open_csv_file
        self.cr = csv.reader(self.open_csv_file)

        self.headings = None

    @classmethod
    def load_csv_file(cls, csv_file_path):
        f = open(csv_file_path)
        return cls(f)

    def find_headings_row(self):

        """
        Look for a row that comes immediately before another row, where

        *   both have same number of columns
        *   the first row is all fields that look like headings (i.e., start with alpha characters)
        *   the second drow is all fields that look like data (but not
            sure how to test for that).

        """

        if self.headings:
            return self.headings

        else:

            prev_row = None

            for row_number, row in enumerate(self.cr, start=1):

                cleaned_row = [col for col in row if col.strip()]

                if prev_row and len(prev_row) == len(cleaned_row):

                    # Check if all columns in prev row could be valid
                    # headings.

                    if all(is_valid_heading(col) for col in prev_row):
                        self.headings = prev_row
                        return self.headings

                    else:

                        prev_row = cleaned_row

                else:
                    prev_row = cleaned_row


def is_valid_heading(s):

    """
    Guess if string s is a valid column heading.

    >>> f = is_valid_heading
    >>> f("abc123")
    True
    >>> f(99)
    False
    >>> f(3.14)
    False
    >>> f("3.14")
    False
    >>> f("-99")
    False

    """

    if isinstance(s, (int, float)):
        return False

    elif isinstance(s, (basestring)) \
    and len(s) > 0 \
    and (s[0] in "_" or s[0].isalpha()):

        return True

    else:
        return False

class CSVInserter(object):

    ends_with_year = re.compile(
        r"(?P<indicator_name>.+)(?P<year>\d{4})$")

    def __init__(self, path_to_csv, location_type,
        location_column_name):

        self.path_to_csv = path_to_csv
        self.location_type = location_type
        self.location_column_name = location_column_name

    def figure_out_location_title(self, row):

        """
        Sometimes, the neighborhood is in a column labelled neighbor10.
        Other times, it's in NEIGHBOR10.  And other times, it's in
        Neighborhood.

        Similar shenanigans exist for CDC data.

        This returns the title of the location by trying lots of
        different keys, and then returning what is the location for this
        row.
        """

        if self.location_column_name in row:

            return row[self.location_column_name]

        elif self.location_column_name.upper() in row:

            return row[self.location_column_name.upper()]

        elif self.location_type == "community development corporation" \
        and "CDC Service Area" in row:

            return row["CDC Service Area"]

        elif self.location_type == "neighborhood" \
        and "Neighborhood" in row:

            return row["Neighborhood"]

        else:

            log.critical(row)

            raise Exception(
                "Sorry, could not figure out location title in {0}!".format(
                    self.path_to_csv))

    def insert(self, pgconn):

        log.info("Starting to load {0}".format(
            os.path.basename(self.path_to_csv)))

        cr = csv.DictReader(open(self.path_to_csv))

        for row_number, row in enumerate(cr, start=1):

            location_title = self.figure_out_location_title(row)

            try:

                if location_title == 'Cleveland city' or location_title == 'Cleveland City':
                    location_title = 'Cleveland'
                    loc = pg.locations.Location.by_location_type_and_title(
                        pgconn,
                        'city',
                        location_title)

                elif location_title == 'Cuyahoga County':
                    loc = pg.locations.Location.by_location_type_and_title(
                        pgconn,
                        'county',
                        location_title)
                else:

                    loc = pg.locations.Location.by_location_type_and_title(
                        pgconn,
                        self.location_type,
                        location_title)

            except KeyError as ex:

                loc = pg.locations.Location.insert(
                    pgconn,
                    self.location_type,
                    location_title,
                    None,
                    None,
                    None)

            # Set all indicator values to visible = False

            log.info('setting all visible to false {0}'.format(loc))
            last_indicator = None

            sorted_rows = sorted(row.items(), key=lambda tup: tup[0])

            for (k, v) in sorted_rows:

                if v:

                    match = self.ends_with_year.match(k)

                    if match:

                        indicator_name = match.groupdict().get("indicator_name")

                        year = match.groupdict().get("year")

                        # Replace weird dates.
                        if year == "1014":
                            year = "2014"

                        elif year == "0610":
                            year = "2010"

                        elif year == "0711":
                            year = "2011"

                        elif year == "0812":
                            year = "2012"

                        elif year == "0913":
                            year = "2013"

                        elif year == "1115":
                            year = "2015"

                        elif year == "1216":
                            year = "2016"

                        elif year == "1317":
                            year = "2017"

                        elif year == "1418":
                            year = "2018"

                        elif year == "1519":
                            year = "2019"


                        try:
                            ind = pg.indicators.Indicator.by_title(
                                pgconn,
                                indicator_name)

                        except KeyError as ex:

                            ind = pg.indicators.Indicator.insert(
                                pgconn,
                                indicator_name, # title
                                None,
                                None, # indicator value format
                                None, # indicator category
                                os.path.basename(self.path_to_csv),
                                k,
                                None
                            )

                        # Look for this key.
                        loc.set_all_visible(pgconn, ind, visible=False)

                        try:

                            ilv = pg.indicators.IndicatorLocationValue.by_ilo(
                                pgconn,
                                ind.indicator_uuid,
                                loc.location_uuid,
                                datetime.datetime.strptime(year, "%Y").date())

                        # Do an insert if this ILV doesn't exist.
                        except KeyError:

                            indlocval = pg.indicators.IndicatorLocationValue.insert(
                                pgconn,
                                ind.indicator_uuid,
                                loc.location_uuid,
                                datetime.datetime.strptime(year, "%Y").date(),
                                None, # observation_range
                                v)

                        # Otherwise, do an update, but only when the old value
                        # doesn't match the new one.
                        else:

                           ilv = ilv.update_my_value(pgconn, v)

        log.info("Inserted all data from {0}.".format(
            os.path.basename(self.path_to_csv)))

    @classmethod
    def load_neighborhood(cls, pgconn, path_to_csv):

        self = CSVInserter(path_to_csv, "neighborhood", "neighbor10")

        self.insert(pgconn)

        return self

    @classmethod
    def load_cdc(cls, pgconn, path_to_csv):

        self = CSVInserter(
            path_to_csv,
            "community development corporation",
            "cdc_name")

        self.insert(pgconn)

        return self

class CSVUpdater(object):


    def __init__(self, path_to_csv):

        self.path_to_csv = path_to_csv

    def update_descriptions(self, pgconn):

        log.info("Starting to update descriptions from {0}".format(
            os.path.basename(self.path_to_csv)))

        cr = csv.DictReader(open(self.path_to_csv))

        for row_number, row in enumerate(cr, start=1):

            variable_name = row.get('Variable Name')

            try:

                ind = pg.indicators.Indicator.by_title(
                    pgconn,
                    variable_name)

            except KeyError as ex:
                log.error(ex)
                log.info("No indicator found with name".format(variable_name))
                continue

            else:

                vd = row.get('Variable Description')
                source = row.get('Source')
                note = row.get('Note')
                definition = row.get('Definition')
                universe = row.get('Universe')
                limitations = row.get('Limitations')
                num_tables = row.get('Numerator Tables')
                denom_tables = row.get('Denominator Tables')
                data_as_of = row.get('Data as-of date')
                chart_label = row.get('Chart Label')

                if vd and ind.description != vd:
                    log.info("updating description")
                    ind.update_description(pgconn, vd, None)
                    ind.update_pretty_label(pgconn, vd)

                pg.indicators.Indicator.update_extra_details_by_title(pgconn,
                    ind.title, vd, definition, universe, limitations, note,
                    source, data_as_of, num_tables, denom_tables,
                    chart_label)

                # Lastly, update visiblity

                time_type = row.get('TimeType').lower()
                if row.get('StartTime1'):
                    # Set everything to false
                    ind.set_all_visible(pgconn, visible=False)

                    if time_type == 'yearly':
                        ind.set_visible_years(pgconn,
                            start_year=row.get('StartTime1'),
                            end_year=row.get('EndTime1'),
                            visible=True)

                    elif time_type == '5 year survey' :


                        if row.get('EndTime1'):

                            ind.set_visible_year(pgconn,
                                year=row.get('EndTime1'),
                                visible=True)

                        if row.get('EndTime2'):

                            ind.set_visible_year(pgconn,
                                year=row.get('EndTime2'),
                                visible=True)

                    elif time_type == '5 year average' :
                        if not row.get('EndTime1'):
                            log.error(textwrap.dedent("""
                                This row is marked as 5 survey
                                but has no end time !
                                {0}
                                """.format(row)))
                        else:
                            ind.set_visible_year(pgconn,
                                year=row.get('EndTime1'),
                                visible=True)

                    elif time_type == 'school year':
                        ind.set_visible_years(pgconn,
                            start_year=row.get('StartTime1'),
                            end_year=row.get('EndTime1'),
                            visible=True)


                    else:
                        log.debug(time_type)

                else:
                    log.debug("No Start Time for {0}".format(row))


            # Set all indicator values to visible = False


        log.info("Updated all indicators from {0}.".format(
            os.path.basename(self.path_to_csv)))




    @classmethod
    def load_descriptions(cls, pgconn, path_to_csv):

        self = CSVUpdater(
            path_to_csv
            )

        self.update_descriptions(pgconn)

        return self

if __name__ == "__main__":

    import doctest
    doctest.testmod()

