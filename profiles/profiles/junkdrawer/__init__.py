# vim: set expandtab ts=4 sw=4 filetype=python fileencoding=utf8:

import csv
import logging
import os
import re
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

    Read the field names and use those for columns.

    Read the first row of data and take a guess about data types.

    Write out create table text to sql_file path.

    Open an outfile to contain the generated SQL.

    Write out some insert lines to the out file.

    Close the file.

    Return the path to the sql file.

    """


    leftstub, dot, suffix = os.path.basename(csv_file_path).rpartition(".")

    table_name = "csv_" + leftstub

    log.debug(table_name)

    f = open(csv_file_path)

    cr = csv.DictReader(f)

    log.debug(cr.fieldnames)

    first_row = cr.next()

    log.debug(first_row)

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

        columns = sorted(first_row.keys())

        for row_number, d in enumerate(cr):

            log.debug(d)


            values


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
    >>> d2 = {'a': 1, 'b':2, 'c':3}

    >>> make_first_insert_line('abc', [d2, d2, d2]) == '''
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

    first_row = rows.next()

    column_names = sorted(first_row.keys())

    values = []

    values_string = "({0})".format(", ".join(str(first_row[k] for k in column_names)))

    values.append(values_string)

    for row in rows:

        values_string = "({0})".format(", ".join(str(row[k] for k in column_names)))

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
            ", ".join(sorted(d.keys())),
            ",\n".join(values)))

    return s


