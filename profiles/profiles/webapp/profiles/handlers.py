#/ vim: set expandtab ts=4 sw=4 filetype=python:

import csv
import datetime
import json
import logging
import os
import pprint
import re
import tempfile
import textwrap
import urllib
import urlparse
import uuid

import psycopg2.extras
from PIL import Image, ImageOps

from dateutil import parser

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
            [x.__jsondata_without_shape__ for x
                in pg.locations.Location.select_all(self.cw.get_pgconn())]

        return Response.json(dict(
            message="Found this location",
            reply_timestamp=datetime.datetime.now(),
            success=True,
            locations=locations))

class AllLocationsWithShapeData(Handler):

    route_strings = set(["GET /api/all-locations-with-shape-data"])
    route = Handler.check_route_strings

    def handle(self, req):

        locations = \
            [x for x
                in pg.locations.Location.select_all(self.cw.get_pgconn())]

        return Response.json(dict(
            message="Found this location",
            reply_timestamp=datetime.datetime.now(),
            success=True,
            locations=locations))

class LocationShapeJSON(Handler):
    """

    Look up a locations shape json

    """
    route_strings = set(["GET /api/location-shape-json"])
    route = Handler.check_route_strings

    def handle(self, req):

        location = pg.locations.Location.by_location_uuid(self.cw.get_pgconn(),
            req.wz_req.args['location_uuid'])


        return Response.json(dict(
            message="Found this location shape json",
            reply_timestamp=datetime.datetime.now(),
            success=True,
            location_shape_json=location.location_shape_json,
            location=location))


class IndicatorDetails(Handler):

    route_strings = set(["GET /api/indicator-details"])
    route = Handler.check_route_strings

    def handle(self, req):

        if "indicator_uuid" not in req.wz_req.args:

            return Response.json(dict(
                message="Missing parameter 'indicator_uuid'!",
                reply_timestamp=datetime.datetime.now(),
                success=False))

        else:

            try:

                indicator = pg.indicators.Indicator.by_indicator_uuid(self.cw.get_pgconn(),
                    req.wz_req.args['indicator_uuid'])

            except KeyError as ex:

                return Response.json(dict(
                    message="Could not find indicator {0}!".format(req.wz_req.args["indicator_uuid"]),
                    reply_timestamp=datetime.datetime.now(),
                    success=False))

            else:

                return Response.json(dict(
                    message="Found this indicator {0}".\
                        format(indicator),
                    reply_timestamp=datetime.datetime.now(),
                    success=True,
                    indicator=indicator))


class IndicatorValuesByIndicator(Handler):

    route_strings = set(["GET /api/indicator-values-by-indicator"])
    route = Handler.check_route_strings

    def handle(self, req):

        indicator = pg.indicators.Indicator.by_indicator_uuid(self.cw.get_pgconn(),
            req.wz_req.args['indicator_uuid'])

        order_by_area = req.wz_req.args.get('order_by_area', False)

        ivs = []

        for x in \
            indicator.all_indicator_location_values(self.cw.get_pgconn(),
            order_by_area=order_by_area):

            x['location'].area = x['location_area']
            ivs.append(x)

        distinct_observable_timestamps = [x for x in
            indicator.distinct_observation_timestamps(self.cw.get_pgconn())]

        return Response.json(dict(
            message="Found this indicator {0}".\
                format(indicator),
            reply_timestamp=datetime.datetime.now(),
            success=True,
            indicatorvalues=ivs,
            distinct_observable_timestamps=distinct_observable_timestamps))

class IndicatorValuesByRace(Handler):

    route_strings = set(["GET /api/indicator-values-by-race"])
    route = Handler.check_route_strings

    required_qs_params = [
        "location_uuid",
        "indicator_uuid",
        "year"
    ]

    def handle(self, req):

        for rqp in self.required_qs_params:

            if rqp not in req.wz_req.args:

                return Response.json(dict(
                    message="Missing parameter {0}!".format(rqp),
                    reply_timestamp=datetime.datetime.now(),
                    success=False))

        location = pg.locations.Location.by_location_uuid(self.cw.get_pgconn(),
            req.wz_req.args['location_uuid'])

        indicator = pg.indicators.Indicator.by_indicator_uuid(self.cw.get_pgconn(),
            req.wz_req.args['indicator_uuid'])

        dt = datetime.datetime(
            int(req.wz_req.args["year"]),
            1,
            1)

        racial_split = pg.indicators.IndicatorLocationValue.look_up_racial_split(
            self.cw.get_pgconn(),
            indicator.title,
            location.location_uuid,
            dt)

        return Response.json(dict(
            message="Looked up racial breakouts for {0} / {1} / {2}.".format(
                indicator.title,
                location.title,
                dt),
            reply_timestamp=datetime.datetime.now(),
            success=True,
            racial_split=list(racial_split),
            indicator=indicator,
            location=location,
            available_observation_timestamps=list(pg.indicators.IndicatorLocationValue.find_available_observation_timestamps(
                self.cw.get_pgconn(),
                req.wz_req.args["indicator_uuid"],
                req.wz_req.args["location_uuid"]))))



class IndicatorValuesByIndicatorCSV(Handler):

    route_strings = set(["GET /api/indicator-values-by-indicator-csv"])
    route = Handler.check_route_strings

    def handle(self, req):

        indicator = pg.indicators.Indicator.by_indicator_uuid(self.cw.get_pgconn(),
            req.wz_req.args['indicator_uuid'])

        ivs =  [x for x in \
            indicator.all_indicator_location_values(self.cw.get_pgconn())]

        distinct_observable_timestamps = [x for x in \
            indicator.distinct_observation_timestamps(self.cw.get_pgconn())]


        tf = tempfile.NamedTemporaryFile()
        tf.close()

        tf = open(tf.name, 'w')

        headers = [x['observation_timestamp'].year for x in distinct_observable_timestamps]
        headers.insert(0, 'location')

        writer = csv.DictWriter(tf, headers)
        writer.writeheader()

        for v in ivs:

            location_title = v['location'].title

            row_to_write = dict(location=location_title)

            for ilv in v['indicator_location_values']:

                year = parser.parse(ilv['observation_timestamp']).year

                row_to_write[year] = ilv['value']

            writer.writerow(row_to_write)

        tf.close()
        tf = open(tf.name, 'r')

        return Response.csv_file(
            filelike=tf,
            filename=indicator.pretty_label + '-all-locations.csv',
            FileWrap=req.environ['wsgi.file_wrapper'])




class IndicatorValuesByLocationOld(Handler):

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

        log.debug("About to build api_address...")

        api_address = "/api/indicator-categories-with-values-by-location?{0}".format(
            urllib.urlencode(dict({
                "location": req.wz_req.args["location_uuid"],
                "indicators[]": req.wz_req.args.getlist("indicators[]")})))

        log.debug("Built api_address: {0}".format(api_address))

        return Response.json(dict(
            api_address=api_address,
            message="Found these indicator categories and values for this location {0}".\
                format(location.title),
            reply_timestamp=datetime.datetime.now(),
            success=True,
            indicator_values=category_indicator_values,
            distinct_observable_timestamps=distinct_observable_timestamps))

class GenerateCSVForIndicatorsByLocation(Handler):

    route_strings = set(["GET /api/indicator-categories-with-values-by-location-csv"])
    route = Handler.check_route_strings

    def handle(self, req):

        location = pg.locations.Location.by_location_uuid(self.cw.get_pgconn(),
            req.wz_req.args['location_uuid'])

        page_title = req.wz_req.args['page_title']

        indicators = req.wz_req.args.getlist('indicators[]')

        category_indicator_values = [x for x in \
            location.indicators_with_values_by_location(self.cw.get_pgconn(),
                indicators)]

        distinct_observable_timestamps = [x for x in \
            location.distinct_observation_timestamp_for_indicators(self.cw.get_pgconn(),
                indicators)]

        tf = tempfile.NamedTemporaryFile()
        tf.close()

        tf = open(tf.name, 'w')

        headers = [x['observation_timestamp'].year for x in distinct_observable_timestamps]
        headers.insert(0, 'indicator')
        headers.insert(1, 'format')

        writer = csv.DictWriter(tf, headers)
        writer.writeheader()

        for v in category_indicator_values:

            indicator_pl = v['indicator'].pretty_label
            row_to_write = dict(indicator=indicator_pl)
            if v['indicator'].indicator_value_format:
                row_to_write['format'] = v['indicator'].indicator_value_format


            for ivs in v['indicator_values']:

                year = parser.parse(ivs['observation_timestamp']).year

                row_to_write['indicator'] = indicator_pl
                row_to_write[year] = ivs['value']

            writer.writerow(row_to_write)

        tf.close()
        tf = open(tf.name, 'r')

        return Response.csv_file(
            filelike=tf,
            filename=page_title + '-' + location.title + '.csv',
            FileWrap=req.environ['wsgi.file_wrapper'])


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

class FindContainingNeighborhoods(Handler):

    route_strings = set(["GET /api/find-containing-neighborhoods"])

    route = Handler.check_route_strings

    def handle(self, req):

        lat = float(req.wz_req.args["lat"])
        lng = float(req.wz_req.args["lng"])
        offset = int(req.wz_req.args.get("offset", 0))
        limit = int(req.wz_req.args.get("limit", 40))

        containing_neighborhoods = list(pg.locations.Location\
        .find_containing_neighborhoods(
            self.cw.get_pgconn(),
            lat,
            lng,
            offset,
            limit))

        return Response.json(dict(
            message="Found {0} neighborhoods".format(
                len(containing_neighborhoods)),
            reply_timestamp=datetime.datetime.now(),
            success=True,
            containing_neighborhoods=containing_neighborhoods))
