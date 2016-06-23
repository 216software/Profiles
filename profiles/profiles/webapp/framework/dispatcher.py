# vim: set expandtab ts=4 sw=4 filetype=python fileencoding=utf-8:
# -*- coding: utf-8 -*-

import logging

from horsemeat.webapp import dispatcher

from profiles.webapp.framework import request

log = logging.getLogger(__name__)

class Dispatcher(dispatcher.Dispatcher):

    request_class = request.Request

    # TODO: Move this list into configwrapper or maybe even the yaml
    # file.
    def make_handlers(self):

        log.info('Making profiles handlers...')

        self.handlers.extend(self.make_handlers_from_module_string(
            'profiles.webapp.dashboard.handlers'))

        self.handlers.extend(self.make_handlers_from_module_string(
            'profiles.webapp.profiles.handlers'))

        self.handlers.extend(self.make_handlers_from_module_string(
            'profiles.webapp.ajaxauth.handlers'))

        self.handlers.extend(self.make_handlers_from_module_string(
            'profiles.webapp.notfound.handlers'))

    @property
    def error_page(self):

        log.debug("Getting error template...")

        j = self.cw.get_jinja2_environment()

        t = j.get_template('profiles/error.html')

        return t

