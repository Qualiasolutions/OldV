"""Slack client"""

import logging
import os

import requests

logger = logging.getLogger(__name__)


class SlackClient:
    """A client for sending Slack webhooks"""

    def __init__(self):
        self._errors_webhook_url = os.environ.get("SLACK_ERRORS_WEBHOOK_URL")
        self._notifications_webhook_url = os.environ.get(
            "SLACK_NOTIFICATIONS_WEBHOOK_URL"
        )
        self._env = os.environ.get("ENV")

    def _post_request(self, url, payload):
        """Send a post request"""
        request = requests.post(url, json=payload, timeout=60)

        try:
            request.raise_for_status()
        except requests.exceptions.HTTPError as exc:
            logger.error(exc.response.content)
            raise
        except Exception as exc:
            logger.error(exc)
            raise

        logger.info("request status: %s", request.status_code)
        return

    def send_error_message(self, text):
        """Send an error message to Slack"""
        if not self._errors_webhook_url:
            logger.info("SLACK_ERRORS_WEBHOOK_URL not found for this environment;")
            return

        logger.info("Sending error message to Slack")

        payload = {"text": f" *ENV {self._env}:* {text}"}

        self._post_request(self._errors_webhook_url, payload)

        return

    def send_notification_message(self, text):
        """Send a notification message to Slack"""
        if not self._notifications_webhook_url:
            logger.info(
                "SLACK_NOTIFICATIONS_WEBHOOK_URL not found for this environment;"
            )
            return

        logger.info("Sending notification message to Slack")

        payload = {"text": f" *ENV {self._env}:* {text}"}

        self._post_request(self._notifications_webhook_url, payload)

        return
