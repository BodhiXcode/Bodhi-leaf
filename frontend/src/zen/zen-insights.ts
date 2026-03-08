import { callBackendForInsights, isAIAvailable, type AIInsightsResponse, type StarBreakdown, type SpecExplained } from "../config/ai";

export interface ZenInsights {
  summary: string;
  pros: string[];
  cons: string[];
  dealScore: number;
  dealVerdict: string;
  quickSpecs: { label: string; value: string }[];
  starBreakdown: StarBreakdown[];
  sellerVsProduct: string;
  sellerAdvice: string;
  newVersionAlert: string;
  specsExplained: SpecExplained[];
  chatSuggestions: string[];
  optionsSummary: string;
  ttsScript: string;
  source: "bedrock" | "local";
}

// ═══════════════════════════════════════════════════
// Local fallback engine (keyword + heuristic based)
// ═══════════════════════════════════════════════════

const POSITIVE_SIGNALS = [
  "great", "excellent", "good", "love", "amazing", "perfect", "best",
  "quality", "worth", "recommend", "fantastic", "awesome", "solid",
  "premium", "beautiful", "smooth", "fast", "crisp", "bright",
  "comfortable", "sturdy", "impressive", "reliable", "superb",
  "brilliant", "wonderful", "durable", "happy", "pleased",
  "value for money", "bang for the buck", "no complaints",
  "nice", "decent", "like", "enjoy", "satisfied", "handy",
  "works well", "easy to use", "easy to set up", "well built",
  "well made", "looks great", "works great", "highly recommend",
  "must buy", "must have", "no issues", "no problems",
  "long lasting", "lightweight", "compact", "powerful",
  "clear", "sharp", "vibrant", "responsive", "intuitive",
  "elegant", "sleek", "stylish", "convenient", "efficient",
];

const NEGATIVE_SIGNALS = [
  "bad", "poor", "worst", "broken", "defective", "cheap", "issue",
  "problem", "disappointed", "waste", "terrible", "horrible", "slow",
  "flimsy", "overpriced", "noisy", "dim", "heavy", "fragile",
  "uncomfortable", "unreliable", "difficult", "lacking", "mediocre",
  "not worth", "regret", "return", "refund", "damage",
  "does not work", "doesn't work", "stopped working", "fell apart",
  "low quality", "not as described", "misleading", "fake", "scam",
  "too small", "too big", "not fit", "doesn't fit", "scratched",
  "not durable", "battery drains", "heats up", "overheating",
  "laggy", "freezes", "crashes", "glitch", "bug", "error",
];

const FEATURE_PRO_PATTERNS: [RegExp, string][] = [
  [/warranty|guarantee/i, "Comes with warranty/guarantee"],
  [/water.?(?:proof|resist)/i, "Water resistant design"],
  [/dust.?(?:proof|resist)/i, "Dust resistant"],
  [/(?:fast|quick|rapid)\s*charg/i, "Supports fast charging"],
  [/type.?c|usb.?c/i, "USB-C connectivity"],
  [/wireless|bluetooth|wi-?fi/i, "Wireless connectivity"],
  [/noise\s*cancel/i, "Noise cancellation feature"],
  [/long\s*(?:battery|lasting|life)/i, "Long battery life"],
  [/lightweight|ultra.?light/i, "Lightweight build"],
  [/portable|compact|travel/i, "Portable and compact"],
  [/(?:hd|4k|1080p|full\s*hd|qhd|amoled|oled|retina)/i, "High-quality display"],
  [/ergonomic/i, "Ergonomic design"],
  [/anti.?(?:slip|skid|bacterial|microbial)/i, "Safety/hygiene features"],
  [/eco.?friendly|sustainable|recyclable/i, "Eco-friendly materials"],
  [/(?:memory|expandable|micro\s*sd)/i, "Expandable storage support"],
  [/(?:dual|stereo)\s*speaker/i, "Stereo/dual speaker audio"],
  [/(?:touch\s*screen|touchscreen)/i, "Touchscreen interface"],
  [/(?:adjustable|customizable|programmable)/i, "Adjustable/customizable"],
  [/(?:stainless|steel|aluminum|aluminium|metal)\s*(?:body|build|frame|chassis)/i, "Premium metal build"],
  [/(?:led|backlit|backlight|rgb)/i, "LED/backlit features"],
];

function extractSentences(text: string): string[] {
  return text
    .split(/[.!?\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 8 && s.length < 300);
}

function scoreSentiment(sentence: string, signals: string[]): number {
  const lower = sentence.toLowerCase();
  return signals.reduce((score, word) => score + (lower.includes(word) ? 1 : 0), 0);
}

function extractProsAndConsLocal(data: any): { pros: string[]; cons: string[] } {
  const pros: string[] = [];
  const cons: string[] = [];

  const reviews: any[] = data.reviews || [];
  if (reviews.length > 0) {
    const proSentences = new Map<string, number>();
    const conSentences = new Map<string, number>();

    for (const review of reviews) {
      const text = `${review.title || ""} ${review.body || ""}`;
      const sentences = extractSentences(text);

      for (const sentence of sentences) {
        const posScore = scoreSentiment(sentence, POSITIVE_SIGNALS);
        const negScore = scoreSentiment(sentence, NEGATIVE_SIGNALS);

        if (posScore > negScore && posScore >= 1) {
          const clean = sentence.replace(/^[\s,;-]+/, "").trim();
          if (clean.length > 8) proSentences.set(clean, (proSentences.get(clean) || 0) + posScore);
        } else if (negScore > posScore && negScore >= 1) {
          const clean = sentence.replace(/^[\s,;-]+/, "").trim();
          if (clean.length > 8) conSentences.set(clean, (conSentences.get(clean) || 0) + negScore);
        }
      }

      const title = (review.title || "").trim();
      if (title.length >= 3) {
        const titlePos = scoreSentiment(title, POSITIVE_SIGNALS);
        const titleNeg = scoreSentiment(title, NEGATIVE_SIGNALS);
        if (titlePos > titleNeg && titlePos >= 1) proSentences.set(title, (proSentences.get(title) || 0) + titlePos + 1);
        else if (titleNeg > titlePos && titleNeg >= 1) conSentences.set(title, (conSentences.get(title) || 0) + titleNeg + 1);
      }
    }

    pros.push(...[...proSentences.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([t]) => truncateInsight(t)));
    cons.push(...[...conSentences.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([t]) => truncateInsight(t)));
  }

  const features: string[] = data.features || [];
  for (const feature of features) {
    for (const [pattern, label] of FEATURE_PRO_PATTERNS) {
      if (pattern.test(feature) && !pros.some(p => p === label)) { pros.push(label); break; }
    }
    if (pros.length >= 6) break;
  }

  const ratingMatch = data.ratingValue?.match(/([\d.]+)/);
  const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
  const countMatch = data.ratingCount?.match(/([\d,]+)/);
  const reviewCount = countMatch ? parseInt(countMatch[1].replace(/,/g, "")) : 0;

  if (rating >= 4.0 && reviewCount >= 100) pros.push(`Highly rated at ${rating}/5 across ${reviewCount.toLocaleString()} reviews`);
  else if (rating < 3.5 && rating > 0) cons.push(`Below-average rating of ${rating}/5`);

  if (data.ratingBtns?.length > 0) {
    const histogram = data.ratingBtns.map((btn: any) => {
      const l = btn.label?.match(/(\d)\s*star/i);
      const p = btn.pct?.match(/(\d+)/);
      return l && p ? { stars: parseInt(l[1]), pct: parseInt(p[1]) } : null;
    }).filter(Boolean);
    const fiveStar = histogram.find((h: any) => h.stars === 5);
    const oneStar = histogram.find((h: any) => h.stars === 1);
    if (fiveStar && fiveStar.pct >= 60) pros.push(`${fiveStar.pct}% of buyers gave 5 stars`);
    if (oneStar && oneStar.pct >= 20) cons.push(`${oneStar.pct}% of buyers gave only 1 star`);
  }

  const savingsMatch = data.savings?.match(/(\d+)/);
  const savingsPct = savingsMatch ? parseInt(savingsMatch[1]) : 0;
  if (savingsPct >= 30) pros.push(`${savingsPct}% discount from MRP`);
  if (data.coupon) pros.push("Additional coupon available");
  if (data.dealBadge) pros.push("Currently has an active deal badge");

  const avail = (data.availability || "").toLowerCase();
  if (avail.includes("out of stock") || avail.includes("unavailable")) cons.push("Currently out of stock");
  else if (avail.includes("only") && avail.match(/only\s*\d+/i)) cons.push("Limited stock remaining");

  if (data.seller) {
    const sl = data.seller.toLowerCase();
    if (sl.includes("amazon") || sl.includes("cloudtail") || sl.includes("appario")) pros.push("Sold by Amazon-affiliated seller");
  }

  return { pros: dedupe(pros).slice(0, 6), cons: dedupe(cons).slice(0, 5) };
}

function truncateInsight(text: string): string {
  if (text.length <= 100) return text;
  const cut = text.substring(0, 100);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 50 ? cut.substring(0, lastSpace) : cut) + "…";
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = item.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function calculateDealScore(data: any): { score: number; verdict: string } {
  let score = 0;
  const factors: string[] = [];

  const ratingMatch = data.ratingValue?.match(/([\d.]+)/);
  const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
  if (rating > 0) {
    score += Math.min((rating / 5) * 3, 3);
    if (rating >= 4.0) factors.push(`strong ${rating}★ rating`);
    else if (rating >= 3.0) factors.push(`decent ${rating}★ rating`);
    else factors.push(`low ${rating}★ rating`);
  }

  const savingsMatch = data.savings?.match(/(\d+)/);
  const savingsPct = savingsMatch ? parseInt(savingsMatch[1]) : 0;
  if (savingsPct > 0) { score += Math.min((savingsPct / 40) * 3, 3); factors.push(`${savingsPct}% savings`); }

  const countMatch = data.ratingCount?.match(/([\d,]+)/);
  const reviewCount = countMatch ? parseInt(countMatch[1].replace(/,/g, "")) : 0;
  if (reviewCount > 1000) { score += 1.5; factors.push(`${reviewCount.toLocaleString()} reviews`); }
  else if (reviewCount > 200) { score += 1; factors.push(`${reviewCount} reviews`); }
  else if (reviewCount > 50) { score += 0.5; }

  if (data.dealBadge) { score += 0.5; factors.push("active deal"); }
  if (data.coupon) { score += 0.5; factors.push("coupon available"); }

  const avail = (data.availability || "").toLowerCase();
  if (avail.includes("in stock") || avail.includes("available")) score += 1;
  else if (avail.includes("out of stock") || avail.includes("unavailable")) { score -= 1; factors.push("out of stock"); }

  score = Math.round(Math.min(Math.max(score, 0), 10) * 10) / 10;

  let verdict: string;
  if (score >= 8) verdict = `Excellent deal — ${factors.slice(0, 3).join(", ")}`;
  else if (score >= 6) verdict = `Good deal — ${factors.slice(0, 3).join(", ")}`;
  else if (score >= 4) verdict = `Fair deal — ${factors.slice(0, 3).join(", ")}`;
  else verdict = `Below average — ${factors.slice(0, 3).join(", ")}`;

  return { score, verdict };
}

// ═══════════════════════════════════════════════════
// Shared helpers (used by both AI and local paths)
// ═══════════════════════════════════════════════════

function buildSummary(data: any): string {
  const parts: string[] = [];
  if (data.title) parts.push(data.title);
  if (data.brand) {
    const brand = data.brand.replace(/^Visit the\s+/i, "").replace(/\s+Store$/i, "").replace(/^Brand:\s*/i, "");
    if (brand) parts.push(`by ${brand}`);
  }
  if (data.price) parts.push(`priced at ₹${data.price.replace(/\.\s*$/, "")}`);
  if (data.savings) parts.push(`with ${data.savings} off`);
  if (data.ratingValue) parts.push(`rated ${data.ratingValue}`);
  if (data.ratingCount) parts.push(`based on ${data.ratingCount}`);
  return parts.join(", ") + ".";
}

function humanizeTitle(raw: string): string {
  let t = raw
    .replace(/\|/g, ", ")
    .replace(/\//g, " or ")
    .replace(/\s*,\s*,+/g, ",")
    .replace(/\s{2,}/g, " ")
    .trim();

  const cutoff = t.indexOf(",", 60);
  if (cutoff > 0 && cutoff < t.length - 5) {
    t = t.substring(0, cutoff).trim();
  }

  t = t
    .replace(/(\d+)\s*"/, "$1 inch")
    .replace(/(\d+)\s*cm\b/gi, "$1 centimetre")
    .replace(/\bcd\/m2\b/gi, "candela per square metre")
    .replace(/\bms\b/g, "milliseconds")
    .replace(/\bHz\b/gi, "hertz")
    .replace(/\bsRGB\b/gi, "s-RGB")
    .replace(/\bHDMI\b/g, "H-D-M-I")
    .replace(/\bUSB[-\s]?C\b/gi, "USB C")
    .replace(/\bAMD\b/g, "A-M-D")
    .replace(/\bRTX\b/g, "R-T-X")
    .replace(/\bGTX\b/g, "G-T-X")
    .replace(/\bDDR\d?\b/g, (m) => m.split("").join("-"))
    .replace(/\bSSD\b/g, "S-S-D")
    .replace(/\bHDD\b/g, "H-D-D")
    .replace(/\bLED\b/g, "L-E-D")
    .replace(/\bOLED\b/g, "O-L-E-D")
    .replace(/\bIPS\b/g, "I-P-S")
    .replace(/\bRAM\b/g, "ram")
    .replace(/\bGHz\b/gi, "gigahertz")
    .replace(/\bGB\b/g, "G-B")
    .replace(/\bTB\b/g, "terabyte")
    .replace(/\bMP\b/g, "megapixel")
    .replace(/\bmAh\b/gi, "milliamp-hour")
    .replace(/(\d+)\s*W\b/g, "$1 watt");

  return t;
}

function buildTTSScript(data: any, insights: Omit<ZenInsights, "ttsScript">): string {
  const parts: string[] = [];

  const name = humanizeTitle(data.title || "this product");
  parts.push(`Let me tell you about ${name}.`);

  if (data.price) {
    const p = data.price.replace(/\.\s*$/, "").replace(/,/g, "");
    parts.push(`It's priced at ${p} rupees.`);
    if (data.savings) parts.push(`And you'd save ${data.savings} on this purchase.`);
  }

  if (data.ratingValue) {
    const count = data.ratingCount || "several reviews";
    parts.push(`Buyers have given it ${data.ratingValue} out of 5 stars, based on ${count}.`);
  }

  parts.push(`Overall, I'd give this deal a ${insights.dealScore} out of 10. ${insights.dealVerdict}.`);

  if (insights.pros.length > 0) {
    parts.push(`On the bright side: ${insights.pros.slice(0, 3).join(". Also, ")}.`);
  }
  if (insights.cons.length > 0) {
    parts.push(`A few things to keep in mind though: ${insights.cons.slice(0, 3).join(". And, ")}.`);
  }

  if (data.features?.length) {
    const feats = data.features.slice(0, 3).map((f: string) => humanizeTitle(f));
    parts.push(`Some standout features are: ${feats.join(", ")}.`);
  }

  return parts.join(" ");
}

function pickQuickSpecs(data: any): { label: string; value: string }[] {
  if (!data.specs?.length) return [];
  const priorityLabels = [
    "brand", "model", "screen size", "display", "resolution", "processor",
    "ram", "storage", "battery", "weight", "color", "connectivity",
    "refresh rate", "warranty", "material", "power",
  ];
  const scored = data.specs.map((spec: any) => {
    const lower = spec.label.toLowerCase();
    const priority = priorityLabels.findIndex(p => lower.includes(p));
    return { ...spec, priority: priority >= 0 ? priority : 999 };
  });
  return scored.sort((a: any, b: any) => a.priority - b.priority).slice(0, 6).map(({ label, value }: any) => ({ label, value }));
}

// ═══════════════════════════════════════════════════
// Local-only (synchronous) — used as fallback
// ═══════════════════════════════════════════════════

function generateInsightsLocal(data: any): ZenInsights {
  const { pros, cons } = extractProsAndConsLocal(data);
  const { score: dealScore, verdict: dealVerdict } = calculateDealScore(data);
  const summary = buildSummary(data);
  const quickSpecs = pickQuickSpecs(data);
  const partial: ZenInsights = { summary, pros, cons, dealScore, dealVerdict, quickSpecs, starBreakdown: [], sellerVsProduct: "", sellerAdvice: "", newVersionAlert: "", specsExplained: [], chatSuggestions: [], optionsSummary: data.variations?.length ? `Available in ${data.variations.length} variations.` : "No variations available.", ttsScript: "", source: "local" };
  partial.ttsScript = buildTTSScript(data, partial);
  return partial;
}

// ═══════════════════════════════════════════════════
// Main entry point (async — tries backend, falls back to local)
// ═══════════════════════════════════════════════════

export async function generateInsights(data: any): Promise<ZenInsights> {
  const quickSpecs = pickQuickSpecs(data);

  if (isAIAvailable()) {
    try {
      const aiResult: AIInsightsResponse = await callBackendForInsights(data);

      const partial: ZenInsights = {
        summary: aiResult.summary || buildSummary(data),
        pros: aiResult.pros || [],
        cons: aiResult.cons || [],
        dealScore: aiResult.dealScore,
        dealVerdict: aiResult.dealVerdict || "",
        quickSpecs,
        starBreakdown: aiResult.starBreakdown || [],
        sellerVsProduct: aiResult.sellerVsProduct || "",
        sellerAdvice: aiResult.sellerAdvice || "",
        newVersionAlert: aiResult.newVersionAlert || "",
        specsExplained: aiResult.specsExplained || [],
        chatSuggestions: aiResult.chatSuggestions || [],
        optionsSummary: aiResult.optionsSummary || "",
        ttsScript: "",
        source: (aiResult.source || "bedrock") as "bedrock" | "local",
      };
      partial.ttsScript = aiResult.ttsScript || buildTTSScript(data, partial);
      return partial;
    } catch (err) {
      console.warn("[bodhi-leaf] Backend AI failed, falling back to local analysis:", err);
    }
  }

  return generateInsightsLocal(data);
}

export { generateInsightsLocal };
