# vim: set expandtab ts=4 sw=4 filetype=python fileencoding=utf8:

import csv
import logging

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
