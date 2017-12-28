# vim: set expandtab ts=4 sw=4 filetype=python fileencoding=utf8:

import argparse
import csv
import datetime
import glob
import logging
import os
import re

from profiles import configwrapper
from profiles import junkdrawer
from profiles import pg

log = logging.getLogger("profiles.scripts.insert_all_csv_files_2017")

def set_up_args():

    ap = argparse.ArgumentParser()
    ap.add_argument("yaml_file_name")

    return ap.parse_args()

def load_neighborhood(csv_file_name):

    global pgconn
    global cw

    return junkdrawer.CSVInserter.load_neighborhood(
        pgconn,
        csv_file_name)

def load_cdc(csv_file_name):

    global pgconn
    global cw

    return junkdrawer.CSVInserter.load_cdc(
        pgconn,
        csv_file_name)

if __name__ == "__main__":

    args = set_up_args()

    cw = configwrapper.ConfigWrapper.load_yaml(args.yaml_file_name)

    cw.configure_logging()

    pgconn = cw.get_pgconn()

    for xls_file in os.listdir(cw.xls_data_files_folder):

        # Skip these files
        if xls_file in set([
            "CNP Dashboard Varlist_2017.xlsx",
            "Indicators_Descriptions2017.xlsx",
            "CNP Dashboard Varlist_2017_w_chartlabels.xlsx",
            "CNP Dashboard Varlist_2017_revNov07.xlsx",
            "CNP Dashboard Chart By Race Mapping.xlsx",
            ]):

            continue

        else:

            xls_file_path = os.path.abspath(
                os.path.join(
                    cw.xls_data_files_folder,
                    xls_file))

            csv_file = junkdrawer.xls2csv(xls_file_path, os.path.join(
                "/tmp",
                "{0}.csv".format(os.path.splitext(os.path.basename(xls_file))[0])))

            csv_file_path = os.path.abspath(csv_file)

            if csv_file.endswith("cdc.csv"):
                load_cdc(csv_file_path)

            elif csv_file.endswith("spa.csv"):
                load_neighborhood(csv_file_path)

            else:
                raise Exception("Can not handle {0}.".format(csv_file))

    pgconn.commit()

    log.info("All done!")
