"""A middleware to handle generic server errors"""

import traceback

from utils.slack_client import SlackClient


class HandleErrorsMiddleware:
    """A middleware to handle generic server errors"""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        """On errors, surface them to Slack"""
        slack_client = SlackClient()
        slack_client.send_error_message(traceback.format_exc())
