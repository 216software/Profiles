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
