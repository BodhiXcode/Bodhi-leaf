export interface ZenInsights {
  summary: string;
  pros: string[];
  cons: string[];
  dealScore: number;
  dealVerdict: string;
  quickSpecs: { label: string; value: string }[];
  ttsScript: string;
}

const POSITIVE_SIGNALS = [
  "great", "excellent", "good", "love", "amazing", "perfect", "best",
  "quality", "worth", "recommend", "fantastic", "awesome", "solid",
  "premium", "beautiful", "smooth", "fast", "crisp", "bright",
  "comfortable", "sturdy", "impressive", "reliable", "superb",
  "brilliant", "wonderful", "durable", "happy", "pleased",
  "value for money", "bang for the buck", "no complaints",
];

const NEGATIVE_SIGNALS = [
  "bad", "poor", "worst", "broken", "defective", "cheap", "issue",
  "problem", "disappointed", "waste", "terrible", "horrible", "slow",
  "flimsy", "overpriced", "noisy", "dim", "heavy", "fragile",
  "uncomfortable", "unreliable", "difficult", "lacking", "mediocre",
  "not worth", "regret", "return", "refund", "damage",
];

function extractSentences(text: string): string[] {
  return text
    .split(/[.!?\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 15 && s.length < 200);
}

function scoreSentiment(sentence: string, signals: string[]): number {
  const lower = sentence.toLowerCase();
  return signals.reduce((score, word) => score + (lower.includes(word) ? 1 : 0), 0);
}

function extractProsAndCons(reviews: any[]): { pros: string[]; cons: string[] } {
  const prosMap = new Map<string, number>();
  const consMap = new Map<string, number>();

  for (const review of reviews) {
    const text = `${review.title || ""} ${review.body || ""}`;
    const sentences = extractSentences(text);

    for (const sentence of sentences) {
      const posScore = scoreSentiment(sentence, POSITIVE_SIGNALS);
      const negScore = scoreSentiment(sentence, NEGATIVE_SIGNALS);

      if (posScore > negScore && posScore >= 1) {
        const clean = sentence.replace(/^[\s,;-]+/, "").trim();
        const existing = prosMap.get(clean) || 0;
        prosMap.set(clean, existing + posScore);
      } else if (negScore > posScore && negScore >= 1) {
        const clean = sentence.replace(/^[\s,;-]+/, "").trim();
        const existing = consMap.get(clean) || 0;
        consMap.set(clean, existing + negScore);
      }
    }
  }

  const pros = [...prosMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([text]) => text);

  const cons = [...consMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([text]) => text);

  return { pros, cons };
}

function calculateDealScore(data: any): { score: number; verdict: string } {
  let score = 0;
  const factors: string[] = [];

  // Rating (max 3 points)
  const ratingMatch = data.ratingValue?.match(/([\d.]+)/);
  const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
  if (rating > 0) {
    const ratingPoints = Math.min((rating / 5) * 3, 3);
    score += ratingPoints;
    if (rating >= 4.0) factors.push(`strong ${rating}★ rating`);
    else if (rating >= 3.0) factors.push(`decent ${rating}★ rating`);
    else factors.push(`low ${rating}★ rating`);
  }

  // Savings (max 3 points)
  const savingsMatch = data.savings?.match(/(\d+)/);
  const savingsPct = savingsMatch ? parseInt(savingsMatch[1]) : 0;
  if (savingsPct > 0) {
    const savingsPoints = Math.min((savingsPct / 40) * 3, 3);
    score += savingsPoints;
    factors.push(`${savingsPct}% savings`);
  }

  // Review volume (max 1.5 points)
  const countMatch = data.ratingCount?.match(/([\d,]+)/);
  const reviewCount = countMatch ? parseInt(countMatch[1].replace(/,/g, "")) : 0;
  if (reviewCount > 1000) { score += 1.5; factors.push(`${reviewCount.toLocaleString()}+ reviews`); }
  else if (reviewCount > 200) { score += 1; factors.push(`${reviewCount} reviews`); }
  else if (reviewCount > 50) { score += 0.5; }

  // Coupon/deal bonus (max 1 point)
  if (data.dealBadge) { score += 0.5; factors.push("active deal"); }
  if (data.coupon) { score += 0.5; factors.push("coupon available"); }

  // Availability (max 1 point)
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

export function generateInsights(data: any): ZenInsights {
  const { pros, cons } = extractProsAndCons(data.reviews || []);
  const { score: dealScore, verdict: dealVerdict } = calculateDealScore(data);
  const summary = buildSummary(data);
  const quickSpecs = pickQuickSpecs(data);

  const partial = { summary, pros, cons, dealScore, dealVerdict, quickSpecs, ttsScript: "" };
  const ttsScript = buildTTSScript(data, partial);

  return { ...partial, ttsScript };
}
