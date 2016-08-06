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

            cr = csv.DictReader(open(csv_file_path))

            for row_number, row in enumerate(cr, start=1):

                # Clean up whitespace around keys.
                for col in row.keys():
                    row[col.strip()] = row[col]

                if row_number < 2:
                    log.debug(row)

                if "Variable Name" in row and "Variable Description" in row:
                    ind_title = row["Variable Name"]
                    ind_description = row["Variable Description"]

                elif "neighbor10" in row:
                    ind_title = row["neighbor10"]
                    ind_description = row["Neighborhood"]

                else:

                    log.critical(row)
                    raise Exception("Could not figure out what column has variable name in it!")

                try:

                    updated_ind = pg.indicators.Indicator.update_description_by_title(
                        pgconn,
                        ind_title,
                        ind_description)

                except KeyError as ex:

                    try:

                        for ind in pg.indicators.Indicator.by_sas_variable(
                            pgconn,
                            ind_title):

                            updated_ind = ind.update_description(
                                pgconn,
                                ind_description)

                    except KeyError as ex:

                        log.error("{0}:{1} not in indicators".format(csv_file_name, ind_title))

    pgconn.commit()

    log.info("All done!")
