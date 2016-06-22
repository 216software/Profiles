# vim: set expandtab ts=4 sw=4 filetype=python:

import datetime
import logging
import textwrap

import decorator

from horsemeat.webapp import handler

from profiles.webapp.framework.response import Response

from profiles import pg

log = logging.getLogger(__name__)

module_template_prefix = 'framework'
module_template_package = 'profiles.webapp.framework.templates'

class Handler(handler.Handler):

    @property
    def four_zero_four_template(self):
        return 'framework_templates/404.html'

    def not_found(self, req):

        return super(Handler, self).not_found(req)

    @staticmethod
    @decorator.decorator
    def require_login(handler_method, self, req):

        """
        Add this to a handle method like this::

            @Handler.require_login
            def handle(self, req):
                ...

        And then, if the request isn't from a signed-in user,
        they'll get the JSON reply below.

        If the request is from a signed-in user, then your handle
        method is normal.
        """

        if not req.user:

            return Response.json(dict(
                reply_timestamp=datetime.datetime.now(),
                message="Sorry, you need to log in first!",
                needs_to_log_in=True,
                success=False))

        else:
            return handler_method(self, req)


    def look_up_wm(self, v, pk):

        if v == "v3":

            wm = pg.weeklymanifests.WeeklyManifestV3.by_pk(
                self.cw.get_pgconn(),
                pk)

            wm.look_up_current_status(self.cw.get_pgconn())

            return wm

        elif v == "v2":

            return pg.weeklymanifests.WeeklyManifestV2.by_pk(
                self.cw.get_pgconn(),
                pk)

    required_json_keys = []

    def check_all_required_keys_in_json(self, req):
        return all(k in req.json for k in self.required_json_keys)

    def find_missing_json_keys(self, req):
        return [k for k in self.required_json_keys if k not in req.json]


    @staticmethod
    @decorator.decorator
    def require_json(handler_method, self, req):

        """
        Add this to a handle method like this::

            required_json_keys = ['A', 'B']

            @Handler.require_json
            def handle(self, req):
                ...

        And then, if the request isn't a JSON request with keys A and B,
        they'll get the JSON reply below.

        """

        if not req.is_JSON \
        or not req.json:

            return Response.json(dict(
                reply_timestamp=datetime.datetime.now(),
                message="Sorry, invalid request!",
                success=False))

        elif not self.check_all_required_keys_in_json(req):

            missing_json_keys = self.find_missing_json_keys(req)

            log.warn("Request {0} didn't have these keys: {1}".format(
                req.line_one,
                missing_json_keys))

            return Response.json(dict(
                success=False,
                reply_timestamp=datetime.datetime.now(),
                message="Sorry, you are missing keys: [{0}]!".format(
                    ", ".join(self.find_missing_json_keys(req)))))

        else:
            return handler_method(self, req)

    required_user_groups = []

    def check_user_group_in_required_groups(self, req):
        return req.user.group_title in self.required_user_groups

    @staticmethod
    @decorator.decorator
    def require_group(handler_method, self, req):

        """
        Add this to a handle method like this::

            required_groups = ['administrator', 'supervisor']

            @Handler.require_group
            def handle(self, req):
                ...

        And then, if the request user isn't in the group 'administrator'
        or 'supervisor',
        they'll get the JSON reply below.

        """

        if not self.check_user_group_in_required_groups(req):

            return Response.json(dict(
                reply_timestamp=datetime.datetime.now(),
                message="Sorry, you are are not in the group: [{0}]!".format(
                    ",".join(self.required_user_groups))))

        else:
            return handler_method(self, req)


    def verify_container(self, container_id):

        try:

            c = pg.containers.Container.by_container_id(
                self.cw.get_pgconn(),
                container_id)

        except KeyError:

            return Response.json(dict(
                message="Sorry, {0} is not a container I "
                    "recognize!".format(container_id),
                reply_timestamp=datetime.datetime.now(),
                success=False))

        else:
            return c


