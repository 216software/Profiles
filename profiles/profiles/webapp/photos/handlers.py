# vim: set expandtab ts=4 sw=4 filetype=python:

import datetime
import json
import logging
import os
import pprint
import textwrap
import urllib
import urlparse
import uuid

import psycopg2.extras
from PIL import Image, ImageOps

from profiles.junkdrawer import photofun

from profiles.webapp.framework.handler import Handler
from profiles.webapp.framework.response import Response

from profiles import pg

log = logging.getLogger(__name__)

module_template_prefix = 'photos'
module_template_package = 'profiles.webapp.photos.templates'


class UploadURL(Handler):

    route_strings = set(["GET /api/upload-url"])
    route = Handler.check_route_strings

    def handle(self, req):

        if "photo_type" not in req.wz_req.args:
            return Response.json(dict(
                success=False,
                reply_timestamp=datetime.datetime.now(),
                message="Sorry, I need photo type"))
        else:

            uploads_container = self.cw.get_photo_container_name(
                req.wz_req.args["photo_type"])

            upload_files = []

            for x in range(
                0,
                int(req.wz_req.args.get('number_urls',1))):

                random_filename = str(uuid.uuid4())

                upload_url = photofun.PhotoFun.get_temp_url_no_pyrax(
                    self.cw,
                    self.cw.get_photo_container_name(req.wz_req.args["photo_type"]),
                    random_filename,
                    60*60*24, # uploads allowed for a day
                    method='PUT')

                """
                upload_url = pyrax.cloudfiles.get_temp_url(
                    uploads_container,
                    random_filename,
                    60*60*24, # uploads allowed for a day
                    method='PUT')

                """

                upload_files.append(dict(upload_url=upload_url,
                    upload_filename=random_filename))

            return Response.json({
                "success": True,
                "reply_timestamp": datetime.datetime.now(),
                "message": "Upload URL will work for the next 24 hours",
                "upload_url": upload_url,
                "filename": random_filename,
                "upload_files": upload_files,
                "cloudfile_container_name": uploads_container,
            })


class TrackUploadStart(Handler):

    route_strings = set(["POST /api/track-upload-start"])
    route = Handler.check_route_strings

    required_json_keys = [
        "container_name",
        "upload_filename",
        "original_filename",
        "mimetype",
    ]

    @Handler.require_json
    def handle(self, req):

        photo_uuid = self.insert(req)

        return Response.json({
            "success": True,
            "reply_timestamp": datetime.datetime.now(),
            "message": "Tracked upload start!",
            "photo_uuid": photo_uuid
        })

    def insert(self, req):

        cursor = self.cw.get_pgconn().cursor()

        # A user may or may not be logged in
        uploaded_by = req.user.person_uuid if req.user else None
        uploaded_by_name = req.json.get("uploaded_by_name")

        log.debug(req.json)

        cursor.execute(textwrap.dedent("""
            insert into photos
            (photo_uuid, container, original_filename,
            uploaded_by, uploaded_by_name, mimetype)
            values
            (%(photo_uuid)s, %(container)s,
            %(original_filename)s, %(uploaded_by)s,
            %(uploaded_by_name)s,
            %(mimetype)s)

            returning photo_uuid
            """), dict(
                photo_uuid=req.json["upload_filename"],
                container=req.json["container_name"],
                original_filename=req.json["original_filename"],
                uploaded_by=uploaded_by,
                uploaded_by_name=uploaded_by_name,
                mimetype=req.json["mimetype"]))

        return cursor.fetchone().photo_uuid


class TrackUploadFinish(Handler):


    """
    Updates the description and ties the photo to
    it's type (in profiles case, an album) as well
    as mark the upload as finished

    A backend script processes thumbnails

    """

    route_strings = set(["POST /api/track-upload-finish"])
    route = Handler.check_route_strings

    required_json_keys = [
        "upload_filename",
        "photo_type"
    ]

    @Handler.require_json
    def handle(self, req):

        # Let's make thumbnails first

        # TODO :move thumbnail creation out of here

        photo_type_uuid = req.json.get("photo_type_uuid"),
        photo_uuid = req.json["photo_uuid"]
        photo_type = req.json["photo_type"]

        photo_link_tables = dict(
            album='album_photos')

        cursor = self.cw.get_pgconn().cursor()

        if photo_type_uuid:

            qry_tmpl = textwrap.dedent("""
                insert into {photo_link_table}
                (photo_uuid, {photo_type}_uuid)
                values
                (%(photo_uuid)s, %(photo_type_uuid)s)
                """)

            qry = qry_tmpl.format(
                photo_link_table=photo_link_tables[photo_type],
                photo_type=photo_type)

            cursor.execute(qry, dict(
                photo_uuid=photo_uuid,
                photo_type_uuid=photo_type_uuid))


        photo = pg.photos.Photo.by_photo_uuid(self.cw.get_pgconn(),
             photo_uuid)

        if req.json["description"]:
            photo.update_photo_description(self.cw.get_pgconn(),
                req.json["description"])


        photo.set_cdn_url(self.cw,
                cdn_url = urlparse.urljoin(
                self.cw.get_container_cdn_ssl_uri(photo_type),
                urllib.quote(req.json["upload_filename"])))

        photo.mark_upload_as_finished(self.cw)

        return Response.json({
            "success": True,
            "reply_timestamp": datetime.datetime.now(),
            "message": "Upload finished!",
            "photo": photo,
        })


class TrackUploadFinish(Handler):


    """
    Updates the description and ties the photo to
    it's type (in profiles case, an album) as well
    as mark the upload as finished

    A backend script processes thumbnails

    """

    route_strings = set(["POST /api/track-upload-finish"])
    route = Handler.check_route_strings

    required_json_keys = [
        "upload_filename",
        "photo_type"
    ]

    @Handler.require_json
    def handle(self, req):

        # Let's make thumbnails first

        # TODO :move thumbnail creation out of here

        photo_type_uuid = req.json.get("photo_type_uuid"),
        photo_uuid = req.json["photo_uuid"]
        photo_type = req.json["photo_type"]

        photo_link_tables = dict(
            album='album_photos')

        cursor = self.cw.get_pgconn().cursor()

        if photo_type_uuid:

            qry_tmpl = textwrap.dedent("""
                insert into {photo_link_table}
                (photo_uuid, {photo_type}_uuid)
                values
                (%(photo_uuid)s, %(photo_type_uuid)s)
                """)

            qry = qry_tmpl.format(
                photo_link_table=photo_link_tables[photo_type],
                photo_type=photo_type)

            cursor.execute(qry, dict(
                photo_uuid=photo_uuid,
                photo_type_uuid=photo_type_uuid))


        photo = pg.photos.Photo.by_photo_uuid(self.cw.get_pgconn(),
             photo_uuid)

        if req.json["description"]:
            photo.update_photo_description(self.cw.get_pgconn(),
                req.json["description"])


        photo.set_cdn_url(self.cw,
                cdn_url = urlparse.urljoin(
                self.cw.get_container_cdn_ssl_uri(photo_type),
                urllib.quote(req.json["upload_filename"])))

        photo.mark_upload_as_finished(self.cw)

        return Response.json({
            "success": True,
            "reply_timestamp": datetime.datetime.now(),
            "message": "Upload finished!",
            "photo": photo,
        })

    def make_thumbnail(self, photo_uuid, uploads_container,
        size=[256,256]):

       original_file = uploads_container.get_object(photo_uuid)

       file_download = original_file.download('/tmp')

       original_img = Image.open('/tmp/' + photo_uuid)

       original_size = original_img.size

       thumbnail = ImageOps.fit(original_img, size, Image.ANTIALIAS)
       thumbnail_size = thumbnail.size

       thumbnail_uuid = str(uuid.uuid4())
       filename = '/tmp/' + thumbnail_uuid + '.jpg'

       thumbnail.save(filename)
       #now upload
       uploads_container.upload_file(filename,
           thumbnail_uuid,
           content_type="image/jpeg")

       return thumbnail_uuid, original_size, thumbnail_size


    def mark_photo_as_finished(self,
        cloudfile_container_name,
        upload_filename,
        photo_uuid,
        photo_type_uuid,
        photo_type,
        thumbnail_uuid,
        original_size,
        thumbnail_size):

        photo_link_tables = dict(
            album='album_photos')

        pyrax = self.cw.get_pyrax()

        uploads_container = pyrax.cloudfiles.get_container(
            cloudfile_container_name)

        cdn_ssl_uri = uploads_container.cdn_ssl_uri

        cdn_url = urlparse.urljoin(
            cdn_ssl_uri,
            urllib.quote(upload_filename))

        thumbnail_cdn_url = urlparse.urljoin(
            uploads_container.cdn_ssl_uri,
            urllib.quote(thumbnail_uuid))

        cursor = self.cw.get_pgconn().cursor()

        cursor.execute(textwrap.dedent("""
            update photos
            set thumbs_finished = current_timestamp,
            cdn_url = %(cdn_url)s,

            thumbnail_uuid = %(thumbnail_uuid)s,

            thumbnail_cdn_url = %(thumbnail_cdn_url)s,

            height = %(height)s,
            width = %(width)s,

            thumbnail_height = %(thumbnail_height)s,
            thumbnail_width = %(thumbnail_width)s

            where photo_uuid = %(photo_uuid)s
            returning (photos.*)::photos as photo

            """), dict(cdn_url=cdn_url, photo_uuid=upload_filename,
                thumbnail_uuid=thumbnail_uuid,
                thumbnail_cdn_url = thumbnail_cdn_url,
                width= original_size[0],
                height = original_size[1],
                thumbnail_width= thumbnail_size[0],
                thumbnail_height = thumbnail_size[1]))

        photo = cursor.fetchone().photo

        # Then insert into correct link table, IF we got a photo type
        # UUID.  Which we don't get when this is an asset group.

        if photo_type_uuid:

            qry_tmpl = textwrap.dedent("""
                insert into {photo_link_table}
                (photo_uuid, {photo_type}_uuid)
                values
                (%(photo_uuid)s, %(photo_type_uuid)s)
                """)

            qry = qry_tmpl.format(
                photo_link_table=photo_link_tables[photo_type],
                photo_type=photo_type)

            cursor.execute(qry, dict(
                photo_uuid=photo_uuid,
                photo_type_uuid=photo_type_uuid))

        return photo


class RemovePhoto(Handler):

    route_strings = set(["POST /api/remove-photo"])
    route = Handler.check_route_strings

    required_json_keys = [
        "photo_uuid",
    ]

    @Handler.require_login
    @Handler.require_json
    def handle(self, req):

        photo_uuid = self.mark_photo_as_removed(
            req.json["photo_uuid"])

        return Response.json({
            "success": True,
            "reply_timestamp": datetime.datetime.now(),
            "message": "Photo removed!",
            "photo_uuid": photo_uuid,
        })

    def mark_photo_as_removed(self, photo_uuid):

        cursor = self.cw.get_pgconn().cursor()

        cursor.execute(textwrap.dedent("""
            update photos
            set removed = true
            where photo_uuid = %(photo_uuid)s

            returning photo_uuid
            """), dict(photo_uuid=photo_uuid))

        return cursor.fetchone().photo_uuid

class UpdatePhotoDescription(Handler):

    route_strings = set(["POST /api/update-photo-description"])
    route = Handler.check_route_strings

    required_json_keys = [
        "photo_uuid",
        "description",
    ]

    @Handler.require_json
    def handle(self, req):

        photo = pg.photos.Photo.by_photo_uuid(
            self.cw.get_pgconn(),
            req.json["photo_uuid"])

        photo.update_photo_description(req.json["description"])

        return Response.json({
            "success": True,
            "reply_timestamp": datetime.datetime.now(),
            "message": "Description updated",
            "photo_uuid": photo_uuid,
        })


