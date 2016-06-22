# vim: set expandtab ts=4 sw=4 filetype=python fileencoding=utf8:
# -*- coding: utf-8 -*-

import argparse
import collections
import logging

from profiles import configwrapper

log = logging.getLogger("profiles.scripts.ms2txt")

def set_up_args():

    ap = argparse.ArgumentParser(
        description="Replace unicode characters with similar ascii characters")

    ap.add_argument("yaml_file_name")

    ap.add_argument("infile")
    ap.add_argument("outfile")

    return ap.parse_args()

d = dict({
    ord(u"\u2026"): u"...",
    ord(u"\xb7"): u"*",
    ord(u"\u2013"): u"-",
    ord(u"\u2019"): u"'",
    ord(u"\xa7"): u"*",
    ord(u"\u2018"): u"'",
    ord(u"\u201d"): u'"',
    ord(u"\u201c"): u'"',
    ord(u"\xe9"): u"e",
})

if __name__ == "__main__":

    args = set_up_args()

    cw = configwrapper.ConfigWrapper.load_yaml(args.yaml_file_name)

    cw.configure_logging("script")

    cc = collections.Counter()

    with open(args.infile) as infile, open(args.outfile, "w") as outfile:

        for line in infile:

            ul = line.decode("utf8").translate(d)

            non_ascii_chars = [c for c in ul if ord(c) > 128]

            cc += collections.Counter(non_ascii_chars)

            outfile.write(ul.encode("utf8"))

    if cc:
        log.error("Found some non-ascii characters that I couldn't handle:")

        for k, v in cc.most_common():

            log.error(
                u"{0:8} {1} ({2}) {3}".format(k, v, repr(k), ord(k)))

        log.error(
            "Go update the dictionary d in the ms2ascii file with "
            "how you want to handle these.")

    log.info("All done!  Cleaned file is at {0}.".format(args.outfile))
