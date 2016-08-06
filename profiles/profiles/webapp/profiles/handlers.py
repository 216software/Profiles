# vim: set expandtab ts=4 sw=4 filetype=python:

import datetime
import json
import logging
import os
import pprint
import re
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

module_template_prefix = 'profiles'
module_template_package = 'profiles.webapp.profiles.templates'



class TemplateServer(Handler):

    route_strings = dict({
        "GET /":                    "profiles/profiles.html",
        "GET /login":               "profiles/login.html",
        "GET /reset-password":      "profiles/reset-password.html",
    })

    route = Handler.check_route_strings

    def handle(self, req):

        template_name = self.route_strings[req.line_one]
        return Response.tmpl(template_name)


class AlbumsSelect(Handler):

    """

    Quicker get since we don't need sorts
    or details etc

    """

    route_strings = set(["GET /api/albums"])
    route = Handler.check_route_strings

    def handle(self, req):

        offset = req.wz_req.args.get("offset", 0)
        limit = req.wz_req.args.get("limit", 30)

        sort_direction = req.wz_req.args.get("sort_direction", 'desc')

        pgconn = self.cw.get_pgconn()

        albums = [a for a in pg.albums.\
                    Album.select_all(
                    self.cw.get_pgconn(),
                    offset,
                    limit,
                    sort_direction=sort_direction)]

        total_count = pg.albums.Album.get_total_count(self.cw.get_pgconn())

        return Response.json(dict(
            message="Retrieved {0} albums".format(len(albums)),
            reply_timestamp=datetime.datetime.now(),
            success=True,
            offset=offset,
            limit=limit,
            total_count=total_count,
            albums=albums))


class AlbumCategories(Handler):

    route_strings = set(["GET /api/container-categories"])
    route = Handler.check_route_strings

    def handle(self, req):

        return Response.json(dict(
            message="These are all album categories",
            reply_timestamp=datetime.datetime.now(),
            success=True,
            container_categories=self.get_container_category_titles()))

    def get_container_category_titles(self):

        qry = textwrap.dedent("""
            select title
            from container_categories
            order by display_order, title
            """)

        cursor = self.cw.get_pgconn().cursor()

        cursor.execute(qry)

        return [row.title for row in cursor]

class InsertAlbum(Handler):

    route_strings = set(["POST /api/insert-new-album"])
    route = Handler.check_route_strings

    required_json_keys = [
        "title",
        "album_date",
    ]

    @Handler.require_json
    @Handler.require_login
    def handle(self, req):

        new_album = pg.albums.Album.insert(
            self.cw.get_pgconn(),
            req.json["title"],
            req.json["album_date"],
            req.user.person_uuid
        )

        return Response.json(dict(
            message="We added a new album",
            reply_timestamp=datetime.datetime.now(),
            success=True,
            new_album=new_album))


class Location(Handler):

    route_strings = set(["GET /api/location"])
    route = Handler.check_route_strings

    def handle(self, req):

        # TODO this is hardcoded -- fix it to take in an argument

        l = pg.locations.Location.by_location_uuid(
            self.cw.get_pgconn(),
            "45326d0d-d9ba-4da8-95b3-1d585cc630a3")

        return Response.json(dict(
            message="Found this location",
            reply_timestamp=datetime.datetime.now(),
            success=True,
            location=l))


class AllLocations(Handler):

    route_strings = set(["GET /api/all-locations"])
    route = Handler.check_route_strings

    def handle(self, req):

        locations = \
            [x for x in pg.locations.Location.select_all(self.cw.get_pgconn())]

        return Response.json(dict(
            message="Found this location",
            reply_timestamp=datetime.datetime.now(),
            success=True,
            locations=locations))

class IndicatorValuesByLocation(Handler):

    route_strings = set(["GET /api/indicators-by-location"])
    route = Handler.check_route_strings

    def handle(self, req):

        location = pg.locations.Location.by_location_uuid(self.cw.get_pgconn(),
            req.wz_req.args['location_uuid'])

        indicator_values = [x for x in \
            location.look_up_indicators(self.cw.get_pgconn())]

        return Response.json(dict(
            message="Found these indicator values for this location {0}".\
                format(location.title),
            reply_timestamp=datetime.datetime.now(),
            success=True,
            indicator_values=indicator_values))

class IndicatorValuesByLocation(Handler):

    route_strings = set(["GET /api/indicator-categories-with-values-by-location"])
    route = Handler.check_route_strings

    def handle(self, req):

        location = pg.locations.Location.by_location_uuid(self.cw.get_pgconn(),
            req.wz_req.args['location_uuid'])

        indicators = req.wz_req.args.getlist('indicators[]')

        category_indicator_values = [x for x in \
            location.indicators_with_values_by_location(self.cw.get_pgconn(),
                indicators)]

        distinct_observable_timestamps = [x for x in \
            location.distinct_observation_timestamp_for_indicators(self.cw.get_pgconn(),
                indicators)]

        return Response.json(dict(
            message="Found these indicator categories and values for this location {0}".\
                format(location.title),
            reply_timestamp=datetime.datetime.now(),
            success=True,
            indicator_values=category_indicator_values,
            distinct_observable_timestamps=distinct_observable_timestamps))


class LocationTypes(Handler):

    route_strings = set(["GET /api/location-types"])
    route = Handler.check_route_strings

    def handle(self, req):

        location_types = \
            pg.locations.all_location_types(self.cw.get_pgconn())

        return Response.json(dict(
            message="Found this location",
            reply_timestamp=datetime.datetime.now(),
            success=True,
            location_types=location_types))
