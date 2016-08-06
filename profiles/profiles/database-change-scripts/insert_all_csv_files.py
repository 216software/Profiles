# vim: set expandtab ts=4 sw=4 filetype=python fileencoding=utf8:

import argparse
import csv
import datetime
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

    return ap.parse_args()

class CSVInserter(object):

    def __init__(self, path_to_csv, location_type,
        location_column_name):

        self.path_to_csv = path_to_csv
        self.location_type = location_type
        self.location_column_name = location_column_name

    def figure_out_location_title(self, row):

        """
        Sometimes, the neighborhood is in a column labelled neighbor10.
        Other times, it's in NEIGHBOR10.  And other times, it's in
        Neighborhood.

        Similar shenanigans exist for CDC data.

        This returns the title of the location by trying lots of
        different keys, and then returning what is the location for this
        row.
        """

        if self.location_column_name in row:

            return row[self.location_column_name]

        elif self.location_column_name.upper() in row:

            return row[self.location_column_name.upper()]

        elif self.location_type == "community development corporation" \
        and "CDC Service Area" in row:

            return row["CDC Service Area"]

        elif self.location_type == "neighborhood" \
        and "Neighborhood" in row:

            return row["Neighborhood"]

        else:

            log.critical(row)

            raise Exception(
                "Sorry, could not figure out location title in {0}!".format(
                    self.path_to_csv))

    def insert(self, pgconn):

        log.info("Starting to load {0}".format(
            os.path.basename(self.path_to_csv)))

        cr = csv.DictReader(open(self.path_to_csv))

        ends_with_year = re.compile(
            r"(?P<indicator_name>.+)(?P<year>\d{4})$")

        for row_number, row in enumerate(cr, start=1):

            location_title = self.figure_out_location_title(row)

            try:

                loc = pg.locations.Location.by_location_type_and_title(
                    pgconn,
                    self.location_type,
                    location_title)

            except KeyError as ex:

                loc = pg.locations.Location.insert(
                    pgconn,
                    self.location_type,
                    location_title,
                    None,
                    None,
                    None)

            for (k, v) in row.items():

                if v:

                    match = ends_with_year.match(k)

                    if match:

                        indicator_name = match.groupdict().get("indicator_name")

                        year = match.groupdict().get("year")

                        try:
                            ind = pg.indicators.Indicator.by_title(
                                pgconn,
                                indicator_name)

                        except KeyError as ex:

                            ind = pg.indicators.Indicator.insert(
                                pgconn,
                                indicator_name, # title
                                None,
                                None, # indicator value format
                                None, # indicator category
                                os.path.basename(self.path_to_csv),
                                k
                            )

                        indlocval = pg.indicators.IndicatorLocationValue.insert(
                            pgconn,
                            ind.indicator_uuid,
                            loc.location_uuid,
                            datetime.datetime.strptime(year, "%Y").date(),
                            None, # observation_range
                            v)

        log.info("Inserted all data from {0}.".format(
            os.path.basename(self.path_to_csv)))

    @classmethod
    def load_neighborhood(cls, pgconn, csv_file_folder, file_name):

        path_to_csv = os.path.join(csv_file_folder, file_name)

        self = CSVInserter(path_to_csv, "neighborhood", "neighbor10")

        self.insert(pgconn)

        return self

    @classmethod
    def load_cdc(cls, pgconn, csv_file_folder, file_name):

        path_to_csv = os.path.join(csv_file_folder, file_name)

        self = CSVInserter(
            path_to_csv,
            "community development corporation",
            "cdc_name")

        self.insert(pgconn)

        return self

def load_neighborhood(csv_file_name):

    global pgconn
    global cw

    return CSVInserter.load_neighborhood(
        pgconn,
        cw.csv_data_files_folder,
        csv_file_name)

def load_cdc(csv_file_name):

    global pgconn
    global cw

    return CSVInserter.load_cdc(
        pgconn,
        cw.csv_data_files_folder,
        csv_file_name)

if __name__ == "__main__":

    args = set_up_args()

    cw = configwrapper.ConfigWrapper.load_yaml(args.yaml_file_name)

    cw.configure_logging()

    pgconn = cw.get_pgconn()

    load_cdc("armslength2011to2015_cdc.csv")
    load_neighborhood("armslength2011to2015.csv")

    load_cdc("blood_lead2010to2014_cdc.csv")
    load_neighborhood("blood_lead2010to2014.csv")

    load_cdc("cen_acs_lehd_cdc2016Apr14.csv")
    load_neighborhood("cen_acs_lehd_spa2016Apr14.csv")

    load_cdc("cmsd_attend2011to2015_cdc.csv")
    load_neighborhood("cmsd_attend2011to2015.csv")

    load_cdc("cmsd_prof11to15_cdc.csv")
    load_neighborhood("cmsd_prof11to15.csv")
    load_cdc("foreclosures2011to2015_cdc.csv")
    load_neighborhood("foreclosures2011to2015.csv")
    load_cdc("graduation_rates_cdc.csv")
    load_neighborhood("graduation_rates.csv")
    load_cdc("kral2011to2015_cdc.csv")
    load_neighborhood("kral2011to2015.csv")

    load_cdc("LifeExpectancy_2009to2013_cdc.csv")
    load_neighborhood("LifeExpectancy_2009to2013.csv")

    load_cdc("Preschool_quality_slots_2011to2015_cdc.csv")
    load_neighborhood("Preschool_quality_slots_2011to2015.csv")

    load_cdc("usps_vac2011to2015._cdc2016Jan27.csv")
    load_neighborhood("usps_vac2011to2015_spa2016Jan27.csv")

    pgconn.commit()

    log.info("All done!")
