import json
import os
import re
import logging
from functools import lru_cache

import boto3

from app.models import ProductData, InsightsResponse, StarBreakdown, SpecExplained, QuizQuestion, QuizOption

logger = logging.getLogger("bodhi-leaf")

MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "us.amazon.nova-micro-v1:0")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
MAX_TOKENS = 2000

AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY", "")


@lru_cache(maxsize=1)
def _get_client():
    kwargs: dict = {"region_name": AWS_REGION}
    if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
        kwargs["aws_access_key_id"] = AWS_ACCESS_KEY_ID
        kwargs["aws_secret_access_key"] = AWS_SECRET_ACCESS_KEY
    session = boto3.Session(**kwargs)
    return session.client("bedrock-runtime")


SYSTEM_PROMPT = (
    "You are a friendly shopping buddy helping a regular person decide whether to buy a product on Amazon. "
    "Write in simple, everyday language — no jargon, no marketing speak. "
    "Imagine you're advising a friend or family member. Be honest, specific, and helpful. "
    "Reference actual numbers, review sentiments, and real issues people mention."
)

JSON_INSTRUCTIONS = (
    "Respond with ONLY a JSON object (no markdown, no code fences) with these exact keys:\n"
    "CRITICAL: All double quotes inside JSON strings MUST be escaped as \\\", and all newlines MUST be escaped as \\n. "
    "Check your JSON for syntax errors before responding.\n"
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
    '- "sellerVsProduct": one of "seller_issue", "both", or "no_issues". '
    'ONLY use "seller_issue" if negative reviews explicitly complain about the seller '
    '(packaging, delivery, wrong item sent, counterfeit). Use "both" if complaints target '
    'both seller and product. Default to "no_issues" if complaints are purely about product quality/features.\n'
    '- "sellerAdvice": if sellerVsProduct is "seller_issue" or "both", suggest checking other '
    'sellers on this listing. Otherwise empty string.\n'
    '- "newVersionAlert": if the product name or reviews hint at a newer model/version '
    'existing or launching soon, mention it briefly. Otherwise empty string.\n'
    '- "specsExplained": array of objects {label, original, layman} for up to 5 technical specs '
    'that a regular person might not understand. label is the spec name, original is the actual value, '
    'layman is a simple 1-line explanation (e.g. label:"RAM", original:"8GB DDR5", '
    'layman:"Enough memory to run many apps at once without slowing down"). '
    'Skip obvious specs like color or weight.\n'
    '- "chatSuggestions": array of exactly 3 short questions (max 8 words each) a buyer might ask '
    'about THIS specific product. Make them relevant and useful '
    '(e.g. "Is this good for music production?", "How long does the battery last?"). '
    'Tailor them to the product category.\n'
    '- "optionsSummary": 1-2 sentences summarizing the available variations (colors, sizes, and any notable stock/price differences between them). '
    'Summarize the Twister data if available. If no variations, say "No variations available."\n'
    '- "ttsScript": a 100-150 word narration script meant to be read aloud by a text-to-speech engine. '
    'Write it as a friendly, conversational product briefing — like a knowledgeable friend explaining '
    'the product over a phone call. Cover: what it is, price and any savings, rating highlights, '
    'deal verdict, top pros and cons. IMPORTANT: Do NOT use raw abbreviations, pipe characters, '
    'slashes, or spec-heavy jargon. Spell out acronyms naturally (e.g. say "H-D-M-I" not "HDMI", '
    '"27 inch" not "27\\"", "I-P-S display" not "IPS"). Use natural pauses with commas and periods. '
    'Do NOT use bullet points, numbered lists, or any special characters. Just flowing sentences.'
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

    if (product.variations or product.twisterData):
        parts.append("\nAvailable Options (Twister/Variations):")
        if product.variations:
            parts.append(f"  - Labels: {', '.join(product.variations)}")
        if product.twisterData:
            parts.append(f"  - Raw Data: {product.twisterData[:1000]}")

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

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Bedrock JSON. Error: {e}")
        logger.error(f"Raw Text: {raw_text[:2000]}")
        # Attempt to find JSON object if it's wrapped in commentary
        match = re.search(r'({.*})', cleaned, re.DOTALL)
        if match:
            try:
                parsed = json.loads(match.group(1))
            except:
                raise e
        else:
            raise e

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

    specs_explained = []
    for se in parsed.get("specsExplained", []):
        if isinstance(se, dict) and se.get("label"):
            specs_explained.append(SpecExplained(
                label=str(se.get("label", "")),
                original=str(se.get("original", "")),
                layman=str(se.get("layman", "")),
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
        specsExplained=specs_explained[:5],
        chatSuggestions=parsed.get("chatSuggestions", [])[:3],
        optionsSummary=parsed.get("optionsSummary", ""),
        ttsScript=parsed.get("ttsScript", ""),
        source="bedrock",
    )


async def chat_with_product(product: ProductData, history: list, message: str) -> str:
    client = _get_client()

    CHAT_SYSTEM_PROMPT = (
        "You are Bodhi, a friendly and experienced shopper. "
        "Your job is to chat with the user about the product they are looking at. "
        "Talk like a real person, not an AI. Be direct, helpful, and concise. "
        "CRITICAL: NEVER start your answer with 'Based on the provided context' or any similar robotic phrasing. "
        "Just give the answer. If the answer is in the reviews, say 'Shoppers say...' or 'People mentioned...'. "
        "If you don't find a specific detail in the reviews or specs, use your general knowledge to give a helpful best-guess (e.g., 'Usually, sneakers like this are fine for light jogging...'), but keep it grounded in the product type."
    )

    # Build a more comprehensive context
    context_lines = [
        f"Product Title: {product.title}",
        f"Brand: {product.brand}",
        f"Price: {product.price}",
        f"Rating: {product.ratingValue} ({product.ratingCount})",
    ]
    
    if product.features:
        context_lines.append(f"Features: {', '.join(product.features[:8])}")
    
    if product.description:
        context_lines.append(f"Product Description: {product.description[:500]}")
        
    if product.variations:
        context_lines.append(f"Available Variations/Options: {', '.join(product.variations)}")
    
    if product.specs:
        spec_text = ", ".join([f"{s.label}: {s.value}" for s in product.specs[:10]])
        context_lines.append(f"Specifications: {spec_text}")
        
    if product.reviews:
        context_lines.append("\nCUSTOMER REVIEWS:")
        for i, rev in enumerate(product.reviews[:10], 1):
            stars = f" ({rev.stars})" if rev.stars else ""
            context_lines.append(f"{i}. {rev.title}{stars}: {rev.body[:400]}")
            
    if product.twisterData:
        context_lines.append(f"\nTECHNICAL VARIATIONS (RAW): {product.twisterData[:500]}")

    product_context = "\n".join(context_lines)
    logger.info(f"CHAT SESSION: context size {len(product_context)} chars, {len(product.reviews)} reviews")
    logger.info(f"CHAT CONTEXT PREVIEW: {product_context[:200]}...")

    messages = []
    # Add history
    for msg in history:
        messages.append({
            "role": msg.role,
            "content": [{"text": msg.content}]
        })

    # Add current message with context
    user_content = f"CONTEXT ON PRODUCT:\n{product_context}\n\nUSER QUESTION: {message}"
    messages.append({
        "role": "user",
        "content": [{"text": user_content}]
    })

    request_body = json.dumps({
        "schemaVersion": "messages-v1",
        "system": [{"text": CHAT_SYSTEM_PROMPT}],
        "messages": messages,
        "inferenceConfig": {
            "maxTokens": 800,
            "temperature": 0.5,
        },
    })

    response = client.invoke_model(
        modelId=MODEL_ID,
        contentType="application/json",
        accept="application/json",
        body=request_body,
    )

    response_body = json.loads(response["body"].read())
    answer = response_body["output"]["message"]["content"][0]["text"]
    return answer


async def generate_quiz(product: ProductData) -> list[QuizQuestion]:
    client = _get_client()

    keywords = []
    if product.title:
        keywords.append(product.title)
    if product.brand:
        keywords.append(product.brand)
    keywords.extend(product.features[:6])
    if product.ratingValue:
        keywords.append(f"Rating: {product.ratingValue}")

    prompt = (
        f"Product: {product.title}\n"
        f"Category keywords: {', '.join(keywords[:10])}\n\n"
        "Generate exactly 4 short MCQ questions to understand what this buyer needs "
        "from THIS specific product. Each question should have 3 options. "
        "Questions should be about the buyer's USE CASE, PRIORITIES, and EXPECTATIONS "
        "for this exact type of product — not generic shopping questions.\n\n"
        "Respond with ONLY a JSON array (no markdown, no fences) of objects with keys:\n"
        '- "id": short snake_case identifier\n'
        '- "question": the question text (max 10 words)\n'
        '- "options": array of {label, value} objects (3 options each, label max 4 words, value is a short key)\n'
    )

    request_body = json.dumps({
        "schemaVersion": "messages-v1",
        "system": [{"text": "You generate short, relevant product preference quizzes. Output ONLY valid JSON."}],
        "messages": [{"role": "user", "content": [{"text": prompt}]}],
        "inferenceConfig": {"maxTokens": 600, "temperature": 0.8},
    })

    response = client.invoke_model(
        modelId=MODEL_ID,
        contentType="application/json",
        accept="application/json",
        body=request_body,
    )

    response_body = json.loads(response["body"].read())
    raw = response_body["output"]["message"]["content"][0]["text"].strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()

    parsed = json.loads(raw)
    questions = []
    for q in parsed[:4]:
        options = [QuizOption(label=o["label"], value=o["value"]) for o in q.get("options", [])[:3]]
        if len(options) >= 2:
            questions.append(QuizQuestion(id=q.get("id", "q"), question=q["question"], options=options))
    return questions


LANG_NAMES = {
    "hi": "Hindi",
    "ta": "Tamil",
    "te": "Telugu",
    "bn": "Bengali",
    "mr": "Marathi",
    "gu": "Gujarati",
    "kn": "Kannada",
    "ml": "Malayalam",
}

DEVANAGARI_LANGS = {"hi", "mr"}


async def translate_text(text: str, target_lang: str = "hi") -> str:
    client = _get_client()
    lang_name = LANG_NAMES.get(target_lang, "Hindi")

    if target_lang in DEVANAGARI_LANGS:
        prompt = (
            f"Translate the following product summary into {lang_name}. "
            "Keep it natural and conversational. Output ONLY the translation, nothing else.\n\n"
            f"{text}"
        )
        system_text = f"You are a translator. Translate text to {lang_name}. Output ONLY the translation."
    else:
        prompt = (
            f"Translate the following product summary into {lang_name}, but write the output "
            "in DEVANAGARI script (transliteration). This is for a Hindi text-to-speech engine, "
            "so the output must be phonetically accurate in Devanagari so it sounds like natural "
            f"{lang_name} when read aloud. Keep it conversational. Output ONLY the Devanagari transliteration.\n\n"
            f"{text}"
        )
        system_text = (
            f"You are a translator and transliterator. Translate text to {lang_name} "
            "but write the result in Devanagari script (phonetic transliteration). "
            "Output ONLY the Devanagari text."
        )

    request_body = json.dumps({
        "schemaVersion": "messages-v1",
        "system": [{"text": system_text}],
        "messages": [{"role": "user", "content": [{"text": prompt}]}],
        "inferenceConfig": {"maxTokens": 1500, "temperature": 0.3},
    })

    response = client.invoke_model(
        modelId=MODEL_ID,
        contentType="application/json",
        accept="application/json",
        body=request_body,
    )

    response_body = json.loads(response["body"].read())
    return response_body["output"]["message"]["content"][0]["text"].strip()


async def generate_recommendations(product: ProductData, preferences: dict) -> dict:
    client = _get_client()

    pref_text = "\n".join(f"  - {k}: {v}" for k, v in preferences.items()) if preferences else "No specific preferences provided."

    prompt = (
        f"Product being viewed: {product.title}\n"
        f"Brand: {product.brand}\n"
        f"Price: {product.price}\n"
        f"Features: {', '.join(product.features[:6])}\n"
        f"Rating: {product.ratingValue}\n\n"
        f"Buyer's preferences:\n{pref_text}\n\n"
        "Based on the buyer's preferences and this product, respond with ONLY a JSON object (no markdown):\n"
        '- "tips": 2-3 short tips on what to prioritize when buying this type of product, personalized to their preferences\n'
        '- "lookFor": 2-3 specific features/specs to look for in alternatives if this product doesn\'t match\n'
        '- "avoid": 1-2 things to avoid based on their use case\n'
    )

    request_body = json.dumps({
        "schemaVersion": "messages-v1",
        "system": [{"text": "You give personalized shopping advice. Output ONLY valid JSON."}],
        "messages": [{"role": "user", "content": [{"text": prompt}]}],
        "inferenceConfig": {"maxTokens": 600, "temperature": 0.7},
    })

    response = client.invoke_model(
        modelId=MODEL_ID,
        contentType="application/json",
        accept="application/json",
        body=request_body,
    )

    response_body = json.loads(response["body"].read())
    raw = response_body["output"]["message"]["content"][0]["text"].strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()

    return json.loads(raw)
