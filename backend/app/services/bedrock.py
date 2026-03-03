import json
import os
import logging
from functools import lru_cache

import boto3

from app.models import ProductData, InsightsResponse

logger = logging.getLogger("bodhi-leaf")

MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
MAX_TOKENS = 1024


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
    return session.client("bedrock-runtime")


def _build_prompt(product: ProductData) -> str:
    parts: list[str] = []

    parts.append(
        "You are a sharp, concise product analyst for an Amazon shopping assistant. "
        "Analyze the following scraped Amazon product data and provide actionable insights for a buyer. "
        "Be specific and data-driven. Reference actual numbers, features, and review sentiments. "
        "If reviews mention specific issues or praises, reflect those. Don't be generic."
    )
    parts.append("")
    parts.append("=== PRODUCT DATA ===")

    if product.title:
        parts.append(f"Title: {product.title}")
    if product.brand:
        parts.append(f"Brand: {product.brand}")
    if product.price:
        parts.append(f"Price: ₹{product.price}")
    if product.listPrice:
        parts.append(f"MRP: {product.listPrice}")
    if product.savings:
        parts.append(f"Savings: {product.savings}")
    if product.dealBadge:
        parts.append(f"Deal: {product.dealBadge}")
    if product.coupon:
        parts.append(f"Coupon: {product.coupon}")
    if product.availability:
        parts.append(f"Availability: {product.availability}")
    if product.seller:
        parts.append(f"Seller: {product.seller}")
    if product.ratingValue:
        parts.append(f"Rating: {product.ratingValue}")
    if product.ratingCount:
        parts.append(f"Rating Count: {product.ratingCount}")

    if product.ratingBtns:
        histogram_parts = []
        for btn in product.ratingBtns:
            import re
            label_m = re.search(r"(\d)\s*star", btn.label, re.IGNORECASE)
            pct_m = re.search(r"(\d+)", btn.pct)
            if label_m and pct_m:
                histogram_parts.append(f"{label_m.group(1)}★: {pct_m.group(1)}%")
        if histogram_parts:
            parts.append(f"Rating Distribution: {', '.join(histogram_parts)}")

    if product.features:
        feat_lines = "\n".join(f"  - {f}" for f in product.features[:8])
        parts.append(f"\nKey Features:\n{feat_lines}")

    if product.specs:
        spec_lines = "\n".join(f"  - {s.label}: {s.value}" for s in product.specs[:10])
        parts.append(f"\nSpecifications:\n{spec_lines}")

    if product.reviews:
        parts.append("\nCustomer Reviews:")
        for review in product.reviews[:8]:
            stars = f" [{review.stars}]" if review.stars else ""
            title = review.title or ""
            body = review.body[:300] if review.body else ""
            if title or body:
                parts.append(f"  - {title}{stars}: {body}")

    parts.append("\n=== END DATA ===")
    parts.append("")
    parts.append(
        "Respond with ONLY a JSON object (no markdown, no code fences) with these exact keys:\n"
        '- "summary": a concise 1-2 sentence product summary\n'
        '- "pros": array of 3-6 specific pros\n'
        '- "cons": array of 2-5 specific cons or cautions\n'
        '- "dealScore": number from 0 to 10 (one decimal)\n'
        '- "dealVerdict": a short verdict sentence'
    )

    return "\n".join(parts)


async def analyze_product(product: ProductData) -> InsightsResponse:
    client = _get_client()
    prompt = _build_prompt(product)

    request_body = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": MAX_TOKENS,
        "temperature": 0.7,
        "messages": [
            {"role": "user", "content": prompt}
        ],
    })

    logger.info(f"Calling Bedrock model {MODEL_ID} for product: {product.title[:60]}")

    response = client.invoke_model(
        modelId=MODEL_ID,
        contentType="application/json",
        accept="application/json",
        body=request_body,
    )

    response_body = json.loads(response["body"].read())
    raw_text = response_body["content"][0]["text"]

    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

    parsed = json.loads(cleaned)

    deal_score = float(parsed.get("dealScore", 0))
    deal_score = round(min(max(deal_score, 0), 10), 1)

    return InsightsResponse(
        summary=parsed.get("summary", ""),
        pros=parsed.get("pros", []),
        cons=parsed.get("cons", []),
        dealScore=deal_score,
        dealVerdict=parsed.get("dealVerdict", ""),
        source="bedrock",
    )
