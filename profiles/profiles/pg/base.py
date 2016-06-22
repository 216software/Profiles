# vim: set expandtab ts=4 sw=4 filetype=python fileencoding=utf8:

import abc

import psycopg2.extras

class BaseFactory(psycopg2.extras.CompositeCaster):

    lookup_class = None

    def make(self, values):
        d = dict(zip(self.attnames, values))
        return self.lookup_class(**d)

class Table(object):

    __metaclass__ = abc.ABCMeta

    @property
    def __jsondata__(self):

        return self.__dict__

    def __repr__(self):
        return "<{0} object with pk={1}>".format(
            self.__class__.__name__, self.pk)


    @abc.abstractproperty
    def pk(self):
        raise NotImplementedError
