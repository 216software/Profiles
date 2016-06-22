# vim: set expandtab ts=4 sw=4 filetype=python fileencoding=utf8:

import datetime
import logging
import textwrap

import itsdangerous

from profiles.webapp.framework.handler import Handler
from profiles.webapp.framework.response import Response

from profiles import pg

log = logging.getLogger(__name__)

__all__ = [
    "Session",
    "SignInWithEmailAndPassword",
    "StartSession",
    "EndSession",
    "SendResetPasswordEmail",
    "ResetPassword",
    "GetAllUsers",
    "ChangeStatus",
    "AllGroups"
    "ChangePassword",
    "AllGroups",
    "InsertNewuser"
]


class Session(Handler):

    route_strings = set(['GET /api/session'])

    route = Handler.check_route_strings

    def handle(self, req):

        if req.session:
            message = "Found session"

            if req.user:
                req.session.user = req.user

            else:
                req.session.user = None

        else:
            message = "No session found"

        return Response.json({
            "message": message,
            "success": True,
            "reply_timestamp": datetime.datetime.now(),
            "session": req.session})


class SignInWithEmailAndPassword(Handler):

    route_strings = set([
        "POST /api/login",
    ])

    route = Handler.check_route_strings

    def handle(self, req):

        if not req.is_JSON \
        or 'email_address' not in req.json \
        or 'password' not in req.json:

            return Response.json({
                "success": False,
                "message": "invalid request"
            })

        else:

            sesh = pg.sessions.Session\
            .maybe_start_new_session_after_checking_email_and_password(
                self.cw.get_pgconn(),
                req.json['email_address'],
                req.json['password'])

            if sesh:

                user = pg.people.Person.by_person_uuid(
                    self.cw.get_pgconn(),
                    sesh.person_uuid)

                sesh.user = user

                resp = Response.json({
                    "reply_timestamp": datetime.datetime.now(),
                    "session": sesh,
                    "success": True,
                    "message": "welcome back, {0}".format(
                        user.display_name or user.email_address),
                })

                resp.set_session_cookie(
                    sesh.session_uuid,
                    self.cw.app_secret,
                    expires_date=\
                    datetime.datetime.now() + datetime.timedelta(days=30))

                return resp

            else:

                return Response.json({
                    "success": False,
                    "message": "Sorry, those credentials didn't match",
                    "reply_timestamp": datetime.datetime.now(),

                })


class StartSession(Handler):

    """
    POST to this and it will insert a row in the sessions table and add
    the set cookie header.
    """

    route_strings = set([
        'POST /start-session',
        'POST /api/start-session',
        ])
    route = Handler.check_route_strings

    def handle(self, req):

        if req.session:
            return Response.json({
                "success": False,
                "reply_timestamp": datetime.datetime.now(),
                "message": "You already have a session!"})

        else:

            sesh = pg.sessions.Session.start_anonymous_session(
                self.cw.get_pgconn())

            resp = Response.json({
                "success": True,
                "message": "Created a new session",
                "session": sesh,
                "reply_timestamp": datetime.datetime.now(),
            })

            resp.set_session_cookie(
                sesh.session_uuid,
                self.cw.app_secret)

            return resp

class EndSession(Handler):

    route_strings = set(['POST /api/end-session'])
    route = Handler.check_route_strings

    def handle(self, req):

        if req.session:

            sesh = req.session.expire(self.cw.get_pgconn())

            resp = Response.json({
                "success": True,
                "reply_timestamp": datetime.datetime.now(),
                "message": "Session ended"})

            resp.set_session_cookie(
                sesh.session_uuid,
                self.cw.app_secret)

            return resp

        else:

            return Response.json({
                "success": False,
                "reply_timestamp": datetime.datetime.now(),
                "message": "no session exists!"})

class SendResetPasswordEmail(Handler):

    route_strings = set(["POST /api/send-reset-password-email"])

    route = Handler.check_route_strings

    def handle(self, req):

        if not req.is_JSON \
        or 'email_address' not in req.json:

            return Response.json({
                "success": False,
                "reply_timestamp": datetime.datetime.now(),
                "message": "Sorry, bad request!"})

        else:

            try:
                user = pg.people.Person.by_email_address(
                    self.cw.get_pgconn(),
                    req.json["email_address"])

            except KeyError as ex:

                log.info("Somebody asked for password reset for "
                    "a bogus user {0}".format(req.json["email_address"]))

                return Response.json({
                    "success": False,
                    "reply_timestamp": datetime.datetime.now(),

                    "message":
                        "Sorry, {0} is an unknown email address!".format(
                            req.json["email_address"])})

            else:

                user.send_reset_password_email(self.cw)

                return Response.json({
                    "success": True,
                    "reply_timestamp": datetime.datetime.now(),
                    "message": "Just sent an email to {0}".format(
                        user.email_address)})

class ResetPassword(Handler):

    route_strings = set(["POST /api/reset-password"])

    route = Handler.check_route_strings

    def handle(self, req):

        if not req.is_JSON \
        or 'payload' not in req.json \
        or 'password' not in req.json:

            return Response.json({
                "success": False,
                "reply_timestamp": datetime.datetime.now(),
                "message": "Sorry, bad request!"})

        else:

            decoder = itsdangerous.URLSafeTimedSerializer(
            self.cw.app_secret)

        try:

            d = decoder.loads(
                req.json["payload"],
                max_age=60*60*24)

        except Exception as ex:
            log.error(ex)
            log.error("payload: {0}".format(req.json["payload"]))

            return Response.json({
                "success": False,
                "reply_timestamp": datetime.datetime.now(),
                "message": "Sorry, bad payload!"})

        else:

            user = pg.people.Person.by_email_address(
                self.cw.get_pgconn(),
                d["email_address"])


            updated_user = user.update_my_password(
                self.cw.get_pgconn(),
                req.json["password"])

            return Response.json({
                "success": True,
                "reply_timestamp": datetime.datetime.now(),
                "message": "We reset your password!"})

class GetAllUsers(Handler):

    route_strings = set(['GET /api/allusers', "GET /api/all-users"])
    route = Handler.check_route_strings

    required_user_groups = [
            "admin",
    ]

    @Handler.require_login
    @Handler.require_group
    def handle(self, req):

        people = [p for p in pg.people.Person.select_all(
                self.cw.get_pgconn())]

        count = pg.people.Person.select_count(self.cw.get_pgconn())

        return Response.json(dict(
            api_address="/api/all-users",
            message="All People",
            reply_timestamp=datetime.datetime.now(),
            success=True,
            count=count,
            people=people))



class ChangeStatus(Handler):

    route_strings = set(["POST /api/change-status"])

    route = Handler.check_route_strings
    required_json_keys = [
            "person_uuid",
            "new_status",
    ]

    required_user_groups = [
            "admin",
    ]

    @Handler.require_json
    @Handler.require_login
    @Handler.require_group
    def handle(self, req):

        new_status = req.json["new_status"]
        person_uuid = req.json["person_uuid"]

        user = pg.people.Person.by_person_uuid(
            self.cw.get_pgconn(),
            person_uuid)


        updated_user = user.update_my_status(
            self.cw.get_pgconn(),
            new_status)

        # Also kill all sessions

        pg.sessions.Session.kill_all_sessions_by_person(
            self.cw.get_pgconn(),
            updated_user.person_uuid)

        return Response.json({
            "success": True,
            "person_status": new_status,
            "reply_timestamp": datetime.datetime.now(),
            "message": "We updated status!"})

class ChangePersonGroupStatus(Handler):

    route_strings = set(["POST /api/change-person-group"])

    route = Handler.check_route_strings

    required_json_keys = [
        "person_uuid",
        "new_group",
    ]

    required_user_groups = [
        "admin",
    ]

    @Handler.require_json
    @Handler.require_login
    @Handler.require_group
    def handle(self, req):

        new_group = req.json["new_group"]
        person_uuid = req.json["person_uuid"]

        user = pg.people.Person.by_person_uuid(
            self.cw.get_pgconn(),
            person_uuid)

        updated_user = user.update_my_group(
            self.cw.get_pgconn(),
            new_group)

        # Also kill all sessions
        pg.sessions.Session.kill_all_sessions_by_person(
            self.cw.get_pgconn(),
            updated_user.person_uuid)

        return Response.json(dict(
            message="Group updated",
            group_title=new_group,
            reply_timestamp=datetime.datetime.now(),
            success=True))


class AllGroups(Handler):

    route_strings = set(["GET /api/group-titles"])
    route = Handler.check_route_strings

    required_user_groups = [
        "admin",
    ]

    @Handler.require_login
    @Handler.require_group
    def handle(self, req):

        return Response.json(dict(
            message="These are all allowed groups",
            reply_timestamp=datetime.datetime.now(),
            success=True,
            groups=self.get_group_titles()))

    def get_group_titles(self):

        qry = textwrap.dedent("""
            select title
            from groups
            order by title
            """)

        cursor = self.cw.get_pgconn().cursor()

        cursor.execute(qry)

        return [row.title for row in cursor]


class InsertNewUser(Handler):

    route_strings = set(["POST /api/insert-new-user"])

    route = Handler.check_route_strings

    route = Handler.check_route_strings

    required_json_keys = [
        "email_address",
        "display_name",
        "raw_password",
    ]

    @Handler.require_json
    def handle(self, req):

        log.debug("storing new person...")

        import pprint

        log.debug(pprint.pformat(req.json))

        try:

            new_user = pg.people.Person.insert(

                self.cw.get_pgconn(),
                req.json['email_address'],
                req.json['raw_password'],
                req.json['display_name'],
            )

        except Exception as e:

            log.exception(e)

            self.cw.get_pgconn().rollback()

            return Response.json(dict(
                message='Error inserting user. Duplicate email',
                new_user=None,
                reply_timestamp=datetime.datetime.now(),
                success=False))

        else:

            return Response.json(dict(
                message="We inserted a new user",
                new_user=new_user,
                reply_timestamp=datetime.datetime.now(),
                success=True))


class ChangePassword(Handler):

    """
    Use ResetPassword to use a reset token to because you forgot your
    old password.

    Use ChangePassword when you want to update your password and you
    have the original one.
    """

    route_strings = set([
        "POST /api/change-password",
        "POST /api/update-password",
   ])

    route = Handler.check_route_strings

    required_json_keys = [
        "current_password",
        "new_password1",
        "new_password2",
    ]

    @Handler.require_login
    @Handler.require_json
    def handle(self, req):

        if req.json["new_password1"] != req.json["new_password2"]:

            return Response.json({
                "success": False,
                "reply_timestamp": datetime.datetime.now(),
                "message": "Sorry, passwords don't match!"})

        else:


            try:
                updated_user = req.user.update_my_password(
                    self.cw.get_pgconn(),
                    req.json["current_password"],
                    req.json["new_password1"])

            except KeyError as ex:
                log.info(ex)

                return Response.json(dict(
                    success=False,
                    reply_timestamp=datetime.datetime.now(),
                    message="Sorry, your current password didn't match!"))

            else:

                return Response.json({
                    "updated_user": updated_user,
                    "success": True,
                    "reply_timestamp": datetime.datetime.now(),
                    "message": "We reset your password!"})

