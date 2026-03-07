import base64
import logging
import os
from functools import lru_cache

import boto3

from app.models import TTSResponse

logger = logging.getLogger("bodhi-leaf")

AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
MAX_TEXT_LENGTH = 3000


_ON_LAMBDA = bool(os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))


@lru_cache(maxsize=1)
def _get_client():
    kwargs: dict = {"region_name": AWS_REGION}
    if not _ON_LAMBDA:
        key = os.environ.get("AWS_ACCESS_KEY_ID", "")
        secret = os.environ.get("AWS_SECRET_ACCESS_KEY", "")
        if key and secret:
            kwargs["aws_access_key_id"] = key
            kwargs["aws_secret_access_key"] = secret
    session = boto3.Session(**kwargs)
    return session.client("polly")


async def synthesize_speech(
    text: str,
    voice_id: str = "Kajal",
    engine: str = "generative",
    language_code: str = "en-IN",
) -> TTSResponse:
    if len(text) > MAX_TEXT_LENGTH:
        text = text[:MAX_TEXT_LENGTH]

    client = _get_client()

    logger.info(f"Calling Polly with voice={voice_id}, engine={engine}, lang={language_code}, text_len={len(text)}")

    response = client.synthesize_speech(
        Text=text,
        OutputFormat="mp3",
        VoiceId=voice_id,
        Engine=engine,
        LanguageCode=language_code,
    )

    audio_stream = response["AudioStream"].read()
    audio_b64 = base64.b64encode(audio_stream).decode("utf-8")

    return TTSResponse(
        audio_base64=audio_b64,
        content_type="audio/mpeg",
    )
