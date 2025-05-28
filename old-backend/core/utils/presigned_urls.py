import logging
import os

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from django.conf import settings
from django.core.cache import cache
from django.db.models import Model

from vuet.settings import CACHE_TIMEOUT

AWS_STORAGE_BUCKET_NAME = settings.AWS_STORAGE_BUCKET_NAME
AWS_S3_ENDPOINT_URL = settings.AWS_S3_ENDPOINT_URL


logger = logging.getLogger(__name__)


def get_file_key(file_field):
    return os.path.join(file_field.storage.location, file_field.name)


def create_presigned_url(bucket_name: str, object_name: str, expiration: int = 3600):
    """Generate a presigned URL to share an S3 object

    :param bucket_name: string
    :param object_name: string
    :param expiration: Time in seconds for the presigned URL to remain valid
    :return: Presigned URL as string. If error, returns None.
    """

    s3_client = boto3.client(
        "s3",
        "eu-west-2",
        config=Config(signature_version="s3v4"),
        endpoint_url=AWS_S3_ENDPOINT_URL,
    )

    try:
        response = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket_name, "Key": object_name},
            ExpiresIn=expiration,
        )
    except ClientError as e:
        logging.error(e)
        return None

    return response


def get_or_create_presigned_url(image: Model, field: str, cache_prefix: str = ""):
    """get or create a presigned URL from the field `field` of the model provided"""
    if not hasattr(image, field):
        raise Exception(f"Could not find attribute {field} on the provided object")

    if not getattr(image, field).name:
        return None

    cache_key = f"presigned-{cache_prefix}-{image.id}"  # type: ignore
    cached_presigned = cache.get(cache_key)

    if cached_presigned:
        return cached_presigned
    else:
        file_key = get_file_key(getattr(image, field))
        presigned_url = create_presigned_url(
            AWS_STORAGE_BUCKET_NAME, file_key, CACHE_TIMEOUT
        )
        cache.set(cache_key, presigned_url)
        return presigned_url
