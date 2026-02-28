import type { ZenInsights } from "./zen-insights";

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
    width: 400px;
    max-width: 94vw;
    max-height: 88vh;
    background: #0c0c11;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    box-shadow: 0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: bzSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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
  .bz-header-title span { font-size: 18px; }
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
  .bz-header-actions { display: flex; gap: 6px; }
  .bz-header-actions button {
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 8px;
    background: rgba(255,255,255,0.06);
    color: #a0a0ab;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }
  .bz-header-actions button:hover {
    background: rgba(255,255,255,0.12);
    color: #f0f0f5;
  }
  .bz-btn-close:hover { background: rgba(255,69,58,0.2) !important; color: #ff453a !important; }

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
  .bz-tts-btn {
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 10px;
    background: rgba(255,255,255,0.06);
    color: #f0f0f5;
    font-size: 15px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    flex-shrink: 0;
  }
  .bz-tts-btn:hover { background: rgba(255,255,255,0.1); }
  .bz-tts-btn.bz-playing {
    background: rgba(0,230,200,0.15);
    color: #00e6c8;
    box-shadow: 0 0 12px rgba(0,230,200,0.15);
  }
  .bz-tts-select {
    flex: 1;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    color: #a0a0ab;
    font-family: inherit;
    font-size: 12px;
    padding: 7px 10px;
    cursor: pointer;
    outline: none;
  }
  .bz-tts-select:focus { border-color: rgba(0,230,200,0.3); }
  .bz-tts-select option { background: #1a1a24; }
  .bz-tts-progress {
    height: 3px;
    background: rgba(255,255,255,0.04);
    border-radius: 2px;
    overflow: hidden;
  }
  .bz-tts-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #00e6c8, #00c4aa);
    border-radius: 2px;
    width: 0%;
    transition: width 0.3s;
  }

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
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .bz-pc-list li {
    font-size: 12px;
    color: #a0a0ab;
    line-height: 1.5;
    padding-left: 14px;
    position: relative;
  }
  .bz-pc-list li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 6px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
  }
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

  /* ── Minimized state ── */
  #bodhi-zen-panel.bz-minimized .bz-content { display: none; }
  #bodhi-zen-panel.bz-minimized { max-height: none; }
  `;
}

function buildZenOverlay(data: any, insights: any) {
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
          <span>🍃</span> Zen Mode
          <span class="bz-header-badge">AI</span>
        </div>
        <div class="bz-header-actions">
          <button class="bz-btn-minimize" title="Minimize">─</button>
          <button class="bz-btn-close" title="Close">✕</button>
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
          <div class="bz-section-title">🔊 Read Aloud</div>
          <div class="bz-tts-controls">
            <button class="bz-tts-btn bz-tts-play" title="Play">▶</button>
            <button class="bz-tts-btn bz-tts-pause" title="Pause">⏸</button>
            <button class="bz-tts-btn bz-tts-stop" title="Stop">⏹</button>
            <select class="bz-tts-select bz-tts-speed">
              <option value="0.75">0.75×</option>
              <option value="1" selected>1×</option>
              <option value="1.25">1.25×</option>
              <option value="1.5">1.5×</option>
              <option value="2">2×</option>
            </select>
          </div>
          <div class="bz-tts-progress"><div class="bz-tts-progress-fill"></div></div>
        </div>

        <!-- AI Insights -->
        <div class="bz-section">
          <div class="bz-section-title">🤖 AI Insights</div>
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
              <div class="bz-pc-group-title bz-pro">✅ Pros</div>
              ${prosHtml}
            </div>
            <div class="bz-cons">
              <div class="bz-pc-group-title bz-con">❌ Cons</div>
              ${consHtml}
            </div>
          </div>
        </div>

        <!-- Quick Specs -->
        ${insights.quickSpecs.length > 0 ? `
        <div class="bz-section">
          <div class="bz-section-title">📋 Quick Specs</div>
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

  minimizeBtn.addEventListener("click", () => {
    panel.classList.toggle("bz-minimized");
    (minimizeBtn as HTMLElement).textContent = panel.classList.contains("bz-minimized") ? "□" : "─";
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

  // ── TTS ──
  const ttsScript = insights.ttsScript || "";
  let utterance: SpeechSynthesisUtterance | null = null;

  const playBtn = backdrop.querySelector(".bz-tts-play") as HTMLElement;
  const pauseBtn = backdrop.querySelector(".bz-tts-pause") as HTMLElement;
  const stopBtn = backdrop.querySelector(".bz-tts-stop") as HTMLElement;
  const speedSelect = backdrop.querySelector(".bz-tts-speed") as HTMLSelectElement;
  const progressFill = backdrop.querySelector(".bz-tts-progress-fill") as HTMLElement;

  function startTTS() {
    window.speechSynthesis.cancel();
    utterance = new SpeechSynthesisUtterance(ttsScript);
    utterance.rate = parseFloat(speedSelect.value);
    utterance.pitch = 1;
    utterance.lang = "en-IN";

    utterance.onstart = () => {
      playBtn.classList.add("bz-playing");
      progressFill.style.width = "0%";
    };
    utterance.onend = () => {
      playBtn.classList.remove("bz-playing");
      progressFill.style.width = "100%";
    };
    utterance.onboundary = (e: SpeechSynthesisEvent) => {
      if (ttsScript.length > 0) {
        const pct = Math.min(100, (e.charIndex / ttsScript.length) * 100);
        progressFill.style.width = `${pct}%`;
      }
    };

    window.speechSynthesis.speak(utterance);
  }

  playBtn.addEventListener("click", () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      playBtn.classList.add("bz-playing");
    } else {
      startTTS();
    }
  });

  pauseBtn.addEventListener("click", () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      playBtn.classList.remove("bz-playing");
    }
  });

  stopBtn.addEventListener("click", () => {
    window.speechSynthesis.cancel();
    playBtn.classList.remove("bz-playing");
    progressFill.style.width = "0%";
  });

  speedSelect.addEventListener("change", () => {
    if (window.speechSynthesis.speaking) {
      startTTS();
    }
  });
}

function removeZenOverlay() {
  const backdrop = document.getElementById("bodhi-zen-backdrop");
  if (!backdrop) return;
  window.speechSynthesis.cancel();
  backdrop.classList.add("bz-closing");
  setTimeout(() => backdrop.remove(), 250);
}

// ── Public API ──

export function showZenMode(tabId: number, data: any, insights: ZenInsights) {
  (chrome.scripting.insertCSS as any)({
    target: { tabId },
    css: getZenCSS(),
  });

  (chrome.scripting.executeScript as any)({
    target: { tabId },
    func: buildZenOverlay,
    world: "MAIN",
    args: [data, insights],
  });
}

export function hideZenMode(tabId: number) {
  (chrome.scripting.executeScript as any)({
    target: { tabId },
    func: removeZenOverlay,
    world: "MAIN",
  });
}
