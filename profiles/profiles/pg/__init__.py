# vim: set expandtab ts=4 sw=4 filetype=python fileencoding=utf8:

import logging
import functools
import json

from horsemeat import HorsemeatJSONEncoder

log = logging.getLogger(__name__)

class RelationWrapper(object):

    @property
    def __jsondata__(self):
        return self.__dict__

    @staticmethod
    def none_or_s(s):

        if s in set(["$-", "#N/A", "NULL"]):
            return

        elif isinstance(s, basestring):
            s2 = s.strip().replace("$", "").replace("%", "").replace(",", "").replace("-", "")

            if s2:
                return s2

        elif isinstance(s, (float, int)):
            return s




class KeepixJSONEncoder(HorsemeatJSONEncoder):

    """
    Each project can modify this just for fun if they want.
    """

# TODO: add a docstring on this guy.
fancyjsondumps = functools.partial(
    json.dumps,
    cls=KeepixJSONEncoder,
    sort_keys=True,
    indent=4,
    separators=(',', ': '))

# These imports are down here on purpose, after the definition of
# RelationWrapper.
from profiles.pg import indicators
from profiles.pg import locations

