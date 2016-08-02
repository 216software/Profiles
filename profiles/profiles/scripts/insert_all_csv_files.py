# vim: set expandtab ts=4 sw=4 filetype=python fileencoding=utf8:

import argparse
import csv
import logging
import os
import re

from profiles import configwrapper
from profiles import pg

log = logging.getLogger("profiles.scripts.insert_all_csv_files")

all_csv_files = """
armslength2011to2015_cdc.csv
armslength2011to2015.csv
blood_lead2010to2014_cdc.csv
blood_lead2010to2014.csv
cen_acs_lehd_cdc2016Apr14.csv
cen_acs_lehd_spa2016Apr14.csv
cmsd_attend2011to2015_cdc.csv
cmsd_attend2011to2015.csv
cmsd_prof11to15_cdc.csv
cmsd_prof11to15.csv
foreclosures2011to2015_cdc.csv
foreclosures2011to2015.csv
graduation_rates_cdc.csv
graduation_rates.csv
kral2011to2015_cdc.csv
kral2011to2015.csv
LifeExpectancy_2009to2013_cdc.csv
LifeExpectancy_2009to2013.csv
Preschool_quality_slots_2011to2015_cdc.csv
Preschool_quality_slots_2011to2015.csv
usps_vac2011to2015._cdc2016Jan27.csv
usps_vac2011to2015_spa2016Jan27.csv
"""

def set_up_args():

    ap = argparse.ArgumentParser()
    ap.add_argument("yaml_file_name")
    ap.add_argument("csv_file_folder")

    return ap.parse_args()

def insert_armslength2011to2015_cdc(path_to_file, pgconn):

    """
    {'med_ntal_price2011': '40000', 'ntal_sales2015': '190',
    'ntal_sales2014': '204', 'ntal_sales2013': '164', 'ntal_sales2012':
    '134', 'ntal_sales2011': '127', 'med_sfprice2015': '42000',
    'med_sfprice2014': '35000', 'med_sfprice2013': '30620',
    'med_sfprice2012': '28750', 'med_sfprice2011': '29000',
    'med_al_price2015': '42500', 'med_al_price2014': '35000',
    'med_al_price2011': '29000', 'med_al_price2013': '31000',
    'med_al_price2012': '29250', '_sfsale2015': '92.59',
    'pctchgrt_mfsales': '42.5', '_sfsale2013': '94.41', '_sfsale2012':
    '93.33', '_sfsale2011': '94.8', 'sfsale2011': '255', '_mfsale2015':
    '7.41', 'sfsale2014': '301', 'pctchg_medalprice': '46.55',
    '_mfsale2011': '5.2', 'sfsale2013': '304', '_mfsale2013': '5.59',
    'sfsale2012': '252', '_mfsale2012': '6.67', 'pctchg_medntalprice':
    '28.29', 'mfsale2013': '18', 'mfsale2012': '18', 'mfsale2011': '14',
    'mfsale2015': '24', 'mfsale2014': '22', 'med_ntal_price2015':
    '51317.5', 'distress2011': '19', 'distress2012': '16',
    'distress2013': '10', 'distress2014': '13', 'distress2015': '15',
    'med_ntal_price2013': '45600', 'med_ntal_price2012': '38650',
    'pctchg_alsales': '20.45', 'pctchgrt_sfsales': '-2.33',
    'cdsale2015': '', 'cdsale2014': '', 'cdsale2013': '', 'cdsale2012':
    '', 'cdsale2011': '', 'pctchg_medmfprice': '130.78', 'cdc_name':
    'Bellaire Puritas Community Dev. Corp.', 'al_sales2015': '324',
    'al_sales2014': '323', 'al_sales2013': '322', 'al_sales2012': '270',
    'al_sales2011': '269', 'pctchgrt_cdsales': '', '_distress2014':
    '4.02', '_distress2015': '4.63', '_distress2012': '5.93',
    '_distress2013': '3.11', '_distress2011': '7.06', '_mfsale2014':
    '6.81', '_ntalsales2011': '47.21', '_ntalsales2013': '50.93',
    '_ntalsales2012': '49.63', '_ntalsales2015': '58.64',
    '_ntalsales2014': '63.16', 'med_cdprice2011': '', 'med_cdprice2013':
    '', 'med_cdprice2012': '', 'med_cdprice2015': '', 'med_cdprice2014':
    '', 'pctchg_medsfprice': '44.83', 'sfsale2015': '300',
    'med_mfprice2011': '25760', 'med_mfprice2013': '34500',
    'med_mfprice2012': '29750', 'med_mfprice2015': '59450',
    'med_mfprice2014': '40500', 'pctchgrt_distress': '-34.42',
    'pctchgrt_ntalsales': '24.21', '_cdsale2015': '', '_cdsale2014': '',
    '_cdsale2011': '', 'pctchg_medcdprice': '', '_cdsale2013': '',
    '_cdsale2012': '', '_sfsale2014': '93.19', 'med_ntal_price2014':
    '42283.5'}
    """

    cr = csv.DictReader(open(path_to_file))

    ends_with_year = re.compile(
        r"(?P<indicator_name>.+)(?P<year>\d{4})$")

    for row_number, row in enumerate(cr, start=1):

        if row_number == 1:
            print row

        for (k, v) in row.items():

            match = ends_with_year.match(k)

            if match:

                indicator_name = match.groupdict().get("indicator_name")

                year = match.groupdict().get("year")

                if row_number == 1:

                    # log.debug("{0} {1} {2} {3}".format(
                        # k,
                        # indicator_name,
                        # year))

                    ind = pg.indicators.Indicator.insert(
                        pgconn,
                        indicator_name, # title
                        None, # description
                        None, # indicator value format
                        None  # indicator category
                        )


if __name__ == "__main__":

    args = set_up_args()

    cw = configwrapper.ConfigWrapper.load_yaml(args.yaml_file_name)

    cw.configure_logging()

    pgconn = cw.get_pgconn()

    insert_armslength2011to2015_cdc(
        os.path.join(
            args.csv_file_folder,
            "armslength2011to2015_cdc.csv"),
        pgconn)

    log.info("All done!")
