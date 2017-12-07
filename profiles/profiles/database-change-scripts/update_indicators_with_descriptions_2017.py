# vim: set expandtab ts=4 sw=4 filetype=python fileencoding=utf8:

"""
Despite the script name, this reads the CNP Varlist_2017 spreadsheet.
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
            "CNP Dashboard Varlist_2017_w_chartlabels.xlsx"),
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

                if "Variable Name" in row and "Variable Description" in row:
                    ind_title = row["Variable Name"]
                    ind_description = row["Variable Description"]

                elif "neighbor10" in row:
                    ind_title = row["neighbor10"]
                    ind_description = row["Neighborhood"]

                else:

                    log.critical(row_number)
                    log.critical(row)
                    raise Exception("Could not figure out what column has variable name in it!")

                try:

                    updated_ind = pg.indicators.Indicator.update_description_by_title(
                        pgconn,
                        ind_title,
                        ind_description,
                        row["Chart Label"])

                except KeyError as ex:

                    try:

                        for ind in pg.indicators.Indicator.by_sas_variable(
                            pgconn,
                            ind_title):

                            updated_ind = ind.update_description(
                                pgconn,
                                ind_description)

                    except KeyError as ex:

                        log.error("{0}:{1} not in indicators".format(
                            csv_file_path,
                            ind_title))

    pgconn.commit()

    log.info("All done!")
