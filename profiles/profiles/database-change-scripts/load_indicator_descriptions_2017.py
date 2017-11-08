# vim: set expandtab ts=4 sw=4 filetype=python fileencoding=utf8:

"""
Load the Indicatorts Descriptions 2017 spreadsheet.
"""

import argparse
import csv
import datetime
import logging
import os
import re

from profiles import configwrapper
from profiles import pg
from profiles import junkdrawer

log = logging.getLogger("profiles.scripts.update_indicators_with_descriptions_2017")

def set_up_args():

    ap = argparse.ArgumentParser()
    ap.add_argument("yaml_file_name")

    return ap.parse_args()


if __name__ == "__main__":

    args = set_up_args()

    cw = configwrapper.ConfigWrapper.load_yaml(args.yaml_file_name)

    cw.configure_logging()

    pgconn = cw.get_pgconn()

    for csv_file_path in junkdrawer.multi_page_xls2csv(
        os.path.join(
            cw.xls_data_files_folder,
            "CNP Dashboard Varlist_2017.xlsx"),
        "/tmp"):

        if not os.path.isfile(csv_file_path):

            raise IOError(csv_file_path)

        else:

            cr = csv.DictReader(open(csv_file_path))

            for row_number, row in enumerate(cr, start=1):

                # Clean up whitespace around keys.
                for col in row.keys():

                    if col is not None:
                        row[col.strip()] = row[col]

