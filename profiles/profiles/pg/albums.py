# vim: set expandtab ts=4 sw=4 filetype=python fileencoding=utf8:

import copy
import logging
import textwrap

import psycopg2.extras

log = logging.getLogger(__name__)

class AlbumFactory(psycopg2.extras.CompositeCaster):

    def make(self, values):
        d = dict(zip(self.attnames, values))
        return Album(**d)

class Album(object):

    def __init__(self, album_uuid, title, album_date,
        created_by,
        removed, inserted, updated):

        self.album_uuid = album_uuid
        self.album_date = album_date
        self.title = title
        self.created_by = created_by
        self.removed = removed
        self.inserted = inserted
        self.updated = updated

        self.photos = None
        self.short_code = None

    @property
    def __jsondata__(self):

        d = copy.copy(self.__dict__)
        return d


    @classmethod
    def insert(cls, pgconn, title, album_date, created_by):


        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            insert into albums
            (title, album_date, created_by)
            values
            (%(title)s, %(album_date)s,
            %(created_by)s)

            returning (albums.*)::albums as inserted_album
            """), locals())

        return cursor.fetchone().inserted_album

    @classmethod
    def by_short_code(cls, pgconn, short_code):

        """

        If we've established a short code for this album
        in album_special_urls, then try to look it up
        by this short_code -- if we don't find anything,
        then return None
        """

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            select (albums.*)::albums as album

            from albums

            join album_special_urls asu

            on albums.album_uuid = asu.album_uuid

            where asu.short_code = %(short_code)s
            """), dict(short_code=short_code))

        if cursor.rowcount:
            album = cursor.fetchone().album
            album.short_code = short_code
            return album

        else:
            return None



    @classmethod
    def by_album_uuid(cls, pgconn, album_uuid):

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            select (albums.*)::albums as album

            from albums

            where album_uuid = %(album_uuid)s
            """), dict(album_uuid=album_uuid))

        return cursor.fetchone().album


    @classmethod
    def select_all(cls, pgconn, offset=None, limit=None,
        sort_direction='desc'):

        qry_tmpl = textwrap.dedent("""
            select (albums.*)::albums as x
            from albums

            {where_string}

            order by albums.inserted {sort_direction}
            offset %(offset)s
            limit %(limit)s
            """)

        where_clauses = []

        where_string = ""

        qry = qry_tmpl.format(
            where_string=where_string,
            sort_direction=sort_direction)

        cursor = pgconn.cursor()

        cursor.execute(
            qry,
            dict(
                offset=offset,
                limit=limit))

        for row in cursor:
            yield row.x


    @staticmethod
    def get_total_count(pgconn):

        cursor = pgconn.cursor()

        qry = textwrap.dedent("""
            select count(*)
            from albums

            """)

        cursor.execute(qry)
        return cursor.fetchone().count

    def get_photo_count(self, pgconn):

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""

            select count(*) from album_photos ap

            join photos p on p.photo_uuid = ap.photo_uuid

            where ap.album_uuid = %(album_uuid)s

            and p.upload_finished is not null
            and p.removed = False

        """), dict(album_uuid=self.album_uuid))

        return cursor.fetchone().count

    def look_up_my_photos(self, pgconn):

        """
        Grabs all photos connected with this album
        """

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""

            select (p.*)::photos as photo, (pe.*)::people as person
            from photos p
            join album_photos ap on
            ap.photo_uuid = p.photo_uuid

            left join people pe on pe.person_uuid =  p.uploaded_by

            where ap.album_uuid = %(album_uuid)s

            and p.upload_finished is not null
            and p.cdn_url is not null
            and p.removed = false

            order by p.inserted::date asc,
            p.uploaded_by_name

           """), dict(
                album_uuid=self.album_uuid))

        self.photos = []

        for row in cursor:
            p = row.photo
            if row.person:
                p.uploaded_by_display_name = row.person.display_name

            self.photos.append(p)

        return self

    def look_up_my_shortcode(self, pgconn):

        """
        If this album has a short-code, let's look it up
        """

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""

            select short_code
            from album_special_urls

            where album_uuid = %(album_uuid)s
            and now()::date <@ effective

           """), dict(
                album_uuid=self.album_uuid))

        if cursor.rowcount:
            self.short_code = cursor.fetchone().short_code

        else:
            log.debug("No short code for this album {0}".\
                format(self.album_uuid))


        return self


