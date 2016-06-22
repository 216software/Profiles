#vim: set expandtab ts=4 sw=4 filetype=python:

import logging
import re

from profiles.webapp.framework.handler import Handler
from profiles.webapp.framework.response import Response

from profiles import pg

log = logging.getLogger(__name__)

module_template_prefix = 'shortcode'

__all__ = ['AlbumShortCode']


class AlbumShortCode(Handler):

    """

    If a route string comes in with text
    we want to check to see if it's a
    short code that looks up an album.

    If it's not, we probably want to return control
    back to Handler, to look for other stuff,
    since this handler will catch everything...

    We really want this to be the final handler that gets called...

    """


    route_patterns = set([re.compile(r'GET /(?P<shortcode>\D+)$')])
    route = Handler.check_route_patterns

    def handle(self, req):


        log.debug("picked up in album short code handler")

        log.debug("req is {0}".format(req.get('shortcode')))

        if 'shortcode' in req:

            found_album = pg.albums.Album.by_short_code(self.cw.get_pgconn(),
                req.get('shortcode'))

            if found_album:
                log.debug("Found an album with the shortcode {0} : {1}".\
                    format(req.get('shortcode'), found_album))

                return Response.redirect('{0}/#albums/album?album_uuid={1}'.\
                    format(self.cw.web_host, found_album.album_uuid))

            else:
                log.debug("No album found with short code {0}".\
                    format(req.get('shortcode')))



        # if no short code found, return not found -- since this handler
        # is last, it's fine to do it

        return self.not_found(req)

