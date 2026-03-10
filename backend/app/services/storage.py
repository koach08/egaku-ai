"""Cloudflare R2 storage (S3-compatible)."""

import uuid
from datetime import datetime

import boto3
from botocore.config import Config

from app.core.config import Settings


class R2Storage:
    def __init__(self, settings: Settings):
        self.bucket = settings.r2_bucket_name
        self.public_url = settings.r2_public_url
        self.client = boto3.client(
            "s3",
            endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
            aws_access_key_id=settings.r2_access_key_id,
            aws_secret_access_key=settings.r2_secret_access_key,
            config=Config(signature_version="s3v4"),
            region_name="auto",
        )

    def upload_image(self, data: bytes, user_id: str, ext: str = "png") -> str:
        """Upload image bytes to R2. Returns the public URL."""
        date_prefix = datetime.utcnow().strftime("%Y/%m/%d")
        filename = f"{uuid.uuid4().hex}.{ext}"
        key = f"generations/{user_id}/{date_prefix}/{filename}"

        self.client.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=data,
            ContentType=f"image/{ext}",
        )
        return f"{self.public_url}/{key}"

    def upload_video(self, data: bytes, user_id: str, ext: str = "mp4") -> str:
        date_prefix = datetime.utcnow().strftime("%Y/%m/%d")
        filename = f"{uuid.uuid4().hex}.{ext}"
        key = f"generations/{user_id}/{date_prefix}/{filename}"

        content_type = "video/mp4" if ext == "mp4" else f"image/{ext}"
        self.client.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
        return f"{self.public_url}/{key}"

    def generate_presigned_url(self, key: str, expires_in: int = 3600) -> str:
        """Generate a presigned URL for private/NSFW content."""
        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": key},
            ExpiresIn=expires_in,
        )

    def delete_object(self, key: str):
        self.client.delete_object(Bucket=self.bucket, Key=key)
