# The idea here is for long running admin jobs, like calibration
# we'll catch and run here. That means, they could be triggered
# from the webapp and added to the database.

# We'll poll the database for admin_jobs -- if we find one
# then we'll run it here and when completed, update with a completed
# time.

import argparse
import json
import logging
import multiprocessing
import socket
import sys
import textwrap
import time

from profiles import configwrapper
from profiles import pg

log = logging.getLogger("profiles.scripts.process_thumbnails")


# THis disables some warnings from pyrax library -- take it away to
# see SSL warnings
import requests.packages.urllib3
requests.packages.urllib3.disable_warnings()


def look_up_photos_not_completed(cw):

    cursor = cw.get_pgconn().cursor()

    cursor.execute(textwrap.dedent("""

        select (photos.*)::photos as photo

        from photos

        where thumbs_finished is null
        and upload_finished is not null
        and removed = false

    """))

    for row in cursor:

        yield row.photo

def count_photos_not_completed(cw):


    cursor = cw.get_pgconn().cursor()

    cursor.execute(textwrap.dedent("""

        select count(*)

        from photos

        where thumbs_finished is null
        and upload_finished is not null
        and removed = false

    """))

    return cursor.fetchone().count




def set_up_args():

    ap = argparse.ArgumentParser("process thumbnails")

    ap.add_argument("yaml_file_name")

    ap.add_argument(
        "--run-forever",
        action="store_true",
        help="Look for photos, sleep, GOTO 10",
        default=False)

    ap.add_argument(
        "--sleep-interval",
        type=int,
        default=10,
        help="How many seconds to sleep for (default 10)")

    return ap.parse_args()

def process_photos_pool(processes=4):

    pl = Pool(processes=processes)
    start_time = time.time()

    pl.map(process_photo, p_files)

    end_time = time.time()

    print 'Completed ' + str(end_time - start_time)

def process_photos(cw, pyrax):


    try:
        pgconn = cw.get_pgconn()
        uploads_container = pyrax.cloudfiles.get_container(cw.get_photo_container_name(
            'album'))


        count_photos = count_photos_not_completed(cw)

        if count_photos > 0:
            log.debug("Currently {0} photos to be processed".\
                format(count_photos_not_completed(cw)))
        for photo in look_up_photos_not_completed(cw):

            try:
                thumb_uuid, original_size, thumb_size = \
                    photo.make_thumbnail_and_upload(cw, uploads_container)

                web_op_uuid, original_size, web_op_size = \
                    photo.make_thumbnail_and_upload(cw, uploads_container,
                    size=[1024,1024])

                photo.mark_photo_as_finished(cw, thumb_uuid, original_size,
                    thumb_size, web_op_uuid, web_op_size)

                # Let's commit after each one so we get photos faster
                # On web side
                pgconn.commit()

            except IOError as e:

                log.exception("IO Error {0}".format(e))

                log.debug("Try to get a new copy of the photo, and we'll get back to it")

                photo.retrieve_locally(cw, re_try_download=True)
                continue

    except Exception as e:

        log.exception("Something bad happened {0}".format(e))


    finally:

        pgconn.commit()


if __name__ == "__main__":

    args = set_up_args()

    cw = configwrapper.ConfigWrapper.from_yaml_file_name(
        args.yaml_file_name)

    cw.configure_logging()

    cw.set_as_default()

    pyrax = cw.get_pyrax()

    if args.run_forever:

        while 1:
            process_photos(cw, pyrax)
            time.sleep(args.sleep_interval)

    else:
        process_photos(cw, pyrax)

    log.info("All done!")
