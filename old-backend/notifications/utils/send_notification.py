"""send_notification"""

import logging
from datetime import datetime, timedelta

from dateutil.tz import tzlocal
from django.conf import settings
from exponent_server_sdk import (  # type: ignore
    DeviceNotRegisteredError,
    PushClient,
    PushMessage,
    PushServerError,
    PushTicketError,
)
from requests.exceptions import ConnectionError, HTTPError

from notifications.models import PushToken


# TODO - implement some of this recommended error tracking / retry logic
def send_push_message(push_token: PushToken, message: str, extra=None):
    """Send a push message to the user assigned to the token"""
    try:
        response = PushClient().publish(
            PushMessage(to=push_token.token, body=message, data=extra)
        )
    except PushServerError as exc:
        # Encountered some likely formatting/validation error.
        logging.error(exc)
        # rollbar.report_exc_info(
        #     extra_data={
        #         'token': token,
        #         'message': message,
        #         'extra': extra,
        #         'errors': exc.errors,
        #         'response_data': exc.response_data,
        #     })
        # raise
    except (ConnectionError, HTTPError) as exc:
        # Encountered some Connection or HTTP error - retry a few times in
        # case it is transient.
        logging.error(exc)
        # rollbar.report_exc_info(
        #     extra_data={'token': token, 'message': message, 'extra': extra})
        # raise self.retry(exc=exc)

    try:
        # We got a response back, but we don't know whether it's an error yet.
        # This call raises errors so we can handle them with normal exception
        # flows.
        response.validate_response()
    except DeviceNotRegisteredError:
        # Mark the push token as inactive
        push_token.active = False
        push_token.save()
    except PushTicketError as exc:
        # Encountered some other per-notification error.
        logging.error(exc)
        # rollbar.report_exc_info(
        #     extra_data={
        #         'token': token,
        #         'message': message,
        #         'extra': extra,
        #         'push_response': exc.push_response._asdict(),
        #     })
        # raise self.retry(exc=exc)


def send_push_message_if_valid(push_token: PushToken, message: str, extra=None):
    """Check that push token is valid and send the message"""
    if push_token.last_active:
        time_since_used = datetime.now(tzlocal()) - push_token.last_active
        refresh_lifetime: timedelta = settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"]  # type: ignore
        if push_token and push_token.active and (time_since_used < refresh_lifetime):
            send_push_message(push_token, message, extra=extra)
    else:
        send_push_message(push_token, message, extra=extra)
