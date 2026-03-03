import type { ZenInsights } from "./zen-insights";
import { callBackendForTTS, isAIAvailable } from "../config/ai";

function getZenCSS(): string {
  return `
  #bodhi-zen-backdrop {
    position: fixed;
    inset: 0;
    z-index: 2147483646;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    animation: bzFadeIn 0.3s ease-out forwards;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  #bodhi-zen-backdrop.bz-closing {
    animation: bzFadeOut 0.25s ease-in forwards;
  }
  @keyframes bzFadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes bzFadeOut { from { opacity: 1; } to { opacity: 0; } }

  #bodhi-zen-panel {
    position: relative;
    width: 520px;
    max-width: 96vw;
    max-height: 88vh;
    background: linear-gradient(145deg, #0e0e15, #0a0a10);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    box-shadow: 0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), 0 0 60px rgba(0,230,200,0.03);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: bzSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #f0f0f5;
    font-size: 13px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }
  @keyframes bzSlideUp {
    from { opacity: 0; transform: translateY(30px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* ── Header ── */
  .bz-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    background: rgba(255,255,255,0.03);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    cursor: grab;
    user-select: none;
    flex-shrink: 0;
  }
  .bz-header:active { cursor: grabbing; }
  .bz-header-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: -0.3px;
  }
  .bz-header-title img {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    object-fit: contain;
  }
  .bz-header-badge {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: #00e6c8;
    background: rgba(0,230,200,0.1);
    padding: 2px 8px;
    border-radius: 100px;
  }
  .bz-header-actions { display: flex; gap: 4px; }
  .bz-header-actions button {
    width: 30px;
    height: 30px;
    border: none;
    border-radius: 8px;
    background: rgba(255,255,255,0.06);
    color: #a0a0ab;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    padding: 0;
  }
  .bz-header-actions button svg { width: 14px; height: 14px; }
  .bz-header-actions button:hover {
    background: rgba(255,255,255,0.12);
    color: #f0f0f5;
  }
  .bz-header-actions button:hover svg { stroke: #f0f0f5; }
  .bz-btn-close:hover { background: rgba(255,69,58,0.15) !important; }
  .bz-btn-close:hover svg { stroke: #ff453a !important; }

  /* ── Content ── */
  .bz-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .bz-content::-webkit-scrollbar { width: 3px; }
  .bz-content::-webkit-scrollbar-track { background: transparent; }
  .bz-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }

  /* ── Sections ── */
  .bz-section {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 14px;
    padding: 16px;
  }
  .bz-section-title {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: #5c5c66;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .bz-section-title svg { flex-shrink: 0; }
  .bz-tts-loading-label {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.3px;
    color: #666;
    margin-left: auto;
    text-transform: none;
  }

  /* ── Product Summary ── */
  .bz-product {
    display: flex;
    gap: 14px;
    align-items: flex-start;
  }
  .bz-product-img {
    width: 72px;
    height: 72px;
    object-fit: contain;
    border-radius: 10px;
    background: #161620;
    flex-shrink: 0;
  }
  .bz-product-info { min-width: 0; flex: 1; }
  .bz-product-title {
    font-size: 14px;
    font-weight: 700;
    line-height: 1.3;
    color: #f0f0f5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 4px;
  }
  .bz-product-meta {
    font-size: 12px;
    color: #a0a0ab;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 6px;
  }
  .bz-product-meta .bz-stars { color: #f5a623; }
  .bz-product-price {
    font-size: 20px;
    font-weight: 800;
    color: #00e6c8;
    letter-spacing: -0.5px;
  }
  .bz-product-savings {
    font-size: 11px;
    font-weight: 700;
    color: #34c759;
    background: rgba(52,199,89,0.1);
    padding: 1px 7px;
    border-radius: 100px;
    margin-left: 8px;
  }

  /* ── TTS ── */
  .bz-tts-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }
  .bz-tts-toggle {
    width: 36px;
    height: 36px;
    border: none !important;
    border-radius: 50%;
    background: rgba(0,230,200,0.12);
    color: #00e6c8;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    flex-shrink: 0;
    padding: 0;
  }
  .bz-tts-toggle svg { width: 16px; height: 16px; }
  .bz-tts-toggle .bz-icon-pause { display: none; }
  .bz-tts-toggle .bz-icon-play { display: block; }
  .bz-tts-toggle.bz-playing { background: rgba(0,230,200,0.2); }
  .bz-tts-toggle.bz-playing .bz-icon-pause { display: block; }
  .bz-tts-toggle.bz-playing .bz-icon-play { display: none; }
  .bz-tts-toggle:hover { background: rgba(0,230,200,0.22); transform: scale(1.05); }
  .bz-tts-stop {
    width: 28px;
    height: 28px;
    border: none !important;
    border-radius: 8px;
    background: rgba(255,255,255,0.05);
    color: #5c5c66;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    flex-shrink: 0;
    padding: 0;
  }
  .bz-tts-stop svg { width: 12px; height: 12px; }
  .bz-tts-stop:hover { background: rgba(255,255,255,0.1); color: #a0a0ab; }
  .bz-tts-stop:hover svg { stroke: #a0a0ab; }
  .bz-tts-progress-inline {
    flex: 1;
    height: 4px;
    background: rgba(255,255,255,0.06);
    border-radius: 2px;
    overflow: hidden;
    position: relative;
  }
  .bz-tts-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #00e6c8, #00c4aa);
    border-radius: 2px;
    width: 0%;
    transition: width 0.3s;
  }
  .bz-tts-speed {
    width: auto;
    flex: 0 0 auto;
    background: rgba(255,255,255,0.05);
    border: none !important;
    border-radius: 6px;
    color: #5c5c66;
    font-family: inherit;
    font-size: 11px;
    font-weight: 600;
    padding: 4px 6px;
    cursor: pointer;
    outline: none !important;
    -webkit-appearance: none;
    appearance: none;
    text-align: center;
  }
  .bz-tts-speed:hover { background: rgba(255,255,255,0.1); color: #a0a0ab; }
  .bz-tts-speed option { background: #1a1a24; color: #a0a0ab; }

  /* ── Deal Score ── */
  .bz-deal-score {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
    padding: 12px 14px;
    background: rgba(255,255,255,0.02);
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.04);
  }
  .bz-score-ring {
    width: 52px;
    height: 52px;
    position: relative;
    flex-shrink: 0;
  }
  .bz-score-ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
  .bz-score-ring-bg { fill: none; stroke: rgba(255,255,255,0.06); stroke-width: 4; }
  .bz-score-ring-fill { fill: none; stroke-width: 4; stroke-linecap: round; transition: stroke-dashoffset 1s ease-out; }
  .bz-score-number {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    font-weight: 800;
    color: #f0f0f5;
  }
  .bz-score-info { min-width: 0; }
  .bz-score-label {
    font-size: 12px;
    font-weight: 700;
    color: #a0a0ab;
    margin-bottom: 2px;
  }
  .bz-score-verdict {
    font-size: 12px;
    color: #5c5c66;
    line-height: 1.4;
  }

  /* ── Pros/Cons ── */
  .bz-pros-cons {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .bz-pc-group-title {
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .bz-pc-group-title.bz-pro { color: #34c759; }
  .bz-pc-group-title.bz-con { color: #ff453a; }
  .bz-pc-list {
    list-style: none !important;
    list-style-type: none !important;
    padding: 0 !important;
    margin: 0 !important;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .bz-pc-list li {
    list-style: none !important;
    list-style-type: none !important;
    font-size: 12px;
    color: #a0a0ab;
    line-height: 1.5;
    padding-left: 14px !important;
    position: relative;
    margin: 0 !important;
  }
  .bz-pc-list li::before {
    content: '' !important;
    position: absolute;
    left: 0;
    top: 6px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
  }
  .bz-pc-list li::marker { content: none !important; font-size: 0 !important; }
  .bz-pros .bz-pc-list li::before { background: #34c759; }
  .bz-cons .bz-pc-list li::before { background: #ff453a; opacity: 0.6; }
  .bz-no-data {
    font-size: 12px;
    color: #5c5c66;
    font-style: italic;
  }

  /* ── Quick Specs ── */
  .bz-specs-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .bz-spec-item {
    background: rgba(255,255,255,0.02);
    border-radius: 8px;
    padding: 8px 10px;
  }
  .bz-spec-label {
    font-size: 10px;
    font-weight: 600;
    color: #5c5c66;
    letter-spacing: 0.3px;
    text-transform: uppercase;
    margin-bottom: 2px;
  }
  .bz-spec-value {
    font-size: 12px;
    font-weight: 600;
    color: #f0f0f5;
    word-break: break-word;
  }

  /* ── Star Breakdown ── */
  .bz-star-breakdown { display: flex; flex-direction: column; gap: 6px; }
  .bz-star-row {
    display: grid;
    grid-template-columns: 28px 1fr 32px;
    align-items: center;
    gap: 8px;
    font-size: 11px;
  }
  .bz-star-label { color: #f5a623; font-weight: 600; text-align: right; }
  .bz-star-bar { height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
  .bz-star-bar-fill { height: 100%; border-radius: 3px; transition: width 0.6s ease-out; }
  .bz-star-pct { color: #5c5c66; font-weight: 600; font-size: 10px; }
  .bz-star-issue {
    grid-column: 1 / -1;
    font-size: 10px;
    color: #5c5c66;
    padding-left: 36px;
    line-height: 1.3;
    margin-top: -2px;
  }

  /* ── Seller Analysis ── */
  .bz-seller-badge {
    display: inline-block;
    font-size: 11px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 6px;
    margin-bottom: 8px;
  }
  .bz-seller-seller-issue { background: rgba(255,69,58,0.12); color: #ff6b6b; }
  .bz-seller-product-issue { background: rgba(245,166,35,0.12); color: #f5a623; }
  .bz-seller-both { background: rgba(255,69,58,0.12); color: #ff6b6b; }
  .bz-seller-no-issues { background: rgba(52,199,89,0.12); color: #34c759; }
  .bz-seller-advice { font-size: 12px; color: #a0a0ab; line-height: 1.5; }

  /* ── New Version Alert ── */
  .bz-alert-section { border-color: rgba(245,166,35,0.15) !important; }
  .bz-alert-text { font-size: 12px; color: #f5a623; line-height: 1.5; }

  /* ── Preference Quiz ── */
  .bz-quiz-cards { display: flex; flex-direction: column; gap: 8px; }
  .bz-quiz-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px;
    padding: 12px 14px;
    animation: bzSlideIn 0.3s ease-out forwards;
    opacity: 0;
  }
  @keyframes bzSlideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
  .bz-quiz-question {
    font-size: 12px;
    font-weight: 600;
    color: #f0f0f5;
    margin-bottom: 8px;
  }
  .bz-quiz-options { display: flex; flex-wrap: wrap; gap: 6px; }
  .bz-quiz-opt {
    font-size: 11px;
    padding: 5px 12px;
    border-radius: 100px;
    border: 1px solid rgba(255,255,255,0.1) !important;
    background: rgba(255,255,255,0.04);
    color: #a0a0ab;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
  }
  .bz-quiz-opt:hover { background: rgba(0,230,200,0.08); border-color: rgba(0,230,200,0.2) !important; color: #f0f0f5; }
  .bz-quiz-opt.bz-selected {
    background: rgba(0,230,200,0.15);
    border-color: rgba(0,230,200,0.3) !important;
    color: #00e6c8;
    font-weight: 600;
  }

  /* ── Usefulness Graph ── */
  .bz-quiz-result { margin-top: 12px; }
  .bz-quiz-score-title { font-size: 12px; font-weight: 700; color: #a0a0ab; margin-bottom: 10px; }
  .bz-quiz-graph { display: flex; flex-direction: column; gap: 6px; }
  .bz-graph-row {
    display: grid;
    grid-template-columns: 80px 1fr 36px;
    align-items: center;
    gap: 8px;
    font-size: 11px;
  }
  .bz-graph-label { color: #a0a0ab; font-weight: 500; text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bz-graph-bar { height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; }
  .bz-graph-bar-fill { height: 100%; border-radius: 4px; transition: width 0.8s ease-out; }
  .bz-graph-pct { color: #f0f0f5; font-weight: 700; font-size: 12px; }
  .bz-match-overall {
    margin-top: 10px;
    padding: 10px 14px;
    background: rgba(255,255,255,0.03);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid rgba(255,255,255,0.05);
  }
  .bz-match-label { font-size: 12px; font-weight: 600; color: #a0a0ab; }
  .bz-match-value { font-size: 20px; font-weight: 800; }

  /* ── Minimized state ── */
  #bodhi-zen-panel.bz-minimized .bz-content { display: none; }
  #bodhi-zen-panel.bz-minimized { max-height: none; }
  `;
}

function buildZenOverlay(data: any, insights: any, iconUrl?: string, ttsAudioUrl?: string) {
  // ── Quiz helpers (must be inside buildZenOverlay for MAIN world execution) ──

  function detectCategory(d: any): string {
    const text = `${d.title || ""} ${(d.features || []).join(" ")}`.toLowerCase();
    if (/phone|smartphone|mobile/i.test(text)) return "phone";
    if (/laptop|notebook|macbook|chromebook/i.test(text)) return "laptop";
    if (/monitor|display|screen/i.test(text)) return "monitor";
    if (/headphone|earphone|earbuds|headset|tws/i.test(text)) return "audio";
    if (/camera|dslr|mirrorless|gopro/i.test(text)) return "camera";
    if (/tv|television|smart tv/i.test(text)) return "tv";
    if (/watch|smartwatch|fitness band/i.test(text)) return "wearable";
    if (/tablet|ipad/i.test(text)) return "tablet";
    if (/keyboard|mouse|gaming/i.test(text)) return "peripherals";
    return "general";
  }

  function getQuizQuestions(category: string) {
    const common = [
      { id: "budget", question: "What's your budget priority?", options: [
        { label: "Cheapest possible", value: "low" },
        { label: "Best value", value: "mid" },
        { label: "Premium, price no bar", value: "high" },
      ]},
      { id: "usage", question: "How often will you use this?", options: [
        { label: "Daily", value: "daily" },
        { label: "Few times a week", value: "weekly" },
        { label: "Occasionally", value: "occasional" },
      ]},
      { id: "brand", question: "How important is brand reputation?", options: [
        { label: "Very important", value: "high" },
        { label: "Somewhat", value: "mid" },
        { label: "Don't care", value: "low" },
      ]},
    ];

    const categoryQuestions: Record<string, any[]> = {
      phone: [{ id: "phone_use", question: "Primary use?", options: [
        { label: "Camera & social media", value: "camera" },
        { label: "Gaming", value: "gaming" },
        { label: "Calls & basic apps", value: "basic" },
      ]}],
      laptop: [{ id: "laptop_use", question: "Primary use?", options: [
        { label: "Work / coding", value: "work" },
        { label: "Gaming", value: "gaming" },
        { label: "Browsing & media", value: "casual" },
      ]}],
      monitor: [{ id: "monitor_use", question: "Primary use?", options: [
        { label: "Work / productivity", value: "work" },
        { label: "Gaming", value: "gaming" },
        { label: "Content creation", value: "creative" },
      ]}],
      audio: [{ id: "audio_use", question: "Primary use?", options: [
        { label: "Music", value: "music" },
        { label: "Calls / meetings", value: "calls" },
        { label: "Gaming", value: "gaming" },
      ]}],
      general: [{ id: "durability", question: "How important is durability?", options: [
        { label: "Must last years", value: "high" },
        { label: "Decent lifespan", value: "mid" },
        { label: "Short-term use", value: "low" },
      ]}],
    };

    return [...common, ...(categoryQuestions[category] || categoryQuestions.general)];
  }

  function computeMatchScores(d: any, ins: any, answers: Record<string, string>) {
    const scores: { label: string; score: number }[] = [];

    const savingsMatch = (d.savings || "").match(/(\d+)/);
    const savingsPct = savingsMatch ? parseInt(savingsMatch[1]) : 0;
    let valueScore = 40;
    if (answers.budget === "low") valueScore = savingsPct >= 30 ? 90 : savingsPct >= 15 ? 60 : 30;
    else if (answers.budget === "mid") valueScore = savingsPct >= 15 ? 85 : 55;
    else valueScore = 75;
    if (d.coupon) valueScore = Math.min(100, valueScore + 10);
    scores.push({ label: "Value for Money", score: Math.min(100, valueScore) });

    const ratingMatch = (d.ratingValue || "").match(/([\d.]+)/);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
    const ratingScore = rating > 0 ? Math.min(100, (rating / 5) * 100) : 50;
    scores.push({ label: "Rating Quality", score: ratingScore });

    const brandScore = (() => {
      if (answers.brand === "low") return 80;
      const seller = (d.seller || "").toLowerCase();
      const trusted = seller.includes("amazon") || seller.includes("cloudtail") || seller.includes("appario");
      if (answers.brand === "high") return trusted ? 90 : 50;
      return trusted ? 80 : 60;
    })();
    scores.push({ label: "Brand Trust", score: brandScore });

    const usageScore = (() => {
      if (answers.usage === "daily") return rating >= 4 ? 85 : 55;
      if (answers.usage === "weekly") return rating >= 3.5 ? 80 : 60;
      return 75;
    })();
    scores.push({ label: "Usage Fit", score: usageScore });

    const prosCount = (ins.pros || []).length;
    const consCount = (ins.cons || []).length;
    const sentimentScore = prosCount + consCount > 0
      ? Math.min(100, Math.round((prosCount / (prosCount + consCount)) * 100))
      : 50;
    scores.push({ label: "Review Sentiment", score: sentimentScore });

    return scores;
  }
  if (document.getElementById("bodhi-zen-backdrop")) return;

  const esc = (s: string) => {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  };

  const ratingMatch = data.ratingValue?.match(/([\d.]+)/);
  const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.3;
  let starsHtml = "";
  for (let i = 0; i < fullStars; i++) starsHtml += "★";
  if (hasHalf) starsHtml += "★";
  for (let i = 0; i < 5 - fullStars - (hasHalf ? 1 : 0); i++) starsHtml += "☆";

  const cleanPrice = (data.price || "").replace(/\.\s*$/, "");
  const fraction = data.priceFraction ? `.${data.priceFraction}` : "";
  const priceStr = cleanPrice ? `₹${cleanPrice}${fraction}` : "";

  const brand = (data.brand || "")
    .replace(/^Visit the\s+/i, "")
    .replace(/\s+Store$/i, "")
    .replace(/^Brand:\s*/i, "")
    .trim();

  // Deal score ring
  const circumference = 2 * Math.PI * 20;
  const scoreColor = insights.dealScore >= 7 ? "#34c759"
    : insights.dealScore >= 4 ? "#f5a623" : "#ff453a";
  const dashOffset = circumference - (insights.dealScore / 10) * circumference;

  const prosHtml = insights.pros.length > 0
    ? `<ul class="bz-pc-list">${insights.pros.map((p: string) => `<li>${esc(p)}</li>`).join("")}</ul>`
    : `<div class="bz-no-data">Not enough review data</div>`;
  const consHtml = insights.cons.length > 0
    ? `<ul class="bz-pc-list">${insights.cons.map((c: string) => `<li>${esc(c)}</li>`).join("")}</ul>`
    : `<div class="bz-no-data">Not enough review data</div>`;

  const specsHtml = insights.quickSpecs.length > 0
    ? insights.quickSpecs.map((s: any) =>
      `<div class="bz-spec-item"><div class="bz-spec-label">${esc(s.label)}</div><div class="bz-spec-value">${esc(s.value)}</div></div>`
    ).join("")
    : `<div class="bz-no-data">No specs available</div>`;

  // Build DOM
  const backdrop = document.createElement("div");
  backdrop.id = "bodhi-zen-backdrop";

  backdrop.innerHTML = `
    <div id="bodhi-zen-panel">
      <div class="bz-header">
        <div class="bz-header-title">
          ${iconUrl ? `<img src="${esc(iconUrl)}" alt="Bodhi Leaf" />` : ""} Zen Mode
          <span class="bz-header-badge">AI</span>
        </div>
        <div class="bz-header-actions">
          <button class="bz-btn-minimize" title="Minimize"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg></button>
          <button class="bz-btn-close" title="Close"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
      </div>
      <div class="bz-content">
        <!-- Product Summary -->
        <div class="bz-section bz-product">
          ${data.mainImage ? `<img class="bz-product-img" src="${esc(data.mainImage)}" alt="Product" />` : ""}
          <div class="bz-product-info">
            <div class="bz-product-title">${esc(data.title || "Unknown Product")}</div>
            <div class="bz-product-meta">
              ${brand ? `<span>${esc(brand)}</span><span>·</span>` : ""}
              ${rating > 0 ? `<span class="bz-stars">${starsHtml}</span><span>${rating.toFixed(1)}</span>` : ""}
              ${data.ratingCount ? `<span>·</span><span>${esc(data.ratingCount)}</span>` : ""}
            </div>
            <div>
              <span class="bz-product-price">${esc(priceStr)}</span>
              ${data.savings ? `<span class="bz-product-savings">${esc(data.savings)}</span>` : ""}
            </div>
          </div>
        </div>

        <!-- TTS -->
        <div class="bz-section">
          <div class="bz-section-title"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00e6c8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg> Read Aloud <span class="bz-tts-loading-label">${ttsAudioUrl ? "Ready" : "Loading voice…"}</span></div>
          <div class="bz-tts-controls">
            <button class="bz-tts-toggle" title="Play / Pause">
              <svg class="bz-icon-play" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="6,4 20,12 6,20"/></svg>
              <svg class="bz-icon-pause" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
            </button>
            <button class="bz-tts-stop" title="Stop"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="6" width="12" height="12" rx="2"/></svg></button>
            <div class="bz-tts-progress-inline"><div class="bz-tts-progress-fill"></div></div>
            <select class="bz-tts-speed">
              <option value="0.75">0.75×</option>
              <option value="1" selected>1×</option>
              <option value="1.25">1.25×</option>
              <option value="1.5">1.5×</option>
              <option value="2">2×</option>
            </select>
          </div>
        </div>

        <!-- AI Insights -->
        <div class="bz-section">
          <div class="bz-section-title"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00e6c8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93"/><path d="M8 6a4 4 0 0 1 3.25 1.93"/><circle cx="12" cy="14" r="4"/><path d="M12 18v4"/><path d="M8 22h8"/></svg> AI Insights</div>
          <div class="bz-deal-score">
            <div class="bz-score-ring">
              <svg viewBox="0 0 44 44">
                <circle class="bz-score-ring-bg" cx="22" cy="22" r="20"/>
                <circle class="bz-score-ring-fill" cx="22" cy="22" r="20"
                  stroke="${scoreColor}"
                  stroke-dasharray="${circumference}"
                  stroke-dashoffset="${dashOffset}"/>
              </svg>
              <div class="bz-score-number">${insights.dealScore}</div>
            </div>
            <div class="bz-score-info">
              <div class="bz-score-label">Deal Score</div>
              <div class="bz-score-verdict">${esc(insights.dealVerdict)}</div>
            </div>
          </div>
          <div class="bz-pros-cons">
            <div class="bz-pros">
              <div class="bz-pc-group-title bz-pro"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34c759" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Pros</div>
              ${prosHtml}
            </div>
            <div class="bz-cons">
              <div class="bz-pc-group-title bz-con"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff453a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> Cons</div>
              ${consHtml}
            </div>
          </div>
        </div>

        <!-- Star Breakdown -->
        ${insights.starBreakdown && insights.starBreakdown.length > 0 ? `
        <div class="bz-section">
          <div class="bz-section-title"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00e6c8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Rating Breakdown</div>
          <div class="bz-star-breakdown">
            ${[5,4,3,2,1].map(s => {
              const sb = insights.starBreakdown.find((x: any) => x.star === s);
              const pct = sb ? sb.pct : 0;
              const issue = sb ? sb.topIssue : "";
              const barColor = s >= 4 ? "#34c759" : s === 3 ? "#f5a623" : "#ff453a";
              return `<div class="bz-star-row">
                <span class="bz-star-label">${s}★</span>
                <div class="bz-star-bar"><div class="bz-star-bar-fill" style="width:${pct}%;background:${barColor}"></div></div>
                <span class="bz-star-pct">${pct}%</span>
                ${issue ? `<span class="bz-star-issue">${esc(issue)}</span>` : ""}
              </div>`;
            }).join("")}
          </div>
        </div>` : ""}

        <!-- Seller Analysis -->
        ${insights.sellerVsProduct || insights.sellerAdvice ? `
        <div class="bz-section bz-seller-section">
          <div class="bz-section-title"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00e6c8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Seller Analysis</div>
          ${insights.sellerVsProduct ? `<div class="bz-seller-badge bz-seller-${insights.sellerVsProduct.replace(/_/g, "-")}">${
            insights.sellerVsProduct === "seller_issue" ? "Seller-related issues detected" :
            insights.sellerVsProduct === "product_issue" ? "Product-related issues" :
            insights.sellerVsProduct === "both" ? "Both seller & product issues" :
            "No major issues found"
          }</div>` : ""}
          ${insights.sellerAdvice ? `<div class="bz-seller-advice">${esc(insights.sellerAdvice)}</div>` : ""}
        </div>` : ""}

        <!-- New Version Alert -->
        ${insights.newVersionAlert ? `
        <div class="bz-section bz-alert-section">
          <div class="bz-section-title"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f5a623" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Heads Up</div>
          <div class="bz-alert-text">${esc(insights.newVersionAlert)}</div>
        </div>` : ""}

        <!-- Preference Quiz -->
        <div class="bz-section bz-quiz-section">
          <div class="bz-section-title"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00e6c8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg> Is this right for you?</div>
          <div class="bz-quiz-cards"></div>
          <div class="bz-quiz-result" style="display:none">
            <div class="bz-quiz-score-title">Your Match Score</div>
            <div class="bz-quiz-graph"></div>
          </div>
        </div>

        <!-- Quick Specs -->
        ${insights.quickSpecs.length > 0 ? `
        <div class="bz-section">
          <div class="bz-section-title"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00e6c8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/></svg> Quick Specs</div>
          <div class="bz-specs-grid">${specsHtml}</div>
        </div>` : ""}
      </div>
    </div>
  `;

  document.documentElement.appendChild(backdrop);

  // ── Event handlers ──
  const panel = document.getElementById("bodhi-zen-panel")!;
  const closeBtn = backdrop.querySelector(".bz-btn-close")!;
  const minimizeBtn = backdrop.querySelector(".bz-btn-minimize")!;

  closeBtn.addEventListener("click", () => {
    backdrop.classList.add("bz-closing");
    setTimeout(() => backdrop.remove(), 250);
  });

  const minSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>';
  const maxSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>';
  minimizeBtn.addEventListener("click", () => {
    panel.classList.toggle("bz-minimized");
    (minimizeBtn as HTMLElement).innerHTML = panel.classList.contains("bz-minimized") ? maxSvg : minSvg;
  });

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) {
      backdrop.classList.add("bz-closing");
      setTimeout(() => backdrop.remove(), 250);
    }
  });

  // ── Drag ──
  const header = backdrop.querySelector(".bz-header") as HTMLElement;
  let isDragging = false;
  let dragX = 0, dragY = 0;
  let panelX = 0, panelY = 0;

  header.addEventListener("mousedown", (e: MouseEvent) => {
    if ((e.target as HTMLElement).tagName === "BUTTON") return;
    isDragging = true;
    dragX = e.clientX - panelX;
    dragY = e.clientY - panelY;
    header.style.cursor = "grabbing";
  });

  document.addEventListener("mousemove", (e: MouseEvent) => {
    if (!isDragging) return;
    panelX = e.clientX - dragX;
    panelY = e.clientY - dragY;
    panel.style.transform = `translate(${panelX}px, ${panelY}px)`;
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
    header.style.cursor = "grab";
  });

  // ── TTS (single toggle button, Polly with browser fallback) ──
  const ttsScript = insights.ttsScript || "";
  const toggleBtn = backdrop.querySelector(".bz-tts-toggle") as HTMLElement;
  const stopBtn = backdrop.querySelector(".bz-tts-stop") as HTMLElement;
  const speedSelect = backdrop.querySelector(".bz-tts-speed") as HTMLSelectElement;
  const progressFill = backdrop.querySelector(".bz-tts-progress-fill") as HTMLElement;
  let isPlaying = false;

  function getPollyAudio(): HTMLAudioElement | null {
    return (window as any).__bodhiPollyAudio || null;
  }

  function hasPolly(): boolean {
    return toggleBtn?.getAttribute("data-polly") === "true" && !!getPollyAudio();
  }

  function setPlaying(state: boolean) {
    isPlaying = state;
    if (state) toggleBtn.classList.add("bz-playing");
    else toggleBtn.classList.remove("bz-playing");
  }

  function startBrowserTTS() {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(ttsScript);
    utterance.rate = parseFloat(speedSelect.value);
    utterance.lang = "en-IN";
    utterance.onstart = () => { setPlaying(true); progressFill.style.width = "0%"; };
    utterance.onend = () => { setPlaying(false); progressFill.style.width = "100%"; };
    utterance.onboundary = (e: SpeechSynthesisEvent) => {
      if (ttsScript.length > 0) progressFill.style.width = `${Math.min(100, (e.charIndex / ttsScript.length) * 100)}%`;
    };
    window.speechSynthesis.speak(utterance);
  }

  toggleBtn.addEventListener("click", () => {
    if (hasPolly()) {
      const audio = getPollyAudio()!;
      if (audio.paused) { audio.playbackRate = parseFloat(speedSelect.value); audio.play(); }
      else { audio.pause(); }
    } else {
      if (window.speechSynthesis.paused) { window.speechSynthesis.resume(); setPlaying(true); }
      else if (window.speechSynthesis.speaking) { window.speechSynthesis.pause(); setPlaying(false); }
      else { startBrowserTTS(); }
    }
  });

  stopBtn.addEventListener("click", () => {
    if (hasPolly()) { const a = getPollyAudio()!; a.pause(); a.currentTime = 0; }
    else { window.speechSynthesis.cancel(); }
    setPlaying(false);
    progressFill.style.width = "0%";
  });

  speedSelect.addEventListener("change", () => {
    if (hasPolly() && !getPollyAudio()!.paused) { getPollyAudio()!.playbackRate = parseFloat(speedSelect.value); }
    else if (window.speechSynthesis.speaking) { startBrowserTTS(); }
  });

  // ── Preference Quiz (flash-card MCQ) ──
  const quizContainer = backdrop.querySelector(".bz-quiz-cards") as HTMLElement;
  const quizResult = backdrop.querySelector(".bz-quiz-result") as HTMLElement;
  const quizGraph = backdrop.querySelector(".bz-quiz-graph") as HTMLElement;
  if (quizContainer) {
    const category = detectCategory(data);
    const questions = getQuizQuestions(category);
    const answers: Record<string, string> = {};
    const STORAGE_KEY = "__bodhiPrefs";

    const saved = (() => {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
    })();

    let hasSavedPrefs = Object.keys(saved).length >= questions.length;

    if (hasSavedPrefs) {
      Object.assign(answers, saved);
      showGraph();
    } else {
      showQuestion(0);
    }

    function showQuestion(idx: number) {
      if (idx >= questions.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
        showGraph();
        return;
      }
      const q = questions[idx];
      if (saved[q.id]) {
        answers[q.id] = saved[q.id];
        showQuestion(idx + 1);
        return;
      }
      const card = document.createElement("div");
      card.className = "bz-quiz-card";
      card.style.animationDelay = `${idx * 0.05}s`;
      card.innerHTML = `
        <div class="bz-quiz-question">${q.question}</div>
        <div class="bz-quiz-options">
          ${q.options.map((o: any) => `<button class="bz-quiz-opt" data-value="${o.value}">${o.label}</button>`).join("")}
        </div>
      `;
      quizContainer.innerHTML = "";
      quizContainer.appendChild(card);
      card.querySelectorAll(".bz-quiz-opt").forEach(btn => {
        btn.addEventListener("click", () => {
          answers[q.id] = (btn as HTMLElement).getAttribute("data-value") || "";
          card.querySelectorAll(".bz-quiz-opt").forEach(b => b.classList.remove("bz-selected"));
          btn.classList.add("bz-selected");
          setTimeout(() => showQuestion(idx + 1), 300);
        });
      });
    }

    function showGraph() {
      quizContainer.style.display = "none";
      quizResult.style.display = "block";

      const scores = computeMatchScores(data, insights, answers);
      let overallSum = 0, count = 0;
      let graphHtml = "";
      for (const s of scores) {
        const pct = Math.round(s.score);
        overallSum += pct;
        count++;
        const color = pct >= 70 ? "#34c759" : pct >= 40 ? "#f5a623" : "#ff453a";
        graphHtml += `<div class="bz-graph-row">
          <span class="bz-graph-label">${s.label}</span>
          <div class="bz-graph-bar"><div class="bz-graph-bar-fill" style="width:${pct}%;background:${color}"></div></div>
          <span class="bz-graph-pct" style="color:${color}">${pct}%</span>
        </div>`;
      }
      const overall = count > 0 ? Math.round(overallSum / count) : 0;
      const overallColor = overall >= 70 ? "#34c759" : overall >= 40 ? "#f5a623" : "#ff453a";
      graphHtml += `<div class="bz-match-overall">
        <span class="bz-match-label">Overall Match</span>
        <span class="bz-match-value" style="color:${overallColor}">${overall}%</span>
      </div>`;
      quizGraph.innerHTML = graphHtml;
    }
  }
}

function injectPollyAudio(audioUrl: string) {
  const backdrop = document.getElementById("bodhi-zen-backdrop");
  if (!backdrop) return;

  const label = backdrop.querySelector(".bz-tts-loading-label");
  if (label) label.textContent = "Ready";

  const audio = new Audio(audioUrl);
  const toggleBtn = backdrop.querySelector(".bz-tts-toggle") as HTMLElement;
  const progressFill = backdrop.querySelector(".bz-tts-progress-fill") as HTMLElement;

  if (!toggleBtn) return;

  audio.addEventListener("timeupdate", () => {
    if (audio.duration > 0 && progressFill) {
      progressFill.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
    }
  });
  audio.addEventListener("ended", () => {
    toggleBtn.classList.remove("bz-playing");
    if (progressFill) progressFill.style.width = "100%";
  });
  audio.addEventListener("play", () => toggleBtn.classList.add("bz-playing"));
  audio.addEventListener("pause", () => toggleBtn.classList.remove("bz-playing"));

  (window as any).__bodhiPollyAudio = audio;
  toggleBtn.setAttribute("data-polly", "true");
}

function markTTSReady() {
  const backdrop = document.getElementById("bodhi-zen-backdrop");
  if (!backdrop) return;
  const label = backdrop.querySelector(".bz-tts-loading-label");
  if (label) label.textContent = "Ready";
}

function removeZenOverlay() {
  const backdrop = document.getElementById("bodhi-zen-backdrop");
  if (!backdrop) return;
  try { window.speechSynthesis.cancel(); } catch {}
  const polly = (window as any).__bodhiPollyAudio as HTMLAudioElement | undefined;
  if (polly) { polly.pause(); delete (window as any).__bodhiPollyAudio; }
  backdrop.classList.add("bz-closing");
  setTimeout(() => backdrop.remove(), 250);
}

// ── Public API ──

export function showZenMode(tabId: number, data: any, insights: ZenInsights) {
  const iconUrl = chrome.runtime.getURL("icons/icon-48.png");

  const safeData = JSON.parse(JSON.stringify(data ?? {}));
  const safeInsights = JSON.parse(JSON.stringify(insights ?? {}));

  (chrome.scripting.insertCSS as any)({
    target: { tabId },
    css: getZenCSS(),
  });

  (chrome.scripting.executeScript as any)({
    target: { tabId },
    func: buildZenOverlay,
    world: "MAIN",
    args: [safeData, safeInsights, iconUrl, null],
  });

  if (isAIAvailable() && insights.ttsScript) {
    callBackendForTTS(insights.ttsScript)
      .then((ttsResult) => {
        const audioUrl = `data:${ttsResult.content_type};base64,${ttsResult.audio_base64}`;
        (chrome.scripting.executeScript as any)({
          target: { tabId },
          func: injectPollyAudio,
          world: "MAIN",
          args: [audioUrl],
        });
      })
      .catch((err) => {
        console.warn("[bodhi-leaf] Polly TTS failed, using browser fallback:", err);
        (chrome.scripting.executeScript as any)({
          target: { tabId },
          func: markTTSReady,
          world: "MAIN",
        });
      });
  }
}

export function hideZenMode(tabId: number) {
  (chrome.scripting.executeScript as any)({
    target: { tabId },
    func: removeZenOverlay,
    world: "MAIN",
  });
}
