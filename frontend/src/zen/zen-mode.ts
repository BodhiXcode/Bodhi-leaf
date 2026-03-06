import type { ZenInsights } from "./zen-insights";
import { callBackendForTTS, callBackendForQuiz, callBackendForTranslation, isAIAvailable } from "../config/ai";

function getZenCSS(): string {
  return `
  #bodhi-zen-backdrop {
    position: fixed;
    inset: 0;
    z-index: 2147483646;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    animation: bzFadeIn 0.3s ease-out forwards;
    /* Full overlay: panel fills viewport minus 56px on every side */
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    padding: 56px;
  }
  #bodhi-zen-backdrop.bz-closing {
    animation: bzFadeOut 0.25s ease-in forwards;
  }
  @keyframes bzFadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes bzFadeOut { from { opacity: 1; } to { opacity: 0; } }

  #bodhi-zen-panel {
    position: relative;
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    background: linear-gradient(145deg, #0e0e15, #0a1012);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 24px;
    box-shadow: 0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), 0 0 80px rgba(0,230,200,0.04);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: bzSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #f0f0f5;
    font-size: calc(14px * var(--bz-font-scale, 1));
    line-height: 1.6;
    letter-spacing: var(--bz-letter-spacing, 0em);
    -webkit-font-smoothing: antialiased;
  }
  @keyframes bzSlideUp {
    from { opacity: 0; transform: scale(0.97); }
    to   { opacity: 1; transform: scale(1); }
  }

  /* ── Header ── */
  .bz-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 20px;
    background: rgba(255,255,255,0.03);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    cursor: grab;
    user-select: none;
    flex-shrink: 0;
    flex-wrap: wrap;
  }
  .bz-header:active { cursor: grabbing; }
  .bz-header-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.1em;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  .bz-header-title img {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    object-fit: contain;
  }
  .bz-header-badge {
    font-size: 0.65em;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #00e6c8;
    background: rgba(0,230,200,0.12);
    padding: 2px 10px;
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

  /* ── Accessibility toolbar ── */
  .bz-a11y-bar {
    display: flex;
    align-items: center;
    gap: 6px 16px;
    flex-wrap: wrap;
    padding: 8px 20px;
    background: rgba(255,255,255,0.02);
    border-bottom: 1px solid rgba(255,255,255,0.05);
    flex-shrink: 0;
  }
  .bz-a11y-bar[hidden] { display: none !important; }
  .bz-a11y-group {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .bz-a11y-label {
    font-size: 0.75em;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #8a8a93;
    white-space: nowrap;
  }
  .bz-a11y-step {
    width: 26px;
    height: 26px;
    border: 1px solid rgba(255,255,255,0.08) !important;
    border-radius: 6px;
    background: rgba(255,255,255,0.04);
    color: #a0a0ab;
    font-family: inherit;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    padding: 0;
    flex-shrink: 0;
  }
  .bz-a11y-step:hover { background: rgba(255,255,255,0.10); color: #f0f0f5; }
  .bz-a11y-step:active { transform: scale(0.9); }
  .bz-a11y-val {
    font-size: 0.8em;
    font-weight: 700;
    color: #00e6c8;
    min-width: 48px;
    text-align: center;
  }
  .bz-a11y-sep {
    width: 1px;
    height: 22px;
    background: rgba(255,255,255,0.07);
    flex-shrink: 0;
  }
  .bz-a11y-mode {
    font-size: 10px;
    font-weight: 600;
    padding: 3px 9px;
    border-radius: 100px;
    border: 1px solid rgba(255,255,255,0.08) !important;
    background: rgba(255,255,255,0.04);
    color: #a0a0ab;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
    white-space: nowrap;
  }
  .bz-a11y-mode:hover { background: rgba(255,255,255,0.10); color: #f0f0f5; }
  .bz-a11y-mode.bz-active-mode { background: rgba(0,230,200,0.12); color: #00e6c8; border-color: rgba(0,230,200,0.25) !important; }

  /* colour-blind CSS filters */
  #bodhi-zen-panel[data-color-mode="protanopia"]   { filter: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cfilter id='p'%3E%3CfeColorMatrix type='matrix' values='0.567 0.433 0 0 0 0.558 0.442 0 0 0 0 0.242 0.758 0 0 0 0 0 1 0'/%3E%3C/filter%3E%3C/defs%3E%3C/svg%3E#p"); }
  #bodhi-zen-panel[data-color-mode="deuteranopia"] { filter: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cfilter id='d'%3E%3CfeColorMatrix type='matrix' values='0.625 0.375 0 0 0 0.7 0.3 0 0 0 0 0.3 0.7 0 0 0 0 0 1 0'/%3E%3C/filter%3E%3C/defs%3E%3C/svg%3E#d"); }
  #bodhi-zen-panel[data-color-mode="tritanopia"]   { filter: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cfilter id='t'%3E%3CfeColorMatrix type='matrix' values='0.95 0.05 0 0 0 0 0.433 0.567 0 0 0 0.475 0.525 0 0 0 0 0 1 0'/%3E%3C/filter%3E%3C/defs%3E%3C/svg%3E#t"); }
  #bodhi-zen-panel[data-color-mode="high-contrast"] {
    background: #000 !important;
    --bz-text: #ffffff;
    --bz-text-sec: #dddddd;
    --bz-text-ter: #aaaaaa;
    --bz-accent: #00ffdd;
  }

  /* ── Content ── */
  .bz-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 24px;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    grid-auto-rows: min-content;
    gap: 16px;
    align-content: start;
  }
  .bz-content::-webkit-scrollbar { width: 4px; }
  .bz-content::-webkit-scrollbar-track { background: transparent; }
  .bz-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }

  /* ── Sections (Bento cells) ── */
  .bz-section {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 18px;
    padding: 20px;
    min-width: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
  .bz-section:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(0,0,0,0.2);
  }
  /* Bento grid span classes */
  .bz-col-6 { grid-column: span 6; }
  .bz-col-4 { grid-column: span 4; }
  .bz-col-3 { grid-column: span 3; }
  .bz-col-2 { grid-column: span 2; }
  .bz-row-2 { grid-row: span 2; }
  .bz-section-title {
    font-size: 0.75em;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #8a8a93;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
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
  .bz-product-info { min-width: 0; flex: 1; display: flex; flex-direction: column; justify-content: center; }
  .bz-product-title {
    font-size: 1.4em;
    font-weight: 800;
    line-height: 1.25;
    color: #ffffff;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 8px;
    letter-spacing: -0.03em;
  }
  .bz-product-meta {
    font-size: 0.85em;
    color: #a0a0ab;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }
  .bz-product-meta .bz-stars { color: #f5a623; }
  .bz-product-price {
    font-size: 1.8em;
    font-weight: 800;
    color: #00e6c8;
    letter-spacing: -0.04em;
  }
  .bz-product-savings {
    font-size: 0.7em;
    font-weight: 800;
    color: #34c759;
    background: rgba(52,199,89,0.15);
    padding: 2px 10px;
    border-radius: 100px;
    margin-left: 10px;
    vertical-align: middle;
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
  .bz-tts-lang-btn {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 6px;
    color: #a0a0ab;
    font-size: 11px;
    font-weight: 600;
    padding: 4px 10px;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    margin-top: 6px;
  }
  .bz-tts-lang-btn:hover { background: rgba(255,255,255,0.1); color: #f0f0f5; }
  .bz-tts-lang-btn.active { background: rgba(0,230,200,0.15); border-color: rgba(0,230,200,0.3); color: #00e6c8; }

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
    font-size: 1.25em;
    font-weight: 900;
    color: #ffffff;
  }
  .bz-score-info { min-width: 0; }
  .bz-score-label {
    font-size: 0.85em;
    font-weight: 700;
    color: #f0f0f5;
    margin-bottom: 4px;
  }
  .bz-score-verdict {
    font-size: 0.85em;
    color: #a0a0ab;
    line-height: 1.5;
  }

  /* ── Pros/Cons ── */
  .bz-pros-cons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .bz-pc-group-title {
    font-size: 0.85em;
    font-weight: 800;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
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
    font-size: 0.85em;
    color: #a0a0ab;
    line-height: 1.6;
    padding-left: 16px !important;
    position: relative;
    margin-bottom: 8px !important;
  }
  .bz-pc-list li::before {
    content: '' !important;
    position: absolute;
    left: 0;
    top: 8px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }
  .bz-pc-list li::marker { content: none !important; font-size: 0 !important; }
  .bz-pros .bz-pc-list li::before { background: #34c759; box-shadow: 0 0 8px rgba(52,199,89,0.4); }
  .bz-cons .bz-pc-list li::before { background: #ff453a; opacity: 0.6; box-shadow: 0 0 8px rgba(255,69,58,0.4); }
  .bz-no-data {
    font-size: 0.85em;
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
    font-size: 0.65em;
    font-weight: 700;
    color: #8a8a93;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .bz-spec-value {
    font-size: 0.85em;
    font-weight: 700;
    color: #ffffff;
    word-break: break-word;
  }

  /* ── Star Breakdown ── */
  .bz-star-breakdown { display: flex; flex-direction: column; gap: 6px; }
  .bz-star-row {
    display: grid;
    grid-template-columns: 36px 1fr 40px;
    align-items: center;
    gap: 12px;
    font-size: 0.8em;
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
    font-size: 0.8em;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 8px;
    margin-bottom: 12px;
  }
  .bz-seller-seller-issue { background: rgba(255,69,58,0.12); color: #ff6b6b; }
  .bz-seller-product-issue { background: rgba(245,166,35,0.12); color: #f5a623; }
  .bz-seller-both { background: rgba(255,69,58,0.12); color: #ff6b6b; }
  .bz-seller-no-issues { background: rgba(52,199,89,0.12); color: #34c759; }
  .bz-seller-advice { font-size: 0.85em; color: #a0a0ab; line-height: 1.6; }

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

  .bz-quiz-reset, .bz-quiz-retake {
    margin-top: 16px;
    padding: 10px 20px;
    border-radius: 100px;
    border: 1px solid rgba(0, 230, 200, 0.3);
    background: linear-gradient(135deg, rgba(0, 230, 200, 0.15) 0%, rgba(0, 196, 170, 0.1) 100%);
    color: #00e6c8;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .bz-quiz-reset:hover, .bz-quiz-retake:hover {
    background: linear-gradient(135deg, rgba(0, 230, 200, 0.25) 0%, rgba(0, 196, 170, 0.15) 100%);
    border-color: rgba(0, 230, 200, 0.5);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 230, 200, 0.15);
  }
  .bz-quiz-reset:active, .bz-quiz-retake:active {
    transform: translateY(0);
  }
  .bz-quiz-reset::before {
    content: "";
    display: inline-block;
    width: 14px;
    height: 14px;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2300e6c8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12'/%3E%3Cpath d='M3 3v9h9'/%3E%3C/svg%3E") no-repeat center;
    background-size: contain;
  }

  /* ── Minimized state ── */
  #bodhi-zen-panel.bz-minimized .bz-content { display: none; }
  #bodhi-zen-panel.bz-minimized .bz-a11y-bar { display: none !important; }
  #bodhi-zen-panel.bz-minimized { height: auto; }
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

  function getQuizQuestions(category: string, data: any) {
    const prettyCategory = (c: string) => {
      const map: Record<string, string> = {
        phone: "phone",
        laptop: "laptop",
        monitor: "monitor",
        audio: "headphones / audio",
        camera: "camera",
        tv: "TV",
        wearable: "wearable",
        tablet: "tablet",
        peripherals: "accessory",
        general: "product",
      };
      return map[c] || c;
    };

    // Extract actual product features to make questions relevant
    const features = (data.features || []).join(" ").toLowerCase();
    const title = (data.title || "").toLowerCase();
    const hasWireless = features.includes("wireless") || features.includes("bluetooth") || features.includes("wifi");
    const hasBattery = features.includes("battery") || title.includes("wireless") || category === "phone" || category === "laptop" || category === "audio" || category === "wearable";
    const hasCamera = features.includes("camera") || title.includes("camera") || category === "phone";
    const isGaming = title.includes("gaming") || features.includes("gaming");
    const isProfessional = title.includes("pro") || title.includes("professional") || features.includes("professional");

    // Dynamic questions based on actual product
    const dynamicQuestions: any[] = [];

    if (hasBattery) {
      dynamicQuestions.push({
        id: "battery_importance",
        question: "How important is battery life to you?",
        options: [
          { label: "All day use - must last 8+ hours", value: "high" },
          { label: "Moderate - 4-6 hours is fine", value: "mid" },
          { label: "Not a priority - I'll charge frequently", value: "low" },
        ]
      });
    }

    if (hasWireless) {
      dynamicQuestions.push({
        id: "connectivity",
        question: "Do you need wireless/wire-free operation?",
        options: [
          { label: "Yes - freedom from cables is essential", value: "essential" },
          { label: "Nice to have but not required", value: "preferred" },
          { label: "No - wired is fine for me", value: "no" },
        ]
      });
    }

    if (hasCamera) {
      dynamicQuestions.push({
        id: "camera_priority",
        question: "How will you use the camera?",
        options: [
          { label: "Content creation & high-quality photos", value: "content" },
          { label: "Social media & casual photography", value: "social" },
          { label: "Basic video calls only", value: "basic" },
        ]
      });
    }

    const common = [
      {
        id: "budget", question: `What's your priority for this ${prettyCategory(category)} purchase?`, options: [
          { label: "Save money - best deal possible", value: "low" },
          { label: "Balance quality and price", value: "mid" },
          { label: "Best quality - price is secondary", value: "high" },
        ]
      },
      {
        id: "usage", question: `How often will you use this ${prettyCategory(category)}?`, options: [
          { label: "Daily - it's essential", value: "daily" },
          { label: "A few times per week", value: "weekly" },
          { label: "Occasionally or seasonally", value: "occasional" },
        ]
      },
    ];

    const categoryQuestions: Record<string, any[]> = {
      phone: [{
        id: "phone_use", question: "What matters most in this phone?", options: [
          { label: "Camera quality & photos", value: "camera" },
          { label: "Gaming & performance", value: "gaming" },
          { label: "Battery life & reliability", value: "battery" },
        ]
      }],
      laptop: [{
        id: "laptop_use", question: "What will you primarily use this laptop for?", options: [
          { label: "Work, coding & productivity", value: "work" },
          { label: "Gaming & entertainment", value: "gaming" },
          { label: "Everyday browsing & streaming", value: "casual" },
        ]
      }],
      monitor: [{
        id: "monitor_use", question: "What's your main use for this monitor?", options: [
          { label: "Professional work & productivity", value: "work" },
          { label: "Competitive gaming", value: "gaming" },
          { label: "Content creation & design", value: "creative" },
        ]
      }],
      audio: [{
        id: "audio_use", question: "When will you use these headphones/earphones most?", options: [
          { label: "Commuting & travel", value: "commute" },
          { label: "Working out & exercise", value: "workout" },
          { label: "At home or desk", value: "home" },
        ]
      }],
      camera: [{
        id: "camera_use", question: "What type of photography/videography?", options: [
          { label: "Professional shoots", value: "professional" },
          { label: "Vlogging & content creation", value: "vlogging" },
          { label: "Travel & casual photography", value: "travel" },
        ]
      }],
      tv: [{
        id: "tv_use", question: "How do you mainly watch TV?", options: [
          { label: "Movies & cinematic content", value: "movies" },
          { label: "Sports & live TV", value: "sports" },
          { label: "Gaming on consoles", value: "gaming" },
        ]
      }],
      wearable: [{
        id: "wearable_use", question: "Main purpose for this wearable?", options: [
          { label: "Fitness tracking & workouts", value: "fitness" },
          { label: "Health monitoring & alerts", value: "health" },
          { label: "Notifications & convenience", value: "smart" },
        ]
      }],
      tablet: [{
        id: "tablet_use", question: "How will you use this tablet?", options: [
          { label: "Drawing & creative work", value: "creative" },
          { label: "Media consumption & reading", value: "media" },
          { label: "Work & productivity", value: "work" },
        ]
      }],
      general: [{
        id: "durability", question: "How long do you need this to last?", options: [
          { label: "Years - long-term investment", value: "high" },
          { label: "A couple of years", value: "mid" },
          { label: "Short term / temporary", value: "low" },
        ]
      }],
    };

    return [...common, ...dynamicQuestions, ...(categoryQuestions[category] || categoryQuestions.general)];
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
          <button class="bz-btn-a11y" title="Accessibility" aria-label="Accessibility settings" aria-expanded="false"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4" r="1"/><path d="M9 20l3-8 3 8"/><path d="M6 8l6 2 6-2"/></svg></button>
          <button class="bz-btn-minimize" title="Minimize"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg></button>
          <button class="bz-btn-close" title="Close"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
      </div>
      <!-- Accessibility toolbar (hidden by default) -->
      <div class="bz-a11y-bar" hidden>
        <div class="bz-a11y-group">
          <span class="bz-a11y-label">Font</span>
          <button class="bz-a11y-step" data-a11y="font-dec" aria-label="Decrease font size">A−</button>
          <span class="bz-a11y-val" data-a11y-display="font">100%</span>
          <button class="bz-a11y-step" data-a11y="font-inc" aria-label="Increase font size">A+</button>
        </div>
        <div class="bz-a11y-sep"></div>
        <div class="bz-a11y-group">
          <span class="bz-a11y-label">Spacing</span>
          <button class="bz-a11y-step" data-a11y="space-dec" aria-label="Decrease letter spacing">T−</button>
          <span class="bz-a11y-val" data-a11y-display="space">Normal</span>
          <button class="bz-a11y-step" data-a11y="space-inc" aria-label="Increase letter spacing">T+</button>
        </div>
        <div class="bz-a11y-sep"></div>
        <div class="bz-a11y-group">
          <span class="bz-a11y-label">Color</span>
          <button class="bz-a11y-mode bz-active-mode" data-mode="normal">Normal</button>
          <button class="bz-a11y-mode" data-mode="protanopia">Protan</button>
          <button class="bz-a11y-mode" data-mode="deuteranopia">Deuter</button>
          <button class="bz-a11y-mode" data-mode="tritanopia">Tritan</button>
          <button class="bz-a11y-mode" data-mode="high-contrast">Hi-Con</button>
        </div>
      </div>
      <div class="bz-content">
        <!-- Product Summary: full-width bento cell -->
        <div class="bz-section bz-col-6 bz-product">
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

        <!-- AI Insights: large spanning cell -->
        <div class="bz-section bz-col-4 bz-row-2">
          <div class="bz-section-title"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00e6c8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93"/><path d="M8 6a4 4 0 0 1 3.25 1.93"/><circle cx="12" cy="14" r="4"/><path d="M12 18v4"/><path d="M8 22h8"/></svg> AI Verdict</div>
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
          <div style="display: flex; flex-direction: column; gap: 20px; margin-top: 10px;">
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

        <!-- TTS Controls: smaller cell -->
        <div class="bz-section bz-col-2">
          <div class="bz-section-title"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00e6c8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg> Playback <span class="bz-tts-loading-label">Loading voice…</span></div>
          <div class="bz-tts-controls">
            <button class="bz-tts-toggle" title="Play / Pause">
              <svg class="bz-icon-play" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="6,4 20,12 6,20"/></svg>
              <svg class="bz-icon-pause" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
            </button>
            <button class="bz-tts-stop" title="Stop"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="6" width="12" height="12" rx="2"/></svg></button>
          </div>
          <div class="bz-tts-progress-inline" style="margin: 12px 0;"><div class="bz-tts-progress-fill"></div></div>
          <select class="bz-tts-speed" style="width: 100%;">
            <option value="0.75">0.75×</option>
            <option value="1" selected>1×</option>
            <option value="1.25">1.25×</option>
            <option value="1.5">1.5×</option>
            <option value="2">2×</option>
          </select>
          <button class="bz-tts-lang-btn" data-lang="en" title="Switch to Hindi voice">
            🇮🇳 हिंदी
          </button>
        </div>

        <!-- Seller Analysis: smaller cell -->
        ${insights.sellerVsProduct || insights.sellerAdvice ? `
        <div class="bz-section bz-col-2">
          <div class="bz-section-title"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00e6c8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Seller</div>
          ${insights.sellerVsProduct ? `<div class="bz-seller-badge bz-seller-${insights.sellerVsProduct.replace(/_/g, "-")}">${insights.sellerVsProduct === "seller_issue" ? "Seller Warning" :
        insights.sellerVsProduct === "product_issue" ? "Product Focus" :
          insights.sellerVsProduct === "both" ? "Mixed Signal" :
            "Trusted Seller"
        }</div>` : ""}
          ${insights.sellerAdvice ? `<div class="bz-seller-advice" style="font-size: 0.75em;">${esc(insights.sellerAdvice)}</div>` : ""}
        </div>` : ""}

        <!-- Quick Specs: medium cell -->
        ${insights.quickSpecs.length > 0 ? `
        <div class="bz-section bz-col-3">
          <div class="bz-section-title"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00e6c8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/></svg> Specs</div>
          <div class="bz-specs-grid" style="grid-template-columns: 1fr;">${specsHtml}</div>
        </div>` : ""}

        <!-- Star Breakdown: medium cell -->
        ${insights.starBreakdown && insights.starBreakdown.length > 0 ? `
        <div class="bz-section bz-col-3">
          <div class="bz-section-title"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00e6c8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Ratings</div>
          <div class="bz-star-breakdown">
            ${[5, 4, 3, 2, 1].map(s => {
          const sb = insights.starBreakdown.find((x: any) => x.star === s);
          const pct = sb ? sb.pct : 0;
          const barColor = s >= 4 ? "#34c759" : s === 3 ? "#f5a623" : "#ff453a";
          return `<div class="bz-star-row">
                <span class="bz-star-label">${s}★</span>
                <div class="bz-star-bar"><div class="bz-star-bar-fill" style="width:${pct}%;background:${barColor}"></div></div>
                <span class="bz-star-pct">${pct}%</span>
              </div>`;
        }).join("")}
          </div>
        </div>` : ""}

        <!-- Preference Quiz: spanning wide -->
        <div class="bz-section bz-col-6 bz-quiz-section">
          <div class="bz-section-title"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00e6c8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg> Shopping Assistant</div>
          <div class="bz-quiz-cards"></div>
          <div class="bz-quiz-result" style="display:none">
            <div class="bz-quiz-score-title">Your Fit Analysis</div>
            <div class="bz-quiz-graph"></div>
            <button type="button" class="bz-quiz-reset">Retake Quiz</button>
          </div>
        </div>

        <!-- New Version Alert: footer style -->
        ${insights.newVersionAlert ? `
        <div class="bz-section bz-col-6 bz-alert-section" style="background: rgba(245,166,35,0.05);">
          <div class="bz-section-title"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f5a623" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Product Alert</div>
          <div class="bz-alert-text" style="font-size: 0.9em;">${esc(insights.newVersionAlert)}</div>
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

  // ── Accessibility toolbar ──
  const a11yToggle = backdrop.querySelector(".bz-btn-a11y") as HTMLElement | null;
  const a11yBar = backdrop.querySelector(".bz-a11y-bar") as HTMLElement | null;

  const BZ_FONT_STEPS = [0.85, 1, 1.15, 1.30, 1.50];
  const BZ_SPACE_STEPS = [0, 0.02, 0.05, 0.10, 0.16];
  const BZ_SPACE_LABELS = ["Normal", "+Sm", "+Md", "+Lg", "+XL"];
  const BZ_COLOR_MODES = ["normal", "protanopia", "deuteranopia", "tritanopia", "high-contrast"];
  const BZ_STORE_KEY = "__bodhiA11y";

  let bzState = { fontIdx: 1, spaceIdx: 0, colorMode: "normal" };
  try {
    const saved = JSON.parse(localStorage.getItem(BZ_STORE_KEY) || "{}");
    if (saved.fontIdx != null) bzState.fontIdx = Number(saved.fontIdx);
    if (saved.spaceIdx != null) bzState.spaceIdx = Number(saved.spaceIdx);
    if (saved.colorMode) bzState.colorMode = saved.colorMode;
  } catch { }

  function bzSaveA11y() {
    try { localStorage.setItem(BZ_STORE_KEY, JSON.stringify(bzState)); } catch { }
  }

  function bzApplyFont() {
    const scale = BZ_FONT_STEPS[bzState.fontIdx] ?? 1;
    panel.style.setProperty("--bz-font-scale", String(scale));
    const disp = backdrop.querySelector("[data-a11y-display='font']");
    if (disp) disp.textContent = Math.round(scale * 100) + "%";
  }

  function bzApplySpace() {
    const em = BZ_SPACE_STEPS[bzState.spaceIdx] ?? 0;
    panel.style.setProperty("--bz-letter-spacing", em + "em");
    const disp = backdrop.querySelector("[data-a11y-display='space']");
    if (disp) disp.textContent = BZ_SPACE_LABELS[bzState.spaceIdx] ?? "Normal";
  }

  function bzApplyColor() {
    BZ_COLOR_MODES.forEach(m => panel.removeAttribute("data-color-mode"));
    if (bzState.colorMode !== "normal") panel.setAttribute("data-color-mode", bzState.colorMode);
    backdrop.querySelectorAll(".bz-a11y-mode").forEach(btn => {
      const isActive = (btn as HTMLElement).dataset.mode === bzState.colorMode;
      btn.classList.toggle("bz-active-mode", isActive);
    });
  }

  function bzApplyAll() { bzApplyFont(); bzApplySpace(); bzApplyColor(); }
  bzApplyAll();

  a11yToggle?.addEventListener("click", () => {
    const hidden = a11yBar?.hasAttribute("hidden");
    if (hidden) { a11yBar?.removeAttribute("hidden"); a11yToggle.setAttribute("aria-expanded", "true"); }
    else { a11yBar?.setAttribute("hidden", ""); a11yToggle.setAttribute("aria-expanded", "false"); }
  });

  backdrop.querySelectorAll("[data-a11y]").forEach(btn => {
    btn.addEventListener("click", () => {
      const action = (btn as HTMLElement).dataset.a11y;
      if (action === "font-inc" && bzState.fontIdx < BZ_FONT_STEPS.length - 1) { bzState.fontIdx++; bzApplyFont(); bzSaveA11y(); }
      if (action === "font-dec" && bzState.fontIdx > 0) { bzState.fontIdx--; bzApplyFont(); bzSaveA11y(); }
      if (action === "space-inc" && bzState.spaceIdx < BZ_SPACE_STEPS.length - 1) { bzState.spaceIdx++; bzApplySpace(); bzSaveA11y(); }
      if (action === "space-dec" && bzState.spaceIdx > 0) { bzState.spaceIdx--; bzApplySpace(); bzSaveA11y(); }
    });
  });

  backdrop.querySelectorAll(".bz-a11y-mode").forEach(btn => {
    btn.addEventListener("click", () => {
      bzState.colorMode = (btn as HTMLElement).dataset.mode ?? "normal";
      bzApplyColor();
      bzSaveA11y();
    });
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
      if (audio.paused) {
        audio.playbackRate = parseFloat(speedSelect.value);
        const p = audio.play();
        if (p && typeof p.catch === "function") {
          p.catch(() => {
            console.warn("[bodhi-leaf] Polly play failed, using browser TTS");
            toggleBtn.removeAttribute("data-polly");
            startBrowserTTS();
          });
        }
      } else {
        audio.pause();
      }
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

  // Hindi language toggle
  const langBtn = backdrop.querySelector(".bz-tts-lang-btn") as HTMLElement | null;
  let isHindiMode = false;
  langBtn?.addEventListener("click", () => {
    // Stop current playback
    if (hasPolly()) { const a = getPollyAudio()!; a.pause(); a.currentTime = 0; }
    else { window.speechSynthesis.cancel(); }
    setPlaying(false);
    progressFill.style.width = "0%";

    isHindiMode = !isHindiMode;
    if (isHindiMode) {
      langBtn.classList.add("active");
      langBtn.textContent = "🇬🇧 English";
      const cached = (window as any).__bodhiPollyAudioHindi;
      if (cached) {
        cached.currentTime = 0;
        (window as any).__bodhiPollyAudio = cached;
        toggleBtn.setAttribute("data-polly", "true");
      } else {
        const hindiUrl = (backdrop as any).__bodhiHindiAudioUrl;
        if (hindiUrl) {
          const hindiAudio = new Audio();
          hindiAudio.addEventListener("canplaythrough", () => {
            (window as any).__bodhiPollyAudioHindi = hindiAudio;
            (window as any).__bodhiPollyAudio = hindiAudio;
            toggleBtn.setAttribute("data-polly", "true");
          }, { once: true });
          hindiAudio.addEventListener("play", () => setPlaying(true));
          hindiAudio.addEventListener("pause", () => setPlaying(false));
          hindiAudio.addEventListener("ended", () => { setPlaying(false); progressFill.style.width = "100%"; });
          hindiAudio.addEventListener("timeupdate", () => {
            if (hindiAudio.duration > 0) progressFill.style.width = `${(hindiAudio.currentTime / hindiAudio.duration) * 100}%`;
          });
          hindiAudio.src = hindiUrl;
          hindiAudio.load();
        }
      }
    } else {
      langBtn.classList.remove("active");
      langBtn.textContent = "🇮🇳 हिंदी";
      const originalAudio = (window as any).__bodhiPollyAudioEn;
      if (originalAudio) {
        (window as any).__bodhiPollyAudio = originalAudio;
        toggleBtn.setAttribute("data-polly", "true");
      }
    }
  });

  // ── Preference Quiz (flash-card MCQ) ──
  const quizContainer = backdrop.querySelector(".bz-quiz-cards") as HTMLElement;
  const quizResult = backdrop.querySelector(".bz-quiz-result") as HTMLElement;
  const quizGraph = backdrop.querySelector(".bz-quiz-graph") as HTMLElement;
  const quizResetBtn = backdrop.querySelector(".bz-quiz-reset") as HTMLButtonElement | null;
  if (quizContainer) {
    const category = detectCategory(data);
    let questions = getQuizQuestions(category, data);
    const answers: Record<string, string> = {};
    const STORAGE_KEY = "__bodhiPrefs";

    // Show loading state while AI questions are fetched
    quizContainer.innerHTML = '<div class="bz-quiz-loading" style="font-size:11px;color:#5c5c66;padding:8px 0;">Generating personalized questions...</div>';

    // Listen for AI-generated questions
    backdrop.addEventListener("bodhi-quiz-ready", ((e: CustomEvent) => {
      const aiQuestions = e.detail;
      if (aiQuestions && aiQuestions.length > 0) {
        questions = aiQuestions;
        const loadingEl = quizContainer.querySelector(".bz-quiz-loading");
        if (loadingEl) loadingEl.remove();
        if (quizResult.style.display !== "block") {
          showQuestion(0);
        }
      }
    }) as EventListener);

    // Fallback: if no AI quiz arrives within 8s, use hardcoded
    setTimeout(() => {
      const loadingEl = quizContainer.querySelector(".bz-quiz-loading");
      if (loadingEl) {
        loadingEl.remove();
        showQuestion(0);
      }
    }, 8000);

    type PrefStore = Record<string, Record<string, string>>;
    const stored: PrefStore = (() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed as PrefStore : {};
      } catch {
        return {};
      }
    })();

    const savedForCategory = stored[category] || {};
    const hasSavedPrefs = Object.keys(savedForCategory).length >= questions.length;

    function saveStore() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      } catch {
        // ignore quota / storage errors
      }
    }

    if (hasSavedPrefs) {
      Object.assign(answers, savedForCategory);
      showGraph();
    }

    function showQuestion(idx: number) {
      if (idx >= questions.length) {
        stored[category] = { ...answers };
        saveStore();
        showGraph();
        return;
      }
      const q = questions[idx];
      if (savedForCategory[q.id]) {
        answers[q.id] = savedForCategory[q.id];
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

    function resetQuizForCategory() {
      delete stored[category];
      saveStore();
      Object.keys(answers).forEach((k) => { delete (answers as any)[k]; });
      quizResult.style.display = "none";
      quizContainer.style.display = "block";
      showQuestion(0);
    }

    if (quizResetBtn) {
      quizResetBtn.addEventListener("click", () => {
        resetQuizForCategory();
      });
    }
  }
}

function injectPollyAudio(audioUrl: string) {
  const backdrop = document.getElementById("bodhi-zen-backdrop");
  if (!backdrop) return;

  const label = backdrop.querySelector(".bz-tts-loading-label");
  const toggleBtn = backdrop.querySelector(".bz-tts-toggle") as HTMLElement;
  const progressFill = backdrop.querySelector(".bz-tts-progress-fill") as HTMLElement;
  if (!toggleBtn) return;

  const audio = new Audio();

  audio.addEventListener("canplaythrough", () => {
    (window as any).__bodhiPollyAudio = audio;
    (window as any).__bodhiPollyAudioEn = audio;
    toggleBtn.setAttribute("data-polly", "true");
    if (label) label.textContent = "Ready";
  }, { once: true });

  audio.addEventListener("error", () => {
    console.warn("[bodhi-leaf] Polly audio failed to load, browser TTS will be used");
    if (label) label.textContent = "Ready (browser)";
  });

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

  audio.src = audioUrl;
  audio.load();
}

function markTTSReady() {
  const backdrop = document.getElementById("bodhi-zen-backdrop");
  if (!backdrop) return;
  const label = backdrop.querySelector(".bz-tts-loading-label");
  if (label) label.textContent = "Ready";
}

function injectHindiAudio(audioUrl: string) {
  const backdrop = document.getElementById("bodhi-zen-backdrop");
  if (!backdrop) return;
  (backdrop as any).__bodhiHindiAudioUrl = audioUrl;
  const langBtn = backdrop.querySelector(".bz-tts-lang-btn");
  if (langBtn) langBtn.classList.add("ready");
}

function injectQuizQuestions(questions: any[]) {
  const backdrop = document.getElementById("bodhi-zen-backdrop");
  if (!backdrop) return;
  const quizCards = backdrop.querySelector(".bz-quiz-cards") as HTMLElement;
  if (!quizCards) return;

  (window as any).__bodhiAIQuiz = questions;

  const loadingEl = quizCards.querySelector(".bz-quiz-loading");
  if (loadingEl) loadingEl.remove();

  const event = new CustomEvent("bodhi-quiz-ready", { detail: questions });
  backdrop.dispatchEvent(event);
}

function removeZenOverlay() {
  const backdrop = document.getElementById("bodhi-zen-backdrop");
  if (!backdrop) return;
  try { window.speechSynthesis.cancel(); } catch { }
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
    args: [safeData, safeInsights, iconUrl, null, null],
  });

  // Fetch AI quiz questions async, inject when ready
  if (isAIAvailable()) {
    callBackendForQuiz(safeData)
      .then((questions) => {
        if (questions.length > 0) {
          (chrome.scripting.executeScript as any)({
            target: { tabId },
            func: injectQuizQuestions,
            world: "MAIN",
            args: [JSON.parse(JSON.stringify(questions))],
          });
        }
      })
      .catch((err) => {
        console.warn("[bodhi-leaf] AI quiz generation failed, using defaults:", err);
      });
  }

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

  // Pre-fetch Hindi translation + TTS in background
  if (isAIAvailable() && insights.ttsScript) {
    callBackendForTranslation(insights.ttsScript, "hi")
      .then(async (tr) => {
        const hindiTts = await callBackendForTTS(tr.translated, "Kajal", "generative");
        const hindiUrl = `data:${hindiTts.content_type};base64,${hindiTts.audio_base64}`;
        (chrome.scripting.executeScript as any)({
          target: { tabId },
          func: injectHindiAudio,
          world: "MAIN",
          args: [hindiUrl],
        });
      })
      .catch((err) => {
        console.warn("[bodhi-leaf] Hindi TTS pre-fetch failed:", err);
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
