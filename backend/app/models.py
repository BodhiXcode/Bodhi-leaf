from pydantic import BaseModel, Field
from typing import Optional


class ReviewData(BaseModel):
    title: str = ""
    body: str = ""
    author: str = ""
    stars: str = ""
    date: str = ""


class SpecRow(BaseModel):
    label: str = ""
    value: str = ""


class RatingBtn(BaseModel):
    text: str = ""
    label: str = ""
    pct: str = ""
    selected: bool = False


class ProductData(BaseModel):
    title: str = ""
    brand: str = ""
    price: str = ""
    priceFraction: str = ""
    listPrice: str = ""
    savings: str = ""
    dealBadge: str = ""
    coupon: str = ""
    emi: str = ""
    availability: str = ""
    delivery: str = ""
    fastestDelivery: str = ""
    mainImage: str = ""
    features: list[str] = Field(default_factory=list)
    ratingValue: str = ""
    ratingCount: str = ""
    ratingBtns: list[RatingBtn] = Field(default_factory=list)
    reviews: list[ReviewData] = Field(default_factory=list)
    specs: list[SpecRow] = Field(default_factory=list)
    seller: str = ""


class StarBreakdown(BaseModel):
    star: int
    pct: int = 0
    topIssue: str = ""


class InsightsResponse(BaseModel):
    summary: str
    pros: list[str]
    cons: list[str]
    dealScore: float
    dealVerdict: str
    starBreakdown: list[StarBreakdown] = Field(default_factory=list)
    sellerVsProduct: str = ""
    sellerAdvice: str = ""
    newVersionAlert: str = ""
    source: str = "bedrock"


class TTSRequest(BaseModel):
    text: str = Field(..., max_length=3000)
    voice_id: str = "Kajal"
    engine: str = "generative"


class TTSResponse(BaseModel):
    audio_base64: str
    content_type: str = "audio/mpeg"


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "bodhi-leaf-backend"
    region: str = ""


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    product: ProductData
    history: list[ChatMessage] = Field(default_factory=list)
    message: str


class ChatResponse(BaseModel):
    answer: str
