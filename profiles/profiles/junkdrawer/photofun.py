# vim: set expandtab ts=4 sw=4 filetype=python fileencoding=utf8:

import hmac
import hashlib
import logging
import re
import textwrap
import time
import six
import urllib

from profiles import pg

log = logging.getLogger(__name__)

class PhotoFun(object):

    @staticmethod
    def get_temp_url_no_pyrax(cw, container_name, object_name,
        seconds, method="GET"):

        """
        Given a storage object in a container, returns a URL that can be used
        to access that object. The URL will expire after `seconds` seconds.

        The only methods supported are GET and PUT. Anything else will raise
        an `InvalidTemporaryURLMethod` exception.

        If you have your Temporary URL key, you can pass it in directly and
        potentially save an API call to retrieve it. If you don't pass in the
        key, and don't wish to use any cached value, pass `cached=False`.
        """

        key = cw.pyrax_tmp_url_key
        if not key:
            raise exc.MissingTemporaryURLKey("You must set the key for "
                    "Temporary URLs before you can generate them. This is "
                    "done via the `set_temp_url_key()` method.")
        mod_method = method.upper().strip()
        if mod_method not in ("GET", "PUT"):
            raise exc.InvalidTemporaryURLMethod("Method must be either 'GET' "
                    "or 'PUT'; received '%s'." % method)
        mtch = re.search(r"/v\d/", cw.pyrax_mgmt_url)
        start = mtch.start()
        base_url = cw.pyrax_mgmt_url[:start]
        path_parts = (cw.pyrax_mgmt_url[start:], container_name, object_name)
        cleaned = (part.strip("/\\") for part in path_parts)
        pth = "/%s" % "/".join(cleaned)
        if isinstance(pth, six.string_types):
            pth = pth.encode('utf-8')
        expires = int(time.time() + int(seconds))
        hmac_body = "%s\n%s\n%s" % (mod_method, expires, pth)
        try:
            sig = hmac.new(key, hmac_body, hashlib.sha1).hexdigest()
        except TypeError as e:
            raise exc.UnicodePathError("Due to a bug in Python, the TempURL "
                    "function only works with ASCII object paths.")
        temp_url = "%s%s?temp_url_sig=%s&temp_url_expires=%s" % (base_url, pth,
                sig, expires)
        return temp_url

