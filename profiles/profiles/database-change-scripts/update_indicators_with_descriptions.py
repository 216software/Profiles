# vim: set expandtab ts=4 sw=4 filetype=python fileencoding=utf8:

import argparse
import csv
import datetime
import logging
import os
import re

from profiles import configwrapper
from profiles import pg

log = logging.getLogger("profiles.scripts.update_indicators_with_descriptions")

def set_up_args():

    ap = argparse.ArgumentParser()
    ap.add_argument("yaml_file_name")

    return ap.parse_args()

description_files = """
Armslength.csv
Blood Lead Level.csv
CMSD Attendance.csv
CMSD Proficiency Tests.csv
CMSD-KRAL.csv
Crimes.csv
Mortality-Life Expectancy.csv
Property-Foreclosure.csv
Quality pre-school slots.csv
USPS Vacancies.csv
cen_acs_lehd.csv
""".strip()

if __name__ == "__main__":

    args = set_up_args()

    cw = configwrapper.ConfigWrapper.load_yaml(args.yaml_file_name)

    cw.configure_logging()

    pgconn = cw.get_pgconn()

    for csv_file_name in description_files.split("\n"):

        log.info(csv_file_name)

        csv_file_path = os.path.join(
            cw.csv_data_files_folder,
            csv_file_name)

        if not os.path.isfile(csv_file_path):

            raise Exception(csv_file_path)

        else:

            cr = csv.reader(open(csv_file_path))

            previous_row = None

            for row_number, row in enumerate(cr, start=1):

                if row_number < 3:
                    log.debug(row)

                previous_row = row


    # pgconn.commit()

    log.info("All done!")
