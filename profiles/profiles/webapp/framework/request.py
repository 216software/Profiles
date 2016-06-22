# vim: set expandtab ts=4 sw=4 filetype=python fileencoding=utf8:

import logging

from horsemeat.webapp import request

log = logging.getLogger(__name__)

class Request(request.Request):

    @property
    def client_IP_address(self):

        if 'HTTP_X_FORWARDED_FOR' in self:
            return self['HTTP_X_FORWARDED_FOR'].strip()

        elif 'REMOTE_ADDR' in self:
            return self['REMOTE_ADDR'].strip()

    @property
    def is_JSON(self):

        if self.CONTENT_TYPE:
            return 'json' in self.CONTENT_TYPE.lower()

        else:
            return False
