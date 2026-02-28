// Portal Animation — Nether Portal-style teal sci-fi loading effect
// Injected into the active tab's page via chrome.scripting APIs

function getPortalCSS(): string {
    return `
    #bodhi-portal-overlay {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      pointer-events: none;
      overflow: hidden;
      animation: bodhiPortalFadeIn 0.6s ease-out forwards;
    }
    #bodhi-portal-overlay.bodhi-portal-closing {
      animation: bodhiPortalFadeOut 0.5s ease-in forwards;
    }

    /* ── SVG filter for the wave turbulence (hidden) ── */
    #bodhi-portal-svg-filters {
      position: absolute;
      width: 0; height: 0;
      overflow: hidden;
    }

    /* ═══════════════════════════════════════════════════
       WAVE BORDERS — organic, fluid wave edges
       ═══════════════════════════════════════════════════ */
    .bodhi-wave-border {
      position: absolute;
      filter: url(#bodhi-turbulence-filter);
    }

    /* top wave */
    .bodhi-wave-border.top {
      top: -10px; left: 0; right: 0; height: 60px;
      background: linear-gradient(
        180deg,
        rgba(0, 255, 220, 0.45) 0%,
        rgba(0, 210, 200, 0.25) 40%,
        rgba(0, 180, 180, 0.08) 70%,
        transparent 100%
      );
      animation: bodhiWaveDriftH 4s ease-in-out infinite alternate;
    }
    /* bottom wave */
    .bodhi-wave-border.bottom {
      bottom: -10px; left: 0; right: 0; height: 60px;
      background: linear-gradient(
        0deg,
        rgba(0, 255, 220, 0.45) 0%,
        rgba(0, 210, 200, 0.25) 40%,
        rgba(0, 180, 180, 0.08) 70%,
        transparent 100%
      );
      animation: bodhiWaveDriftH 4s ease-in-out infinite alternate-reverse;
    }
    /* left wave */
    .bodhi-wave-border.left {
      top: 0; bottom: 0; left: -10px; width: 60px;
      background: linear-gradient(
        90deg,
        rgba(0, 255, 220, 0.45) 0%,
        rgba(0, 210, 200, 0.25) 40%,
        rgba(0, 180, 180, 0.08) 70%,
        transparent 100%
      );
      animation: bodhiWaveDriftV 4s ease-in-out infinite alternate;
    }
    /* right wave */
    .bodhi-wave-border.right {
      top: 0; bottom: 0; right: -10px; width: 60px;
      background: linear-gradient(
        270deg,
        rgba(0, 255, 220, 0.45) 0%,
        rgba(0, 210, 200, 0.25) 40%,
        rgba(0, 180, 180, 0.08) 70%,
        transparent 100%
      );
      animation: bodhiWaveDriftV 4s ease-in-out infinite alternate-reverse;
    }

    /* ═══════════════════════════════════════════════════
       NETHER SWIRL — inner translucent ripple layers
       ═══════════════════════════════════════════════════ */
    .bodhi-nether-swirl {
      position: absolute;
      border-radius: 50%;
      border: 2px solid rgba(0, 255, 220, 0.15);
      animation: bodhiSwirlExpand 3s ease-out infinite;
      filter: url(#bodhi-turbulence-filter);
    }

    /* ═══════════════════════════════════════════════════
       GLOW — pulsing inset shadow
       ═══════════════════════════════════════════════════ */
    .bodhi-portal-glow {
      position: absolute;
      inset: 0;
      box-shadow:
        inset 0  8px 45px rgba(0, 255, 220, 0.3),
        inset 0 -8px 45px rgba(0, 255, 220, 0.3),
        inset  8px 0 45px rgba(0, 255, 220, 0.3),
        inset -8px 0 45px rgba(0, 255, 220, 0.3);
      animation: bodhiGlowPulse 2s ease-in-out infinite;
    }

    /* ═══════════════════════════════════════════════════
       CORNER FLARES
       ═══════════════════════════════════════════════════ */
    .bodhi-portal-corner {
      position: absolute;
      width: 32px; height: 32px;
      border: 2px solid rgba(0, 255, 220, 0.6);
      transform: rotate(45deg);
      animation: bodhiCornerPulse 2s ease-in-out infinite;
      box-shadow: 0 0 18px rgba(0, 255, 220, 0.4), inset 0 0 8px rgba(0, 255, 220, 0.2);
    }
    .bodhi-portal-corner.tl { top: 6px;    left: 6px;   animation-delay: 0s; }
    .bodhi-portal-corner.tr { top: 6px;    right: 6px;  animation-delay: 0.5s; }
    .bodhi-portal-corner.bl { bottom: 6px; left: 6px;   animation-delay: 1s; }
    .bodhi-portal-corner.br { bottom: 6px; right: 6px;  animation-delay: 1.5s; }

    /* ═══════════════════════════════════════════════════
       SCAN LINE
       ═══════════════════════════════════════════════════ */
    .bodhi-portal-scanline {
      position: absolute;
      left: 0; right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent 0%, rgba(0,255,220,0.5) 20%, rgba(0,255,220,0.9) 50%, rgba(0,255,220,0.5) 80%, transparent 100%);
      box-shadow: 0 0 20px 4px rgba(0,255,220,0.35);
      animation: bodhiScanline 3s ease-in-out infinite;
    }

    /* ═══════════════════════════════════════════════════
       PARTICLES — floating inward from edges
       ═══════════════════════════════════════════════════ */
    .bodhi-portal-particle {
      position: absolute;
      border-radius: 50%;
      background: rgba(0, 255, 220, 0.85);
      box-shadow: 0 0 8px 3px rgba(0, 255, 220, 0.5);
    }
    .bodhi-portal-particle.from-top    { animation: bodhiPDriftDown  var(--dur) ease-in-out infinite; animation-delay: var(--delay); }
    .bodhi-portal-particle.from-bottom { animation: bodhiPDriftUp    var(--dur) ease-in-out infinite; animation-delay: var(--delay); }
    .bodhi-portal-particle.from-left   { animation: bodhiPDriftRight var(--dur) ease-in-out infinite; animation-delay: var(--delay); }
    .bodhi-portal-particle.from-right  { animation: bodhiPDriftLeft  var(--dur) ease-in-out infinite; animation-delay: var(--delay); }

    /* ═══════════════════════════════════════════════════
       KEYFRAMES
       ═══════════════════════════════════════════════════ */
    @keyframes bodhiPortalFadeIn  { from { opacity: 0; } to { opacity: 1; } }
    @keyframes bodhiPortalFadeOut { from { opacity: 1; } to { opacity: 0; } }

    @keyframes bodhiGlowPulse {
      0%, 100% { opacity: 0.5; }
      50%      { opacity: 1; }
    }

    @keyframes bodhiWaveDriftH {
      0%   { transform: translateX(-8px) scaleY(1); }
      50%  { transform: translateX(8px) scaleY(1.15); }
      100% { transform: translateX(-8px) scaleY(1); }
    }
    @keyframes bodhiWaveDriftV {
      0%   { transform: translateY(-8px) scaleX(1); }
      50%  { transform: translateY(8px) scaleX(1.15); }
      100% { transform: translateY(-8px) scaleX(1); }
    }

    @keyframes bodhiSwirlExpand {
      0%   { transform: scale(0.3); opacity: 0.6; border-color: rgba(0,255,220,0.3); }
      100% { transform: scale(2.5); opacity: 0;   border-color: rgba(0,255,220,0); }
    }

    @keyframes bodhiCornerPulse {
      0%, 100% { transform: rotate(45deg) scale(1);   opacity: 0.6; }
      50%      { transform: rotate(45deg) scale(1.3);  opacity: 1; }
    }

    @keyframes bodhiScanline {
      0%   { top: -2px; }
      50%  { top: 100%; }
      100% { top: -2px; }
    }

    @keyframes bodhiPDriftDown {
      0%   { transform: translateY(0) scale(1);   opacity: 0; }
      15%  { opacity: 1; }
      85%  { opacity: 0.8; }
      100% { transform: translateY(80px) scale(0.3); opacity: 0; }
    }
    @keyframes bodhiPDriftUp {
      0%   { transform: translateY(0) scale(1);   opacity: 0; }
      15%  { opacity: 1; }
      85%  { opacity: 0.8; }
      100% { transform: translateY(-80px) scale(0.3); opacity: 0; }
    }
    @keyframes bodhiPDriftRight {
      0%   { transform: translateX(0) scale(1);   opacity: 0; }
      15%  { opacity: 1; }
      85%  { opacity: 0.8; }
      100% { transform: translateX(80px) scale(0.3); opacity: 0; }
    }
    @keyframes bodhiPDriftLeft {
      0%   { transform: translateX(0) scale(1);   opacity: 0; }
      15%  { opacity: 1; }
      85%  { opacity: 0.8; }
      100% { transform: translateX(-80px) scale(0.3); opacity: 0; }
    }
  `;
}

// Injected into the page to build the overlay DOM
function injectPortalDOM() {
    if (document.getElementById("bodhi-portal-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "bodhi-portal-overlay";

    // ── SVG filter for wave turbulence distortion ──
    const svgNS = "http://www.w3.org/2000/svg";
    const svgEl = document.createElementNS(svgNS, "svg");
    svgEl.id = "bodhi-portal-svg-filters";
    svgEl.setAttribute("width", "0");
    svgEl.setAttribute("height", "0");

    const defs = document.createElementNS(svgNS, "defs");
    const filter = document.createElementNS(svgNS, "filter");
    filter.id = "bodhi-turbulence-filter";

    const turb = document.createElementNS(svgNS, "feTurbulence");
    turb.setAttribute("type", "fractalNoise");
    turb.setAttribute("baseFrequency", "0.015 0.04");
    turb.setAttribute("numOctaves", "3");
    turb.setAttribute("seed", "2");
    turb.setAttribute("result", "noise");

    // Animate the turbulence seed to get shifting waves
    const animSeed = document.createElementNS(svgNS, "animate");
    animSeed.setAttribute("attributeName", "seed");
    animSeed.setAttribute("values", "0;100");
    animSeed.setAttribute("dur", "8s");
    animSeed.setAttribute("repeatCount", "indefinite");
    turb.appendChild(animSeed);

    const disp = document.createElementNS(svgNS, "feDisplacementMap");
    disp.setAttribute("in", "SourceGraphic");
    disp.setAttribute("in2", "noise");
    disp.setAttribute("scale", "18");
    disp.setAttribute("xChannelSelector", "R");
    disp.setAttribute("yChannelSelector", "G");

    filter.appendChild(turb);
    filter.appendChild(disp);
    defs.appendChild(filter);
    svgEl.appendChild(defs);
    overlay.appendChild(svgEl);

    // ── Wave border strips ──
    ["top", "right", "bottom", "left"].forEach(side => {
        const wave = document.createElement("div");
        wave.className = `bodhi-wave-border ${side}`;
        overlay.appendChild(wave);
    });

    // ── Glow layer ──
    const glow = document.createElement("div");
    glow.className = "bodhi-portal-glow";
    overlay.appendChild(glow);

    // ── Corner flares ──
    ["tl", "tr", "bl", "br"].forEach(pos => {
        const c = document.createElement("div");
        c.className = `bodhi-portal-corner ${pos}`;
        overlay.appendChild(c);
    });

    // ── Scan line ──
    const scan = document.createElement("div");
    scan.className = "bodhi-portal-scanline";
    overlay.appendChild(scan);

    // ── Nether swirl rings (expanding circles from corners) ──
    const corners = [
        { x: "0%", y: "0%" },
        { x: "100%", y: "0%" },
        { x: "0%", y: "100%" },
        { x: "100%", y: "100%" },
    ];
    corners.forEach((pos, i) => {
        for (let r = 0; r < 3; r++) {
            const ring = document.createElement("div");
            ring.className = "bodhi-nether-swirl";
            ring.style.left = pos.x;
            ring.style.top = pos.y;
            ring.style.width = "120px";
            ring.style.height = "120px";
            ring.style.marginLeft = "-60px";
            ring.style.marginTop = "-60px";
            ring.style.animationDelay = `${(i * 0.4 + r * 1).toFixed(1)}s`;
            overlay.appendChild(ring);
        }
    });

    // ── Particles ──
    const sides = ["from-top", "from-bottom", "from-left", "from-right"];
    for (let i = 0; i < 28; i++) {
        const p = document.createElement("div");
        const sideClass = sides[i % 4];
        const size = 2 + Math.random() * 3;
        p.className = `bodhi-portal-particle ${sideClass}`;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.setProperty("--delay", `${(Math.random() * 3).toFixed(2)}s`);
        p.style.setProperty("--dur", `${(2 + Math.random() * 2).toFixed(2)}s`);

        if (sideClass === "from-top") {
            p.style.top = "0px";
            p.style.left = `${5 + Math.random() * 90}%`;
        } else if (sideClass === "from-bottom") {
            p.style.bottom = "0px";
            p.style.left = `${5 + Math.random() * 90}%`;
        } else if (sideClass === "from-left") {
            p.style.left = "0px";
            p.style.top = `${5 + Math.random() * 90}%`;
        } else {
            p.style.right = "0px";
            p.style.top = `${5 + Math.random() * 90}%`;
        }
        overlay.appendChild(p);
    }

    document.documentElement.appendChild(overlay);
}

// Injected to remove the overlay with a fade-out
function removePortalDOM() {
    const overlay = document.getElementById("bodhi-portal-overlay");
    if (!overlay) return;
    overlay.classList.add("bodhi-portal-closing");
    setTimeout(() => {
        overlay.remove();
        const style = document.getElementById("bodhi-portal-style");
        if (style) style.remove();
    }, 500);
}

// ─── Public API used by sidepanel.ts ───

export function showPortalAnimation(tabId: number) {
    // 1. Inject CSS
    (chrome.scripting.insertCSS as any)({
        target: { tabId },
        css: getPortalCSS(),
    });
    // 2. Inject DOM
    (chrome.scripting.executeScript as any)({
        target: { tabId },
        func: injectPortalDOM,
        world: "MAIN",
    });
}

export function hidePortalAnimation(tabId: number) {
    (chrome.scripting.executeScript as any)({
        target: { tabId },
        func: removePortalDOM,
        world: "MAIN",
    });
}
