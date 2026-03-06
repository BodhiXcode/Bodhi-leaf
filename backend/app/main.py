import os
import logging
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from app.models import (
    ProductData, InsightsResponse, TTSRequest, TTSResponse, HealthResponse,
    ChatRequest, ChatResponse, QuizRequest, QuizResponse,
    TranslateRequest, TranslateResponse,
    RecommendationRequest, RecommendationResponse,
)
from app.services.bedrock import analyze_product, chat_with_product, generate_quiz, translate_text, generate_recommendations
from app.services.polly import synthesize_speech

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bodhi-leaf")

AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

app = FastAPI(
    title="Bodhi Leaf Backend",
    description="AWS-powered backend for the Bodhi Leaf Commerce Copilot",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="ok", region=AWS_REGION)


@app.post("/api/insights", response_model=InsightsResponse)
async def get_insights(product: ProductData):
    try:
        result = await analyze_product(product)
        return result
    except Exception as e:
        logger.error(f"Bedrock insights failed: {e}", exc_info=True)
        raise HTTPException(status_code=502, detail=f"AI analysis failed: {str(e)}")


@app.post("/api/tts", response_model=TTSResponse)
async def get_tts(request: TTSRequest):
    try:
        result = await synthesize_speech(
            text=request.text,
            voice_id=request.voice_id,
            engine=request.engine,
        )
        return result
    except Exception as e:
        logger.error(f"Polly TTS failed: {e}", exc_info=True)
        raise HTTPException(status_code=502, detail=f"TTS synthesis failed: {str(e)}")


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        answer = await chat_with_product(request.product, request.history, request.message)
        return ChatResponse(answer=answer)
    except Exception as e:
        logger.error(f"Bedrock chat failed: {e}", exc_info=True)
        raise HTTPException(status_code=502, detail=f"Chat failed: {str(e)}")


@app.post("/api/quiz", response_model=QuizResponse)
async def get_quiz(request: QuizRequest):
    try:
        questions = await generate_quiz(request.product)
        return QuizResponse(questions=questions)
    except Exception as e:
        logger.error(f"Quiz generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=502, detail=f"Quiz generation failed: {str(e)}")


@app.post("/api/translate", response_model=TranslateResponse)
async def translate(request: TranslateRequest):
    try:
        translated = await translate_text(request.text, request.target_lang)
        return TranslateResponse(translated=translated, target_lang=request.target_lang)
    except Exception as e:
        logger.error(f"Translation failed: {e}", exc_info=True)
        raise HTTPException(status_code=502, detail=f"Translation failed: {str(e)}")


@app.post("/api/recommendations", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    try:
        result = await generate_recommendations(request.product, request.preferences)
        return RecommendationResponse(
            tips=result.get("tips", []),
            lookFor=result.get("lookFor", []),
            avoid=result.get("avoid", []),
        )
    except Exception as e:
        logger.error(f"Recommendations failed: {e}", exc_info=True)
        raise HTTPException(status_code=502, detail=f"Recommendations failed: {str(e)}")


handler = Mangum(app, lifespan="off", api_gateway_base_path="/prod")
