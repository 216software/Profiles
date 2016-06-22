# vim: set expandtab ts=4 sw=4 filetype=python:

import copy
import logging
import textwrap

import psycopg2.extras

log = logging.getLogger(__name__)

class SessionFactory(psycopg2.extras.CompositeCaster):

    def make(self, values):
        d = dict(zip(self.attnames, values))
        return Session(**d)

class Session(object):

    def __init__(self, session_uuid, expires, person_uuid, news_message,
        redirect_to_url, inserted, updated):

        self.session_uuid = session_uuid
        self.expires = expires
        self.person_uuid = person_uuid
        self.news_message = news_message
        self.redirect_to_url = redirect_to_url
        self.inserted = inserted
        self.updated = updated

        self.user = None

    @classmethod
    def maybe_start_new_session_after_checking_email_and_password(cls,
        pgconn, email_address, password):

        """
        If the email address and password match a row in the people
        table, insert a new session and return it.
        """

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            insert into webapp_sessions
            (person_uuid)
            select person_uuid
            from people
            where email_address = %(email_address)s
            and salted_hashed_password = crypt(
                %(password)s,
                salted_hashed_password)
            and person_status = 'confirmed'
            returning (webapp_sessions.*)::webapp_sessions as gs
            """), {
                "email_address": email_address,
                "password": password})

        if cursor.rowcount:
            return cursor.fetchone().gs

    @classmethod
    def start_anonymous_session(cls, pgconn):

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            insert into webapp_sessions
            default values
            returning (webapp_sessions.*)::webapp_sessions as ws
            """))

        return cursor.fetchone().ws

    @classmethod
    def kill_all_sessions_by_person(cls, pgconn, person_uuid):
        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            update webapp_sessions
            set expires = current_timestamp
            where person_uuid = %(person_uuid)s
            """), {
                'person_uuid': person_uuid})

        return cursor.rowcount


    def expire(self, pgconn):

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            update webapp_sessions
            set expires = current_timestamp
            where session_uuid = %(session_uuid)s
            returning (webapp_sessions.*)::webapp_sessions as hs
            """), {
                'session_uuid': self.session_uuid})

        return cursor.fetchone().hs

    def add_person_uuid(self, pgconn, person_uuid):

        if self.person_uuid:
            raise ValueError(
                "Sorry, {0} already has a person UUID!".format(
                    self))

        else:

            cursor = pgconn.cursor()

            cursor.execute(textwrap.dedent("""
                update webapp_sessions
                set person_uuid = %(person_uuid)s
                where session_uuid = %(session_uuid)s
                and person_uuid is NULL
                returning (webapp_sessions.*)::webapp_sessions as updated_session
                """), {
                    "person_uuid": person_uuid,
                    "session_uuid": self.session_uuid
                })

            if cursor.rowcount:

                log.info("Updated session {0} with person_uuid {1}.".format(
                    self.session_uuid,
                    person_uuid))

                return cursor.fetchone().updated_session


            else:
                raise KeyError(
                    "Couldn't find session with NULL person_uuid "
                    "and session_uuid {0}!".format(
                    self.session_uuid))

    @property
    def __jsondata__(self):

        d = copy.copy(self.__dict__)

        return d


    def maybe_update_session_expires_time(self, pgconn):

        cursor = pgconn.cursor()

        cursor.execute(textwrap.dedent("""
            update webapp_sessions
            set expires = default
            where session_uuid = (%(session_uuid)s)
            and expires > current_timestamp
            returning expires
            """), {'session_uuid': self.session_uuid})

        if cursor.rowcount:
            return cursor.fetchone().expires
