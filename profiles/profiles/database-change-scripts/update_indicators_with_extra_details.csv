# vim: set expandtab ts=4 sw=4 filetype=python fileencoding=utf8:

import argparse
import csv
import datetime
import logging
import os
import re

from profiles import configwrapper
from profiles import pg

log = \
    logging.getLogger("profiles.scripts.update_indicators_with_extra_details")

def set_up_args():

    ap = argparse.ArgumentParser()
    ap.add_argument("yaml_file_name")

    return ap.parse_args()

description_files = """
indicator-extra-data-descriptions.csv
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

                if "Variable Name Prefix" in row:
                    ind_title = row["Variable Name Prefix"]

                    ind_description = row["Variable Description"]
                    ind_definition = row["Definition"]
                    ind_universe = row["Universe"]
                    ind_limitations = row["Limitations"]
                    ind_note = row["Note"]
                    ind_source = row["Source"]
                    ind_data_as_of = row["Data as of"]
                    ind_num_table = row["Numerator Tables"]
                    ind_den_table = row["Denominator Tables"]

                else:

                    log.critical(row)
                    raise Exception("Could not figure out what column has variable name in it!")

                try:

                    updated_ind = \
                    pg.indicators.Indicator.update_extra_details_by_title(
                        pgconn,
                        ind_title,
                        ind_description,
                        ind_definition,
                        ind_universe,
                        ind_limitations,
                        ind_note,
                        ind_source,
                        ind_data_as_of,
                        ind_num_table,
                        ind_den_table)


                except KeyError as ex:

                    log.debug(ex)

                    try:

                        for ind in pg.indicators.Indicator.by_sas_variable(
                            pgconn,
                            ind_title):

                            updated_ind =  \
                                pg.indicators.Indicator.update_extra_details_by_title(
                                    pgconn,
                                    ind.title,
                                    ind_description,
                                    ind_definition,
                                    ind_universe,
                                    ind_limitations,
                                    ind_note,
                                    ind_source,
                                    ind_data_as_of,
                                    ind_num_table,
                                    ind_den_table)

                    except KeyError as ex:

                        log.error("{0}:{1} not in indicators".format(csv_file_name,
                            ind_title))

    pgconn.commit()

    log.info("All done!")
