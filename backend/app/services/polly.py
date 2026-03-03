import base64
import logging
import os
from functools import lru_cache

import boto3

from app.models import TTSResponse

logger = logging.getLogger("bodhi-leaf")

AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
MAX_TEXT_LENGTH = 3000


AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY", "")


@lru_cache(maxsize=1)
def _get_client():
    if not AWS_ACCESS_KEY_ID or not AWS_SECRET_ACCESS_KEY:
        raise RuntimeError("AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set in backend/.env")
    session = boto3.Session(
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION,
    )
    return session.client("polly")


async def synthesize_speech(
    text: str,
    voice_id: str = "Kajal",
    engine: str = "generative",
) -> TTSResponse:
    if len(text) > MAX_TEXT_LENGTH:
        text = text[:MAX_TEXT_LENGTH]

    client = _get_client()

    logger.info(f"Calling Polly with voice={voice_id}, engine={engine}, text_len={len(text)}")

    response = client.synthesize_speech(
        Text=text,
        OutputFormat="mp3",
        VoiceId=voice_id,
        Engine=engine,
        LanguageCode="en-IN",
    )

    audio_stream = response["AudioStream"].read()
    audio_b64 = base64.b64encode(audio_stream).decode("utf-8")

    return TTSResponse(
        audio_base64=audio_b64,
        content_type="audio/mpeg",
    )
