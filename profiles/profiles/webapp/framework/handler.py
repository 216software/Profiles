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

    """
    You can add project-specific stuff here.
    """



