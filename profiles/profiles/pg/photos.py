# vim: set expandtab ts=4 sw=4 filetype=python fileencoding=utf8:

import copy
import logging
import os
import subprocess
import textwrap
import urllib
import urlparse
import uuid


from PIL import Image, ImageOps, ExifTags

from profiles.junkdrawer import photofun



import psycopg2.extras

log = logging.getLogger(__name__)

class PhotoFactory(psycopg2.extras.CompositeCaster):

    def make(self, values):
        d = dict(zip(self.attnames, values))
        return Photo(**d)

class Photo(object):

    def __init__(self, photo_uuid, container, cdn_url, description,
        original_filename, mimetype, width, height,
        thumbnail_cdn_url, thumbnail_uuid, thumbnail_width, thumbnail_height,
        web_optimized_cdn_url, web_optimized_uuid, web_optimized_width, web_optimized_height,
        uploaded_by, uploaded_by_name,
        upload_finished, thumbs_finished,
        removed, inserted, updated):

        self.photo_uuid = photo_uuid
        self.container = container
        self.cdn_url = cdn_url
        self.description = description
        self.original_filename = original_filename
        self.mimetype = mimetype
        self.width = width
        self.height = height
        self.thumbnail_cdn_url = thumbnail_cdn_url
        self.thumbnail_uuid = thumbnail_uuid
        self.thumbnail_width = thumbnail_width
        self.thumbnail_height = thumbnail_height
        self.web_optimized_cdn_url = web_optimized_cdn_url
        self.web_optimized_uuid = web_optimized_uuid
        self.web_optimized_width = web_optimized_width
        self.web_optimized_height = web_optimized_height

        # This is a person in our db
        self.uploaded_by = uploaded_by

        # This can be set if we look up uploaded_by person
        self.uploaded_by_display_name = None

        # atm, this is just text -- might be good to have two kinds of
        # people?
        self.uploaded_by_name = uploaded_by_name

        self.upload_finished = upload_finished
        self.thumbs_finished = thumbs_finished
        self.removed = removed
        self.inserted = inserted
        self.updated = updated

        self.local_copy = None

    @property
    def __jsondata__(self):
        return self.__dict__


    @classmethod
    def insert(cls, pgconn, photo_uuid, container, original_filename,
        uploaded_by, mimetype):

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            insert into photos
            (photo_uuid, container, original_filename,
            uploaded_by, mimetype)
            values
            (%(photo_uuid)s, %(container)s,
            %(original_filename)s, %(uploaded_by)s, %(mimetype)s)

            returning (photos.*)::photos as inserted_photo
            """), locals())

        return cursor.fetchone().inserted_photo

    @classmethod
    def by_photo_uuid(cls, pgconn, photo_uuid):

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            select (photos.*)::photos as photo

            from photos

            where photo_uuid = %(photo_uuid)s
            """), dict(photo_uuid=photo_uuid))

        return cursor.fetchone().photo

    def retrieve_locally(self, cw, re_try_download=False):

        if not self.cdn_url:
            self.cdn_url = self.set_cdn_url(cw)

        if self.local_copy and not re_try_download:
            raise ValueError("We already have a local copy!")

        else:

            # First check to see if it's already in /tmp

            if not os.path.exists("/tmp/{0}.jpg".format(self.photo_uuid)) \
                or re_try_download:

                urllib.urlretrieve(
                    self.cdn_url,
                    "/tmp/{0}.jpg".format(self.photo_uuid))

            self.local_copy = "/tmp/{0}.jpg".format(self.photo_uuid)

            log.info("Just stored a local copy of photo {0} here: {1}".format(
                self.photo_uuid,
                self.local_copy))

            return self

    def update_photo_description(self, pgconn, description):

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            update photos
            set description = %(description)s
            where photo_uuid = %(photo_uuid)s

            returning photo_uuid
            """), dict(photo_uuid=self.photo_uuid,
                    description=description))

        return cursor.fetchone().photo_uuid

    def set_cdn_url(self, cw, cdn_url=None):

        if cdn_url is None:
            cdn_ssl_uri = cw.get_container_cdn_ssl_uri('album')

            cdn_url = urlparse.urljoin(
                cdn_ssl_uri,
                urllib.quote(str(self.photo_uuid)))


        cursor = cw.get_pgconn().cursor()

        cursor.execute(textwrap.dedent("""
            update photos
            set cdn_url = %(cdn_url)s
            where photo_uuid = %(photo_uuid)s

            """), dict(photo_uuid=self.photo_uuid,
                    cdn_url=cdn_url))

        self.cdn_url = cdn_url

        return self.cdn_url

    def mark_upload_as_finished(self, cw):

        if self.upload_finished:
            raise ValueError(
                "Sorry, this photo was already finished at {0} ".format(
                    self.upload_finished))

        cursor = cw.get_pgconn().cursor()

        cursor.execute(textwrap.dedent("""

            update photos

            set upload_finished = current_timestamp

            where photo_uuid = %(photo_uuid)s

            returning upload_finished


        """), {"photo_uuid": self.photo_uuid})

        if cursor.rowcount:
            self.upload_finished = cursor.fetchone().upload_finished



    """
    Once the thumbnails are created for a specific photo,
    then it should be marked as finished

    TODO: WE need a way to distinguish between upload finished
    and thumbnails completed...
    """
    def mark_photo_as_finished(self, cw,
        thumbnail_uuid,
        original_size,
        thumbnail_size,
        web_optimized_uuid=None,
        web_optimized_size=None):

        cdn_ssl_uri = cw.get_container_cdn_ssl_uri('album')

        thumbnail_cdn_url = urlparse.urljoin(
            cdn_ssl_uri,
            urllib.quote(thumbnail_uuid))

        cursor = cw.get_pgconn().cursor()

        cursor.execute(textwrap.dedent("""
            update photos
            set thumbs_finished = current_timestamp,

            thumbnail_uuid = %(thumbnail_uuid)s,
            thumbnail_cdn_url = %(thumbnail_cdn_url)s,

            height = %(height)s,
            width = %(width)s,

            thumbnail_height = %(thumbnail_height)s,
            thumbnail_width = %(thumbnail_width)s

            where photo_uuid = %(photo_uuid)s
            returning (photos.*)::photos as photo

            """), dict(photo_uuid=self.photo_uuid,
                thumbnail_uuid=thumbnail_uuid,
                thumbnail_cdn_url = thumbnail_cdn_url,
                width= original_size[0],
                height = original_size[1],
                thumbnail_width= thumbnail_size[0],
                thumbnail_height = thumbnail_size[1]))

        photo = cursor.fetchone().photo

        if web_optimized_uuid and web_optimized_size:

            web_optimized_cdn_url = urlparse.urljoin(
                cdn_ssl_uri,
                urllib.quote(web_optimized_uuid))

            cursor.execute(textwrap.dedent("""
                update photos

                set web_optimized_uuid = %(web_optimized_uuid)s,

                web_optimized_cdn_url = %(web_optimized_cdn_url)s,

                web_optimized_height = %(web_optimized_height)s,
                web_optimized_width = %(web_optimized_width)s

                where photo_uuid = %(photo_uuid)s
                returning (photos.*)::photos as photo

                """), dict(photo_uuid=self.photo_uuid,
                web_optimized_uuid=web_optimized_uuid,
                web_optimized_cdn_url = web_optimized_cdn_url,
                web_optimized_width= web_optimized_size[0],
                web_optimized_height = web_optimized_size[1]))

            photo = cursor.fetchone().photo

        return photo

    def make_thumbnail(self, uploads_container,
                       size=[256,256]):

       original_file = uploads_container.get_object(str(self.photo_uuid))

       file_download = original_file.download('/tmp')

       original_img = Image.open('/tmp/' + str(self.photo_uuid))

       original_size = original_img.size

       # Try subprocess

       thumbnail_uuid = str(uuid.uuid4())
       filename = '/tmp/' + thumbnail_uuid + '.jpg'
       subprocess.check_call(["convert", str(self.photo_uuid), "-resize",
       str(size[0]) + "x" + str(size[1]), filename ], cwd='/tmp')

       thumbnail = Image.open(filename)
       #thumbnail = ImageOps.fit(original_img, size, Image.ANTIALIAS)
       thumbnail_size = thumbnail.size


       #thumbnail.save(filename)
       #now upload
       uploads_container.upload_file(filename,
           thumbnail_uuid,
           content_type="image/jpeg")

       return thumbnail_uuid, original_size, thumbnail_size

    def rotate_original_if_exif(self, cw):

        if not self.local_copy:
            self.retrieve_locally(cw)

        image = Image.open(self.local_copy)

        if not hasattr(image, '_getexif'):
            log.debug("no exif attribute so we're not rotating")
            return image

        if not image._getexif():
            log.debug("no exif dictionary so we're not rotating")
            return image

        exif_tags = {
            ExifTags.TAGS[k]: v
            for k, v in image._getexif().items()
            if k in ExifTags.TAGS
        }

        if 'Orientation' in exif_tags:

            orientation_number = exif_tags['Orientation']

            if orientation_number == 3:
                image=image.rotate(180, expand=True)
            elif orientation_number == 6:
                image=image.rotate(270, expand=True)
            elif orientation_number == 8:
                image=image.rotate(90, expand=True)

            else:
                log.debug("Image not rotated, but orientation is {0}".\
                    format(orientation_number))

            image.save(self.local_copy)

        image.close()

        return image



    def make_thumbnail_and_upload(self, cw, uploads_container,
        size=[256,256]):

        if not self.local_copy:
            self.retrieve_locally(cw)


        self.rotate_original_if_exif(cw)

        original_img = Image.open(self.local_copy)

        original_size = original_img.size

        thumbnail_uuid = str(uuid.uuid4())
        filename = '/tmp/' + thumbnail_uuid + '.jpg'
        #subprocess.check_call(["convert", str(self.photo_uuid), "-resize",
        #str(size[0]) + "x" + str(size[1]), filename ], cwd='/tmp')

        #thumbnail = Image.open(filename)
        thumbnail = ImageOps.fit(original_img, size, Image.ANTIALIAS)
        thumbnail_size = thumbnail.size
        thumbnail.save(filename)

        #now upload
        uploads_container.upload_file(filename,
           thumbnail_uuid,
           content_type="image/jpeg")

        return thumbnail_uuid, original_size, thumbnail_size


