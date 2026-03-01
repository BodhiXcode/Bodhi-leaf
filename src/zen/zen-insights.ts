export interface ZenInsights {
  summary: string;
  pros: string[];
  cons: string[];
  dealScore: number;
  dealVerdict: string;
  quickSpecs: { label: string; value: string }[];
  ttsScript: string;
}

// ── Sentiment signals (broad coverage) ──

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

// ── Feature-based insight patterns ──

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

// ── Sentence extraction (more forgiving) ──

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

// ── Core: extract pros and cons from multiple data sources ──

function extractProsAndCons(data: any): { pros: string[]; cons: string[] } {
  const pros: string[] = [];
  const cons: string[] = [];

  // 1) Review-based extraction
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
          if (clean.length > 8) {
            proSentences.set(clean, (proSentences.get(clean) || 0) + posScore);
          }
        } else if (negScore > posScore && negScore >= 1) {
          const clean = sentence.replace(/^[\s,;-]+/, "").trim();
          if (clean.length > 8) {
            conSentences.set(clean, (conSentences.get(clean) || 0) + negScore);
          }
        }
      }

      // Also check review titles directly (they're short but sentiment-rich)
      const title = (review.title || "").trim();
      if (title.length >= 3) {
        const titlePos = scoreSentiment(title, POSITIVE_SIGNALS);
        const titleNeg = scoreSentiment(title, NEGATIVE_SIGNALS);
        if (titlePos > titleNeg && titlePos >= 1) {
          proSentences.set(title, (proSentences.get(title) || 0) + titlePos + 1);
        } else if (titleNeg > titlePos && titleNeg >= 1) {
          conSentences.set(title, (conSentences.get(title) || 0) + titleNeg + 1);
        }
      }
    }

    const sortedPros = [...proSentences.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([text]) => truncateInsight(text));

    const sortedCons = [...conSentences.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([text]) => truncateInsight(text));

    pros.push(...sortedPros);
    cons.push(...sortedCons);
  }

  // 2) Feature-based insights (augment pros with product feature bullets)
  const features: string[] = data.features || [];
  for (const feature of features) {
    for (const [pattern, label] of FEATURE_PRO_PATTERNS) {
      if (pattern.test(feature) && !pros.some(p => p === label)) {
        pros.push(label);
        break;
      }
    }
    if (pros.length >= 6) break;
  }

  // 3) Rating-based insights
  const ratingMatch = data.ratingValue?.match(/([\d.]+)/);
  const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
  const countMatch = data.ratingCount?.match(/([\d,]+)/);
  const reviewCount = countMatch ? parseInt(countMatch[1].replace(/,/g, "")) : 0;

  if (rating >= 4.0 && reviewCount >= 100 && !pros.some(p => /rating|rated|star/i.test(p))) {
    pros.push(`Highly rated at ${rating}/5 across ${reviewCount.toLocaleString()} reviews`);
  } else if (rating < 3.5 && rating > 0 && !cons.some(c => /rating|rated|star/i.test(c))) {
    cons.push(`Below-average rating of ${rating}/5`);
  }

  // Rating histogram analysis
  if (data.ratingBtns?.length > 0) {
    const histogram: { stars: number; pct: number }[] = data.ratingBtns
      .map((btn: any) => {
        const labelMatch = btn.label?.match(/(\d)\s*star/i);
        const pctMatch = btn.pct?.match(/(\d+)/);
        return labelMatch && pctMatch ? { stars: parseInt(labelMatch[1]), pct: parseInt(pctMatch[1]) } : null;
      })
      .filter(Boolean);

    const fiveStar = histogram.find((h: any) => h.stars === 5);
    const oneStar = histogram.find((h: any) => h.stars === 1);

    if (fiveStar && fiveStar.pct >= 60 && !pros.some(p => /majority|5-star/i.test(p))) {
      pros.push(`${fiveStar.pct}% of buyers gave 5 stars`);
    }
    if (oneStar && oneStar.pct >= 20 && !cons.some(c => /1-star|one star/i.test(c))) {
      cons.push(`${oneStar.pct}% of buyers gave only 1 star`);
    }
  }

  // 4) Price/deal-based insights
  const savingsMatch = data.savings?.match(/(\d+)/);
  const savingsPct = savingsMatch ? parseInt(savingsMatch[1]) : 0;
  if (savingsPct >= 30 && !pros.some(p => /discount|saving|off/i.test(p))) {
    pros.push(`${savingsPct}% discount from MRP`);
  }
  if (data.coupon && !pros.some(p => /coupon/i.test(p))) {
    pros.push("Additional coupon available");
  }
  if (data.dealBadge && !pros.some(p => /deal/i.test(p))) {
    pros.push("Currently has an active deal badge");
  }

  // 5) Availability-based insights
  const avail = (data.availability || "").toLowerCase();
  if (avail.includes("out of stock") || avail.includes("unavailable")) {
    cons.push("Currently out of stock");
  } else if (avail.includes("only") && avail.match(/only\s*\d+/i)) {
    cons.push("Limited stock remaining");
  }

  // 6) Seller insight
  if (data.seller) {
    const sellerLower = data.seller.toLowerCase();
    if (sellerLower.includes("amazon") || sellerLower.includes("cloudtail") || sellerLower.includes("appario")) {
      pros.push("Sold by Amazon-affiliated seller");
    }
  }

  return {
    pros: dedupe(pros).slice(0, 6),
    cons: dedupe(cons).slice(0, 5),
  };
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

// ── Deal score ──

function calculateDealScore(data: any): { score: number; verdict: string } {
  let score = 0;
  const factors: string[] = [];

  const ratingMatch = data.ratingValue?.match(/([\d.]+)/);
  const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
  if (rating > 0) {
    const ratingPoints = Math.min((rating / 5) * 3, 3);
    score += ratingPoints;
    if (rating >= 4.0) factors.push(`strong ${rating}★ rating`);
    else if (rating >= 3.0) factors.push(`decent ${rating}★ rating`);
    else factors.push(`low ${rating}★ rating`);
  }

  const savingsMatch = data.savings?.match(/(\d+)/);
  const savingsPct = savingsMatch ? parseInt(savingsMatch[1]) : 0;
  if (savingsPct > 0) {
    const savingsPoints = Math.min((savingsPct / 40) * 3, 3);
    score += savingsPoints;
    factors.push(`${savingsPct}% savings`);
  }

  const countMatch = data.ratingCount?.match(/([\d,]+)/);
  const reviewCount = countMatch ? parseInt(countMatch[1].replace(/,/g, "")) : 0;
  if (reviewCount > 1000) { score += 1.5; factors.push(`${reviewCount.toLocaleString()} reviews`); }
  else if (reviewCount > 200) { score += 1; factors.push(`${reviewCount} reviews`); }
  else if (reviewCount > 50) { score += 0.5; }

  if (data.dealBadge) { score += 0.5; factors.push("active deal"); }
  if (data.coupon) { score += 0.5; factors.push("coupon available"); }

  const avail = (data.availability || "").toLowerCase();
  if (avail.includes("in stock") || avail.includes("available")) {
    score += 1;
  } else if (avail.includes("out of stock") || avail.includes("unavailable")) {
    score -= 1;
    factors.push("out of stock");
  }

  score = Math.round(Math.min(Math.max(score, 0), 10) * 10) / 10;

  let verdict: string;
  if (score >= 8) verdict = `Excellent deal — ${factors.slice(0, 3).join(", ")}`;
  else if (score >= 6) verdict = `Good deal — ${factors.slice(0, 3).join(", ")}`;
  else if (score >= 4) verdict = `Fair deal — ${factors.slice(0, 3).join(", ")}`;
  else verdict = `Below average — ${factors.slice(0, 3).join(", ")}`;

  return { score, verdict };
}

// ── Summary and TTS ──

function buildSummary(data: any): string {
  const parts: string[] = [];
  if (data.title) parts.push(data.title);
  if (data.brand) {
    const brand = data.brand.replace(/^Visit the\s+/i, "").replace(/\s+Store$/i, "").replace(/^Brand:\s*/i, "");
    if (brand) parts.push(`by ${brand}`);
  }
  if (data.price) {
    const price = data.price.replace(/\.\s*$/, "");
    parts.push(`priced at ₹${price}`);
  }
  if (data.savings) parts.push(`with ${data.savings} off`);
  if (data.ratingValue) parts.push(`rated ${data.ratingValue}`);
  if (data.ratingCount) parts.push(`based on ${data.ratingCount}`);
  return parts.join(", ") + ".";
}

function buildTTSScript(data: any, insights: Omit<ZenInsights, "ttsScript">): string {
  const parts: string[] = [];

  parts.push(`Product: ${data.title || "Unknown product"}.`);

  if (data.price) {
    const price = data.price.replace(/\.\s*$/, "");
    parts.push(`Price: ${price} rupees.`);
    if (data.savings) parts.push(`You save ${data.savings}.`);
  }

  if (data.ratingValue) {
    parts.push(`Rating: ${data.ratingValue}, from ${data.ratingCount || "unknown number of reviews"}.`);
  }

  parts.push(`Deal score: ${insights.dealScore} out of 10. ${insights.dealVerdict}.`);

  if (insights.pros.length > 0) {
    parts.push(`Top pros: ${insights.pros.slice(0, 3).join(". ")}.`);
  }
  if (insights.cons.length > 0) {
    parts.push(`Things to consider: ${insights.cons.slice(0, 3).join(". ")}.`);
  }

  if (data.features?.length) {
    parts.push(`Key features include: ${data.features.slice(0, 4).join(", ")}.`);
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

  return scored
    .sort((a: any, b: any) => a.priority - b.priority)
    .slice(0, 6)
    .map(({ label, value }: any) => ({ label, value }));
}

// ── Main entry point ──

export function generateInsights(data: any): ZenInsights {
  const { pros, cons } = extractProsAndCons(data);
  const { score: dealScore, verdict: dealVerdict } = calculateDealScore(data);
  const summary = buildSummary(data);
  const quickSpecs = pickQuickSpecs(data);

  const partial = { summary, pros, cons, dealScore, dealVerdict, quickSpecs, ttsScript: "" };
  const ttsScript = buildTTSScript(data, partial);

  return { ...partial, ttsScript };
}
