const toggleBtn = document.getElementById("a11y-toggle-btn") as HTMLButtonElement | null;
const panel = document.getElementById("a11y-panel");

const fontDecrease = document.getElementById("font-decrease");
const fontIncrease = document.getElementById("font-increase");
const fontDisplay = document.getElementById("font-size-display");

const spacingDecrease = document.getElementById("spacing-decrease");
const spacingIncrease = document.getElementById("spacing-increase");
const spacingDisplay = document.getElementById("spacing-display");

const root = document.documentElement;

let fontScale = 1;
let spacingLevel = 0;

const FONT_STEP = 0.1;
const FONT_MIN = 0.7;
const FONT_MAX = 1.6;
const SPACING_STEP = 0.03;
const SPACING_MAX = 0.15;
const SPACING_LABELS = ["Normal", "Wide", "Wider", "Widest"];

toggleBtn?.addEventListener("click", () => {
  if (!panel) return;
  const isHidden = panel.hasAttribute("hidden");
  if (isHidden) {
    panel.removeAttribute("hidden");
    toggleBtn.classList.add("active");
    toggleBtn.setAttribute("aria-expanded", "true");
  } else {
    panel.setAttribute("hidden", "");
    toggleBtn.classList.remove("active");
    toggleBtn.setAttribute("aria-expanded", "false");
  }
});

function updateFont() {
  root.style.setProperty("--a11y-font-scale", String(fontScale));
  if (fontDisplay) fontDisplay.textContent = `${Math.round(fontScale * 100)}%`;
}

function updateSpacing() {
  const em = spacingLevel * SPACING_STEP;
  root.style.setProperty("--a11y-letter-spacing", `${em}em`);
  if (spacingDisplay) {
    spacingDisplay.textContent = SPACING_LABELS[Math.min(spacingLevel, SPACING_LABELS.length - 1)] || `+${spacingLevel}`;
  }
}

fontDecrease?.addEventListener("click", () => {
  fontScale = Math.max(FONT_MIN, +(fontScale - FONT_STEP).toFixed(2));
  updateFont();
});

fontIncrease?.addEventListener("click", () => {
  fontScale = Math.min(FONT_MAX, +(fontScale + FONT_STEP).toFixed(2));
  updateFont();
});

spacingDecrease?.addEventListener("click", () => {
  spacingLevel = Math.max(0, spacingLevel - 1);
  updateSpacing();
});

spacingIncrease?.addEventListener("click", () => {
  spacingLevel = Math.min(5, spacingLevel + 1);
  updateSpacing();
});

document.querySelectorAll(".a11y-mode-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".a11y-mode-btn").forEach(b => {
      b.classList.remove("active");
      b.setAttribute("aria-pressed", "false");
    });
    btn.classList.add("active");
    btn.setAttribute("aria-pressed", "true");
    const mode = (btn as HTMLElement).dataset.mode || "normal";
    document.body.setAttribute("data-color-mode", mode === "normal" ? "" : mode);
    if (mode === "normal") document.body.removeAttribute("data-color-mode");
  });
});
