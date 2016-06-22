# vim: set expandtab ts=4 sw=4 filetype=python fileencoding=utf8:

import argparse
import logging
import string

import textwrap

from profiles import configwrapper

log = logging.getLogger("profiles.create-photo-contaienrs")

def set_up_arguments():

    ap = argparse.ArgumentParser()

    ap.add_argument(
        'yaml_file_name',
        help='This is your config file')

    return ap.parse_args()

def create_photo_container(cw, pyrax, photo_type):
    uploads_container = pyrax.cloudfiles.create_container(
        cw.get_photo_container_name(
        photo_type))

    uploads_container.set_metadata({
        'Access-Control-Allow-Origin':
        cw.web_host})

    # This makes this container into a CDN.
    uploads_container.make_public()

    return uploads_container


if __name__ == "__main__":

    args = set_up_arguments()

    cw = configwrapper.ConfigWrapper.from_yaml_file_name(
        args.yaml_file_name)

    cw.configure_logging()
    pyrax_conn = cw.get_pyrax()

    for photo_type in cw.get_all_photo_types():
        create_photo_container(cw, pyrax_conn, photo_type)


    log.info("All done!")

