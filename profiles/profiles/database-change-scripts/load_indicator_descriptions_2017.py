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

    cursor = pgconn.cursor()

    could_not_find_these_indicators = list()

    for csv_file_path in junkdrawer.multi_page_xls2csv(
        os.path.join(
            cw.xls_data_files_folder,
            "Indicators_Descriptions2017.xlsx"),
        "/tmp"):

        if not os.path.isfile(csv_file_path):

            raise IOError(csv_file_path)

        else:

            log.info("Reading {0}.".format(csv_file_path))

            cr = csv.DictReader(open(csv_file_path))

            for row_number, row in enumerate(cr, start=1):

                # Clean up whitespace around keys.
                for col in row.keys():

                    if col is not None:
                        row[col.strip()] = row[col]

                if row_number % 100 == 1:
                    log.debug("{0!r}".format(row))

                # Sample row:
                # {'Category': 'Economy', 'Definition': 'Jobs in neighborhood',
                # 'Limitations': 'December 31, 2015', 'Universe':
                # 'Longitudinal Employer-Household Dynamics', 'Variable
                # Description': 'Jobs in neighborhood', 'Note': None,
                # 'Source': None, 'Data as of': None, 'Variable Name Prefix': 'alljobs'}

                try:
                    ind = pg.indicators.Indicator.by_title(pgconn, row["Variable Name Prefix"])

                except KeyError as ex:

                    log.warning("Could not find indicator {0}".format(row["Variable Name Prefix"]))

                    could_not_find_these_indicators.append(row["Variable Name Prefix"])

                else:

                    ind.update_extra_details_by_title(
                        pgconn,
                        row["Variable Name Prefix"],
                        row["Variable Description"],
                        row["Definition"],
                        ind.none_or_s(row["Universe"]),
                        row["Limitations"],
                        row["Note"],
                        row["Source"],
                        row.get("Data as of"),
                        row.get("Numerator Tables"),
                        row.get("Denominator Tables"),
                        ind.none_or_s(row.get("Chart Label")))

                    ind.update_pretty_label(pgconn, row["Variable Description"])

        log.info("There were {0} indicators in the CSV we couldn't find.".format(len(could_not_find_these_indicators)))

        log.info("{0!r}".format(could_not_find_these_indicators))

    pgconn.commit()

    log.info("All done!")
