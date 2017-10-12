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

        multi_page_xls2csv(xls_file_path, csv_file_path)

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

    wb = openpyxl.load_workbook(xls_file_path)

    sheet_names = wb.get_sheet_names()

    if len(sheet_names) == 1:

        log.critical("Sorry, {0} has {1} sheets and I can only "
            "handle multi-sheet files!".format(
            xls_file_path,
            len(sheet_names)))

    else:

        for sheet_name in sheet_names:

            out_file_path = os.path.join(
                csv_folder_path,
                "{0}.csv".format(sheet_name))

            f = open(out_file_path, "w")
            out = csv.writer(f)

            ws = wb.get_sheet_by_name(sheet_name)

            for row_number, row in enumerate(ws.rows, start=1):

                non_empty_cells = [unicode(cell.value) for cell
                    in row
                    if cell.value is not None
                    and unicode(cell.value).strip()]

                # This is in here because Tsui sometimes puts in two
                # header rows in her spreadsheets.
                if row_number == 1 and len(non_empty_cells) == 1:

                    log.debug(
                        "Will not write out row {0!r}.".format(
                            ", ".join(non_empty_cells)))

                    continue

                else:

                    out.writerow([unicode(cell.value).encode("utf-8") for cell in row if cell.value])

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


if __name__ == "__main__":

    import doctest
    doctest.testmod()

