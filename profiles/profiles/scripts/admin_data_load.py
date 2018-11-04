# vim: set expandtab ts=4 sw=4 filetype=python fileencoding=utf8:
# -*- coding: utf-8 -*-

import argparse
import collections
import logging
import os
import sys
import textwrap

from profiles import configwrapper
from profiles import junkdrawer

log = logging.getLogger("profiles.scripts.admin_data_load")

def set_up_args():

    ap = argparse.ArgumentParser(
        description="Script to watch admin data load and begin load when job is found")

    ap.add_argument("yaml_file_name")

    return ap.parse_args()

def lookup_job(pgconn):

    cursor = pgconn.cursor()

    cursor.execute(textwrap.dedent("""
        select job_uuid, zip_files.original_filename

        from admin_data_load_jobs

        left join zip_files on zip_files.zip_file_uuid =
        admin_data_load_jobs.zip_file_uuid

        where now()::timestamp without time zone <@ job_start_end

    """))

    if cursor.rowcount:
        return cursor.fetchone()


def update_job_with_total_files(pgconn, num_total_files, job_uuid):

    cursor = pgconn.cursor()

    cursor.execute(textwrap.dedent("""
        update admin_data_load_jobs

        set total_files_to_process = %(total_files)s,
        files_processed = 0

        where job_uuid = %(job_uuid)s

    """), dict(total_files=num_total_files, job_uuid=job_uuid))

    return num_total_files

def update_job_with_num_files_processed(pgconn, num_files, job_uuid):

    cursor = pgconn.cursor()

    cursor.execute(textwrap.dedent("""
        update admin_data_load_jobs

        set files_processed = %(num_files)s

        where job_uuid = %(job_uuid)s

    """), dict(num_files=num_files, job_uuid=job_uuid))

    return num_files


def close_job(pgconn, job_uuid):

    cursor = pgconn.cursor()

    cursor.execute(textwrap.dedent("""
        update admin_data_load_jobs

        set job_start_end = tsrange(lower(job_start_end), now()::timestamp without time zone)

        where job_uuid = %(job_uuid)s

    """), dict(job_uuid=job_uuid))

    return



def log_job_message(pgconn, job_uuid, message):

    cursor = pgconn.cursor()

    cursor.execute(textwrap.dedent("""
        update admin_data_load_jobs

        set job_log = job_log || '<br />' || TO_CHAR(NOW(), 'MM.DD.YY HH:MM') || ' - ' ||  %(message)s

        where job_uuid = %(job_uuid)s

    """), dict(job_uuid=job_uuid, message=message))

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

def remove_old_data(pgconn):

    log.info("DELETING CURRENT DATA!")


# borrowed from database change insert all csv files
def insert_csv_files(pgconn, directory, job_uuid):

    jobs_done = 0
    for xls_file in os.listdir(directory):

        # Skip these files
        if xls_file in set([
            "CNP Dashboard Varlist_2017.xlsx",

            "Indicators_Descriptions2017.xlsx",
            "CNP Dashboard Varlist_2016Apr14.xlsx",
            "CNP Dashboard Varlist_2017_w_chartlabels.xlsx",
            "CNP Dashboard Varlist_2017_revNov07.xlsx",
            "CNP Dashboard Chart By Race Mapping.xlsx",
            ]):

            continue

        else:

            xls_file_path = os.path.abspath(
                os.path.join(
                    directory,
                    xls_file))

            csv_file = junkdrawer.xls2csv(xls_file_path, os.path.join(
                "/tmp",
                "{0}.csv".format(os.path.splitext(os.path.basename(xls_file))[0])))

            csv_file_path = os.path.abspath(csv_file)


            log_job_message(pgconn, job_uuid,
            "<b>Trying to load: {0}</b>".\
                format(csv_file))
            pgconn.commit()


            if csv_file.endswith("cdc.csv"):
                load_cdc(csv_file_path)
                log_job_message(pgconn, job_uuid,
                "<span style='color:green'>Loaded cdc {0}</span>".\
                    format(csv_file))

            elif csv_file.endswith("spa.csv"):
                load_neighborhood(csv_file_path)
                log_job_message(pgconn, job_uuid,
                "<span style='color:green'>Loaded neighborhood {0}</span>".\
                    format(csv_file))

            else:
                log_job_message(pgconn, job_uuid,
                "<span style='color:red'>Can't load {0}</span>".\
                    format(csv_file))

            jobs_done += 1
            update_job_with_num_files_processed(pgconn, jobs_done,
                job_uuid)

            pgconn.commit()


if __name__ == "__main__":

    args = set_up_args()

    cw = configwrapper.ConfigWrapper.load_yaml(args.yaml_file_name)

    cw.configure_logging("script")

    pgconn = cw.get_pgconn()

    job_uuid, zip_file_path = lookup_job(pgconn)

    if job_uuid is None:
        log.info("No admin job running. Quitting")
        sys.exit(0)

    log.info("Admin job found! {0}".format(job_uuid))

    log_job_message(pgconn, job_uuid,
        "Found open job with zip file {0}".format(zip_file_path))
    pgconn.commit()

    import zipfile
    zip_ref = zipfile.ZipFile(zip_file_path, 'r')
    zip_ref.extractall('/tmp/profiles')

    update_job_with_total_files(pgconn, len(zip_ref.infolist()),
        job_uuid)

    log_job_message(pgconn, job_uuid, "Extracted zip file to '/tmp' {0}".format("<br />".join([x for x in zip_ref.namelist()])))

    zip_ref.close()

    pgconn.commit()

    # OK, now try to do the actual data load!

    # TODO -- clear our our data before we try to load!

    remove_old_data(pgconn)
    try:
        insert_csv_files(pgconn, '/tmp/profiles', job_uuid)

    except Exception as e:
        log.error("We experienced failure loading csv {0}".format(e))

    log.debug("closing admin job")
    close_job(pgconn, job_uuid)

    pgconn.commit()

    log.info("All done!")
