import json
import os
import re
import logging
from functools import lru_cache

import boto3

from app.models import ProductData, InsightsResponse, StarBreakdown

logger = logging.getLogger("bodhi-leaf")

MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "us.amazon.nova-micro-v1:0")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
MAX_TOKENS = 1500

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


SYSTEM_PROMPT = (
    "You are a friendly shopping buddy helping a regular person decide whether to buy a product on Amazon. "
    "Write in simple, everyday language — no jargon, no marketing speak. "
    "Imagine you're advising a friend or family member. Be honest, specific, and helpful. "
    "Reference actual numbers, review sentiments, and real issues people mention."
)

JSON_INSTRUCTIONS = (
    "Respond with ONLY a JSON object (no markdown, no code fences) with these exact keys:\n"
    '- "summary": 2-3 sentence plain-English summary a non-tech person can understand. '
    'Start with what the product IS, then whether it\'s worth buying.\n'
    '- "pros": array of 3-6 specific pros in simple language\n'
    '- "cons": array of 2-5 specific cons or cautions in simple language\n'
    '- "dealScore": number from 0 to 10 (one decimal)\n'
    '- "dealVerdict": one short sentence a friend would say (e.g. "Great buy if you need X")\n'
    '- "starBreakdown": array of objects {star, pct, topIssue} for stars 1-5. '
    'pct is the percentage from the histogram. topIssue is a one-line summary of what '
    'people at that star level commonly say (e.g. "Battery dies within a month"). '
    'If no data, use empty string for topIssue.\n'
    '- "sellerVsProduct": one of "seller_issue", "product_issue", "both", or "no_issues". '
    'Analyze if negative reviews complain about the seller (packaging, delivery, wrong item) '
    'vs the product itself (quality, defects, features).\n'
    '- "sellerAdvice": if sellerVsProduct is "seller_issue" or "both", suggest checking other '
    'sellers on this listing. Otherwise empty string.\n'
    '- "newVersionAlert": if the product name or reviews hint at a newer model/version '
    'existing or launching soon, mention it briefly. Otherwise empty string.'
)


def _build_prompt(product: ProductData) -> str:
    parts: list[str] = ["=== PRODUCT DATA ==="]

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
        for review in product.reviews[:10]:
            stars = f" [{review.stars}]" if review.stars else ""
            title = review.title or ""
            body = review.body[:400] if review.body else ""
            if title or body:
                parts.append(f"  - {title}{stars}: {body}")

    parts.append("\n=== END DATA ===")
    parts.append("")
    parts.append(JSON_INSTRUCTIONS)

    return "\n".join(parts)


async def analyze_product(product: ProductData) -> InsightsResponse:
    client = _get_client()
    prompt = _build_prompt(product)

    request_body = json.dumps({
        "schemaVersion": "messages-v1",
        "system": [{"text": SYSTEM_PROMPT}],
        "messages": [
            {"role": "user", "content": [{"text": prompt}]}
        ],
        "inferenceConfig": {
            "maxTokens": MAX_TOKENS,
            "temperature": 0.7,
        },
    })

    logger.info(f"Calling Bedrock model {MODEL_ID} (region={AWS_REGION}) for product: {product.title[:60]}")

    response = client.invoke_model(
        modelId=MODEL_ID,
        contentType="application/json",
        accept="application/json",
        body=request_body,
    )

    response_body = json.loads(response["body"].read())
    raw_text = response_body["output"]["message"]["content"][0]["text"]

    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

    parsed = json.loads(cleaned)

    deal_score = float(parsed.get("dealScore", 0))
    deal_score = round(min(max(deal_score, 0), 10), 1)

    star_breakdown = []
    for sb in parsed.get("starBreakdown", []):
        if isinstance(sb, dict):
            star_breakdown.append(StarBreakdown(
                star=int(sb.get("star", 0)),
                pct=int(sb.get("pct", 0)),
                topIssue=str(sb.get("topIssue", "")),
            ))

    return InsightsResponse(
        summary=parsed.get("summary", ""),
        pros=parsed.get("pros", []),
        cons=parsed.get("cons", []),
        dealScore=deal_score,
        dealVerdict=parsed.get("dealVerdict", ""),
        starBreakdown=star_breakdown,
        sellerVsProduct=parsed.get("sellerVsProduct", ""),
        sellerAdvice=parsed.get("sellerAdvice", ""),
        newVersionAlert=parsed.get("newVersionAlert", ""),
        source="bedrock",
    )
