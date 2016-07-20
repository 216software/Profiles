# vim: set expandtab ts=4 sw=4 filetype=python fileencoding=utf8:

import csv
import logging
import os
import re
import string
import textwrap

import openpyxl

log = logging.getLogger(__name__)

def xls2csv(xls_file_path, csv_file_path):

    wb = openpyxl.load_workbook(xls_file_path)

    sheet_names = wb.get_sheet_names()

    if len(sheet_names) > 1:

        log.critical("Sorry, {0} has {1} sheets and I can only "
            "handle single-sheet files!".format(
            xls_file_path,
            len(sheet_names)))

    else:

        f = open(csv_file_path, "w")
        out = csv.writer(f)

        ws = wb.active

        for row in ws.rows:

            out.writerow([cell.value for cell in row])

        f.close()

        log.info("Saved {0}.".format(csv_file_path))

        return csv_file_path

def csv_to_pg_table(csv_file_path, sql_file_path):

    """
    Make up a postgresql table name based on the csv file name

    Open the csv file.

    Open an outfile to contain the generated SQL.

    Go line-by-line through the CSV file.

        Guess if each line is a heading line, a data line, or something
        else.

        If it is the heading line, read the field names and use those
        for columns.

        If it is the first data line, take a guess about data types.

        After we have both the heading and the first row of data, write
        out create table text to sql_file path.

        For the first data line and all following data lines,  write out
        some insert lines to the out file.

    Close the file.

    Return the path to the sql file.

    """

    leftstub, dot, suffix = os.path.basename(csv_file_path).rpartition(".")

    table_name = "csv_" + leftstub

    f = open(csv_file_path)

    cr = csv.DictReader(f)

    first_row = cr.next()

    second_row = cr.next()

    third_row = cr.next()

    fourth_row = cr.next()

    fifth_row = cr.next()

    table_columns = []

    for (k, v) in first_row.items():

        sql_type = guess_sql_type_to_use(v)

        log.debug("{0} {1} {2}".format(k, v, sql_type))

        table_columns.append("{0} {1}".format(k, sql_type))

    create_table_string = textwrap.dedent("""
        create table {0}
        (
            {1}
        );

        """.format(
            table_name,
            "\n".join(table_columns)))

    log.debug(create_table_string)

    with open(sql_file_path, "w") as sql_outfile:

        sql_outfile.write(create_table_string)

        sql_outfile.write(make_first_insert_line(table_name, first_row))

        sql_outfile.write(make_n_insert_lines(table_name, cr))

    return sql_file_path



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


if __name__ == "__main__":

    import doctest
    doctest.testmod()

