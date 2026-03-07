import { SELECTORS } from "../config/selectors";
import { showPortalAnimation, hidePortalAnimation } from "./portal-animation";
import { showZenMode, hideZenMode } from "../zen/zen-mode";
import { generateInsights } from "../zen/zen-insights";
import { callBackendForChat, isAIAvailable, type ChatMessage } from "../config/ai";

// ── DOM refs ──
const loadBtn = document.getElementById("lbtn");
const zenBtn = document.getElementById("zen-btn");
const closeBtn = document.getElementById("close-btn");
const status = document.getElementById("status");
const skeleton = document.getElementById("skeleton");
const container = document.getElementById("container");

const cardImage = document.getElementById("card-image");
const cardTitle = document.getElementById("card-title");
const cardPrice = document.getElementById("card-price");
const cardAvailability = document.getElementById("card-availability");
const cardFeatures = document.getElementById("card-features");
const cardRating = document.getElementById("card-rating");
const cardInsights = document.getElementById("card-insights");
const cardReviews = document.getElementById("card-reviews");
const cardSpecs = document.getElementById("card-specs");
const cardSeller = document.getElementById("card-seller");

// Chat overlay DOM
const chatFab = document.getElementById("chat-fab") as HTMLButtonElement | null;
const chatOverlay = document.getElementById("chat-overlay");
const chatOverlayClose = document.getElementById("chat-overlay-close") as HTMLButtonElement | null;
const chatBadge = document.getElementById("chat-badge");
const chatMessagesEl = document.getElementById("chat-messages");
const chatForm = document.getElementById("chat-form") as HTMLFormElement | null;
const chatInput = document.getElementById("chat-input") as HTMLInputElement | null;
const chatSendBtn = document.getElementById("chat-send-btn") as HTMLButtonElement | null;
const chatHint = document.getElementById("chat-hint");
const chatSuggestions = document.getElementById("chat-suggestions");
const reviewSearch = document.getElementById("review-search") as HTMLInputElement | null;
const profileSection = document.getElementById("user-profile");
const profileBody = document.getElementById("user-profile-body");
const profileHistory = document.getElementById("profile-history");
const profileResetBtn = document.getElementById("profile-reset-btn") as HTMLButtonElement | null;
const profileClearHistoryBtn = document.getElementById("profile-clear-history-btn") as HTMLButtonElement | null;
const statProducts = document.getElementById("stat-products");
const statCategories = document.getElementById("stat-categories");
const statAvgRating = document.getElementById("stat-avg-rating");
// Tabs
const tabInsightsBtn = document.getElementById("tab-insights-btn") as HTMLButtonElement | null;
const tabDetailsBtn = document.getElementById("tab-details-btn") as HTMLButtonElement | null;
const tabProfileBtn = document.getElementById("tab-profile-btn") as HTMLButtonElement | null;
const tabInsights = document.getElementById("tab-insights");
const tabDetails = document.getElementById("tab-details");
const tabProfile = document.getElementById("tab-profile");

const valImage = document.getElementById("val-image") as HTMLImageElement | null;
const valTitle = document.getElementById("val-title");
const valBrand = document.getElementById("val-brand");
const valPrice = document.getElementById("val-price");
const valMrp = document.getElementById("val-mrp");
const valSavings = document.getElementById("val-savings");
const valDeal = document.getElementById("val-deal");
const valCoupon = document.getElementById("val-coupon");
const valEmi = document.getElementById("val-emi");
const valAvailability = document.getElementById("val-availability");
const valDelivery = document.getElementById("val-delivery");
const valFastestDelivery = document.getElementById("val-fastest-delivery");
const valFeatures = document.getElementById("val-features");
const valRatingValue = document.getElementById("val-rating-value");
const valRatingStars = document.getElementById("val-rating-stars");
const valRatingCount = document.getElementById("val-rating-count");
const ratingHistogram = document.getElementById("rating-histogram");
const ratingFilters = document.getElementById("rating-filters");
const valReviews = document.getElementById("val-reviews");
const valSpecs = document.getElementById("val-specs");
const valSeller = document.getElementById("val-seller");

// ── Constants ──
const PORTAL_MIN_DISPLAY_MS = 2000;
const MAX_REVIEWS = 10;
const MAX_FEATURES = 10;
const REVIEW_TRUNCATE_LENGTH = 200;
const EMI_MAX_LENGTH = 80;
const STAGGER_DELAY = 0.07;

// ── State ──
let lastScanData: any = null;
let lastScanTabId: number | null = null;
let lastProductUrl: string = "";
let chatHistory: ChatMessage[] = [];
let isChatSending = false;
let hasAutoScanned = false;

function chatStorageKey(url: string): string {
  const match = url.match(/\/dp\/([A-Z0-9]+)/i) || url.match(/\/gp\/product\/([A-Z0-9]+)/i);
  return match ? `chat_${match[1]}` : "";
}

function saveChatHistory() {
  const key = chatStorageKey(lastProductUrl);
  if (!key || chatHistory.length === 0) return;
  chrome.storage.local.set({ [key]: chatHistory.slice(-40) });
}

function loadChatHistory(url: string) {
  const key = chatStorageKey(url);
  if (!key) return;
  chrome.storage.local.get(key, (result) => {
    const saved: ChatMessage[] = result[key] || [];
    if (saved.length > 0) {
      chatHistory = saved;
      if (chatMessagesEl) {
        chatMessagesEl.innerHTML = "";
        for (const msg of saved) {
          appendChatMessage(msg.role, msg.content);
        }
      }
    }
  });
}

// ── Helpers ──
const insightsDealScore = document.getElementById("insights-deal-score");
const insightsProsList = document.getElementById("insights-pros-list");
const insightsConsList = document.getElementById("insights-cons-list");
const insightsRefreshBtn = document.getElementById("insights-refresh-btn") as HTMLButtonElement | null;

const allCards = () => [cardImage, cardTitle, cardPrice, cardAvailability, cardFeatures, cardRating, cardInsights, cardReviews, cardSpecs, cardSeller];

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function cleanBrandName(raw: string): string {
  return raw
    .replace(/^Visit the\s+/i, "")
    .replace(/\s+Store$/i, "")
    .replace(/^Brand:\s*/i, "")
    .trim();
}

function cleanPrice(raw: string): string {
  return raw.replace(/[\.\s]+$/, "").trim();
}

function truncateText(text: string, max: number): string {
  if (text.length <= max) return text;
  const truncated = text.substring(0, max);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? truncated.substring(0, lastSpace) : truncated) + "…";
}

function parseRatingNumber(ratingText: string): number {
  const match = ratingText.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
}

function renderStars(rating: number): string {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.3;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
  let html = "";
  for (let i = 0; i < fullStars; i++) html += '<span class="star-filled">★</span>';
  if (hasHalf) html += '<span class="star-half">★</span>';
  for (let i = 0; i < emptyStars; i++) html += '<span class="star-empty">★</span>';
  return html;
}

function setScanning(active: boolean) {
  if (!loadBtn) return;
  if (active) {
    loadBtn.classList.add("scanning");
    loadBtn.setAttribute("aria-disabled", "true");
  } else {
    loadBtn.classList.remove("scanning");
    loadBtn.removeAttribute("aria-disabled");
  }
}

function clearPanel() {
  allCards().forEach(card => {
    if (card) {
      card.style.display = "none";
      card.style.animationDelay = "0s";
    }
  });
  const vals = [valTitle, valBrand, valPrice, valMrp, valSavings, valDeal, valCoupon, valEmi,
    valAvailability, valDelivery, valFastestDelivery, valRatingValue, valRatingCount, valSeller];
  vals.forEach(v => { if (v) v.textContent = ""; });
  if (valFeatures) valFeatures.innerHTML = "";
  if (ratingHistogram) ratingHistogram.innerHTML = "";
  if (ratingFilters) ratingFilters.innerHTML = "";
  if (insightsDealScore) insightsDealScore.innerHTML = "";
  if (insightsProsList) insightsProsList.innerHTML = "";
  if (insightsConsList) insightsConsList.innerHTML = "";
  if (valReviews) valReviews.innerHTML = "";
  if (valSpecs) valSpecs.innerHTML = "";
  if (valRatingStars) valRatingStars.innerHTML = "";
  if (valImage) { valImage.src = ""; valImage.alt = ""; }

  // Clear chat
  chatHistory = [];
  if (chatMessagesEl) chatMessagesEl.innerHTML = "";
  if (chatSuggestions) chatSuggestions.innerHTML = "";
}

function renderChatSuggestions(suggestions: string[]) {
  if (!chatSuggestions || !suggestions.length) return;
  chatSuggestions.innerHTML = suggestions
    .map(s => `<button class="chat-suggestion-chip">${escapeHtml(s)}</button>`)
    .join("");
  chatSuggestions.querySelectorAll(".chat-suggestion-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      const text = (btn as HTMLElement).textContent || "";
      if (chatInput) chatInput.value = text;
      handleChatSubmit(text);
      if (chatSuggestions) chatSuggestions.innerHTML = "";
    });
  });
}

let allReviewsHtml: string[] = [];
let allReviewsData: { stars: number; text: string; html: string }[] = [];

function filterReviews(sentiment: string, keyword: string) {
  if (!valReviews) return;
  let filtered = allReviewsData;

  if (sentiment === "positive") {
    filtered = filtered.filter(r => r.stars >= 4);
  } else if (sentiment === "negative") {
    filtered = filtered.filter(r => r.stars <= 3);
  }

  if (keyword) {
    const kw = keyword.toLowerCase();
    filtered = filtered.filter(r => r.text.toLowerCase().includes(kw));
  }

  if (filtered.length === 0) {
    valReviews.innerHTML = `<div class="review-empty">No reviews match your filter.</div>`;
  } else {
    valReviews.innerHTML = filtered.map(r => r.html).join("");
    bindReviewToggles();
  }
}

function bindReviewToggles() {
  if (!valReviews) return;
  valReviews.querySelectorAll(".review-toggle").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const review = (e.currentTarget as HTMLElement).parentElement;
      if (!review) return;
      const expanded = review.classList.toggle("review--expanded");
      (e.currentTarget as HTMLElement).textContent = expanded ? "Show less" : "Show more";
    });
  });
}

type PrefStore = Record<string, Record<string, string>>;

interface PrefEntry {
  value: string;
  question: string;
  label: string;
}

function parsePrefEntry(raw: string): PrefEntry {
  try {
    const p = JSON.parse(raw);
    if (p && p.v) return { value: p.v, question: p.q || "", label: p.l || p.v };
  } catch { /* old format — raw string value */ }

  const hardcodedLabels: Record<string, Record<string, string>> = {
    budget: { low: "Save Money", mid: "Balanced", high: "Premium Quality" },
    usage: { daily: "Every Day", weekly: "Few Times/Week", occasional: "Occasionally" },
    brand: { high: "Very Important", mid: "Somewhat", low: "Not Important" },
    durability: { high: "Built to Last", mid: "Decent Quality", low: "Short-term" },
  };
  return { value: raw, question: "", label: raw };
}

function humanLabel(key: string): string {
  const map: Record<string, string> = {
    budget: "Budget Priority",
    usage: "Usage Frequency",
    brand: "Brand Trust",
    phone_use: "Phone Purpose",
    laptop_use: "Laptop Purpose",
    monitor_use: "Monitor Purpose",
    audio_use: "Audio Purpose",
    durability: "Durability Need",
    battery_importance: "Battery Life",
    connectivity: "Wireless Pref.",
    camera_priority: "Camera Use",
  };
  return map[key] || key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function renderUserProfile(store: PrefStore) {
  if (!profileBody) return;
  const categories = Object.keys(store);
  const hasData = categories.some(c => Object.keys(store[c] || {}).length > 0);

  if (!hasData) {
    profileBody.innerHTML = `<p class="profile-empty-msg">
      Open Zen Mode and take the quiz to build your shopper profile.
    </p>`;
    return;
  }

  let html = "";

  for (const category of categories) {
    const prefs = store[category] || {};
    const prefKeys = Object.keys(prefs);
    if (prefKeys.length === 0) continue;

    const catLabel = category.charAt(0).toUpperCase() + category.slice(1);

    const rows = prefKeys.map(key => {
      const entry = parsePrefEntry(prefs[key]);
      const qLabel = entry.question || humanLabel(key);
      return `<div class="pref-row">
        <span class="pref-question">${escapeHtml(qLabel)}</span>
        <span class="pref-answer">${escapeHtml(entry.label)}</span>
      </div>`;
    }).join("");

    html += `<div class="pref-group">
      <div class="pref-group-title">${escapeHtml(catLabel)}</div>
      ${rows}
    </div>`;
  }

  profileBody.innerHTML = html;
}

function renderHistory(history: HistoryEntry[]) {
  if (!profileHistory) return;
  if (!history || history.length === 0) {
    profileHistory.innerHTML = `<p class="profile-empty-msg">No products scanned yet.</p>`;
    return;
  }

  profileHistory.innerHTML = history.slice(0, 15).map(item => {
    const ago = timeAgo(item.ts);
    const img = item.image
      ? `<img class="history-thumb" src="${escapeHtml(item.image)}" alt="" />`
      : `<div class="history-thumb history-thumb--placeholder">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
         </div>`;
    const title = item.title.length > 55 ? item.title.substring(0, 55) + "…" : item.title;
    return `<a class="history-item" href="${escapeHtml(item.url)}" target="_blank" title="${escapeHtml(item.title)}">
      ${img}
      <div class="history-info">
        <span class="history-title">${escapeHtml(title)}</span>
        <span class="history-meta">${item.price ? escapeHtml(item.price) : ""} ${item.brand ? "· " + escapeHtml(item.brand) : ""}</span>
      </div>
      <span class="history-time">${ago}</span>
    </a>`;
  }).join("");
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

function updateStats(history: HistoryEntry[]) {
  if (statProducts) statProducts.textContent = String(history.length);
  if (statCategories) {
    const cats = new Set(history.map(h => h.category));
    statCategories.textContent = String(cats.size);
  }
  if (statAvgRating) {
    const ratings = history.map(h => {
      const m = (h.rating || "").match(/([\d.]+)/);
      return m ? parseFloat(m[1]) : 0;
    }).filter(r => r > 0);
    statAvgRating.textContent = ratings.length > 0
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : "—";
  }
}

function loadUserProfileFromTab() {
  if (!profileSection) return;

  // Load browsing history from chrome.storage.local
  chrome.storage.local.get(HISTORY_STORAGE_KEY, (result) => {
    const history: HistoryEntry[] = result[HISTORY_STORAGE_KEY] || [];
    renderHistory(history);
    updateStats(history);
  });

  // Load quiz preferences from page localStorage
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id;
    if (!tabId) {
      renderUserProfile({});
      return;
    }

    (chrome.scripting.executeScript as any)({
      target: { tabId },
      world: "MAIN",
      func: () => {
        try {
          const raw = localStorage.getItem("__bodhiPrefs");
          if (!raw) return {};
          const parsed = JSON.parse(raw);
          return parsed && typeof parsed === "object" ? parsed : {};
        } catch {
          return {};
        }
      },
    }, (results: any) => {
      const store = (results && results[0]?.result) || {};
      renderUserProfile(store as PrefStore);
    });
  });
}

function showSkeleton() {
  if (skeleton) skeleton.style.display = "block";
  if (status) status.style.display = "none";
}

function hideSkeleton() {
  if (skeleton) skeleton.style.display = "none";
}

function showStatus(msg: string) {
  if (status) { status.style.display = "block"; status.innerHTML = msg; }
}

function hideStatus() {
  if (status) status.style.display = "none";
}

// ── Data extraction ──
let isScanning = false;

function requestPageData(ratingFilter?: string) {
  if (isScanning) return;
  isScanning = true;

  clearPanel();
  showSkeleton();
  setScanning(true);

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]?.id) {
      isScanning = false;
      setScanning(false);
      hideSkeleton();
      showStatus('<span class="status-icon">⚠️</span>Could not access the current tab.');
      return;
    }

    const tabUrl = tabs[0].url || "";
    const competitorSites = [
      { pattern: "flipkart.", name: "Flipkart" },
      { pattern: "myntra.", name: "Myntra" },
      { pattern: "snapdeal.", name: "Snapdeal" },
      { pattern: "meesho.", name: "Meesho" },
      { pattern: "ajio.", name: "AJIO" },
      { pattern: "jiomart.", name: "JioMart" },
    ];
    const matchedSite = competitorSites.find(s => tabUrl.includes(s.pattern));

    if (matchedSite) {
      isScanning = false;
      setScanning(false);
      hideSkeleton();
      showStatus(`<span class="status-icon">🚧</span><strong>${matchedSite.name}</strong> support is coming soon!<br>Bodhi Leaf currently works on <strong>Amazon</strong> product pages.`);
      return;
    }

    if (!tabUrl.includes("amazon.")) {
      isScanning = false;
      setScanning(false);
      hideSkeleton();
      showStatus('<span class="status-icon">🛒</span>Bodhi Leaf works on <strong>Amazon</strong> product pages.<br>Navigate to a product and try again.');
      return;
    }

    if (!tabUrl.includes("/dp/") && !tabUrl.includes("/gp/product/") && !tabUrl.includes("/product/")) {
      isScanning = false;
      setScanning(false);
      hideSkeleton();
      showStatus('<span class="status-icon">📦</span>Navigate to a specific <strong>product page</strong> on Amazon to scan it.');
      return;
    }

    const tabId = tabs[0].id;
    const portalStart = Date.now();
    showPortalAnimation(tabId);

    (chrome.scripting.executeScript as any)({
      target: { tabId },
      world: "MAIN",
      func: function (selectors: any, ratingFilter: string | undefined) {
        const cleanText = (el: Element): string => {
          const clone = el.cloneNode(true) as HTMLElement;
          clone.querySelectorAll("script, style, noscript, template").forEach(s => s.remove());
          return clone.textContent?.trim().replace(/\s+/g, " ") || "";
        };
        const getText = (sel: string) => {
          const el = document.querySelector(sel);
          return el ? cleanText(el) : "";
        };
        const getAttr = (sel: string, attr: string) => {
          const el = document.querySelector(sel);
          return el ? (el.getAttribute(attr) || "") : "";
        };
        const getList = (sel: string) => {
          return Array.from(document.querySelectorAll(sel)).map(e => cleanText(e)).filter(Boolean);
        };
        const getTableRows = (sel: string) => {
          return Array.from(document.querySelectorAll(sel)).map(tr => {
            const cells = tr.querySelectorAll("th, td");
            if (cells.length >= 2) {
              return { label: cleanText(cells[0]), value: cleanText(cells[1]) };
            }
            return null;
          }).filter(Boolean);
        };

        const s = selectors.amazon;
        const data: any = {
          title: getText(s.productName),
          brand: getText(s.productBrand),
          price: getText(s.productPrice),
          priceFraction: getText(s.productPriceFraction),
          listPrice: getText(s.listPrice),
          savings: getText(s.savingsPercent),
          dealBadge: getText(s.dealBadge),
          coupon: getText(s.coupon),
          emi: getText(s.emiOptions),
          availability: getText(s.availability),
          delivery: getText(s.deliveryMessage),
          fastestDelivery: getText(s.fastestDelivery),
          mainImage: getAttr(s.mainImage, "src"),
          features: getList(s.features),
          ratingValue: getText(s.ratingValue),
          ratingCount: getText(s.ratingCount),
          ratingBtns: Array.from(document.querySelectorAll(s.ratingFilterBtns)).map((el: Element) => {
            if (el instanceof HTMLElement) {
              const cells = el.querySelectorAll("td");
              const label = cells[0] ? cleanText(cells[0]) : "";
              const pct = cells[2] ? cleanText(cells[2]) : (cells[1] ? cleanText(cells[1]) : "");
              return {
                text: cleanText(el),
                label: label,
                pct: pct,
                selected: el.classList.contains("a-histogram-row-selected") || false
              };
            }
            return null;
          }).filter(Boolean),
          reviews: Array.from(document.querySelectorAll(s.reviewDivs)).slice(0, 10).map((rev: Element) => {
            const titleEl = rev.querySelector(s.reviewTitle);
            const bodyEl = rev.querySelector(s.reviewBody);
            const nameEl = rev.querySelector(s.reviewerName);
            const starsEl = rev.querySelector(s.reviewStars);
            const dateEl = rev.querySelector(s.reviewDate);
            return {
              title: titleEl ? cleanText(titleEl) : "",
              body: bodyEl ? cleanText(bodyEl) : "",
              author: nameEl ? cleanText(nameEl) : "",
              stars: starsEl ? cleanText(starsEl) : "",
              date: dateEl ? cleanText(dateEl) : "",
            };
          }),
          specs: getTableRows(s.technicalDetails),
          seller: getText(s.buyBoxSeller),
        };

        if (ratingFilter) {
          data.reviews = data.reviews.filter((r: any) =>
            r.title?.includes(ratingFilter) || r.body?.includes(ratingFilter)
          );
        }
        return data;
      },
      args: ratingFilter ? [SELECTORS, ratingFilter] : [SELECTORS]
    }, (results: any) => {
      const elapsed = Date.now() - portalStart;
      const remaining = Math.max(0, PORTAL_MIN_DISPLAY_MS - elapsed);
      setTimeout(() => {
        hidePortalAnimation(tabId);
        hideSkeleton();
        isScanning = false;
        setScanning(false);

        if (results && results[0]?.result) {
          lastScanData = results[0].result;
          lastScanTabId = tabId;
          lastProductUrl = tabUrl;
          populatePanel(results[0].result, ratingFilter);
          setZenEnabled(true);
          container?.scrollTo({ top: 0, behavior: "smooth" });
          loadUserProfileFromTab();
          loadChatHistory(tabUrl);
        } else {
          lastScanData = null;
          lastScanTabId = null;
          setZenEnabled(false);
          showStatus('<span class="status-icon">🔍</span>No product data found on this page.');
        }
      }, remaining);
    });
  });
}

// ── Browsing history persistence ──
const HISTORY_STORAGE_KEY = "__bodhiHistory";
const HISTORY_MAX_ITEMS = 30;

interface HistoryEntry {
  title: string;
  price: string;
  image: string;
  url: string;
  brand: string;
  rating: string;
  category: string;
  ts: number;
}

function detectProductCategory(title: string, features: string[]): string {
  const text = `${title} ${features.join(" ")}`.toLowerCase();
  if (/phone|smartphone|mobile|iphone/i.test(text)) return "Phones";
  if (/laptop|notebook|macbook|chromebook/i.test(text)) return "Laptops";
  if (/monitor|display(?! phone)/i.test(text)) return "Monitors";
  if (/headphone|earphone|earbuds|headset|tws|speaker/i.test(text)) return "Audio";
  if (/camera|dslr|mirrorless|gopro/i.test(text)) return "Cameras";
  if (/tablet|ipad/i.test(text)) return "Tablets";
  if (/keyboard|mouse|gaming/i.test(text)) return "Peripherals";
  if (/watch|smartwatch|band/i.test(text)) return "Wearables";
  if (/tv|television/i.test(text)) return "TVs";
  return "Other";
}

function saveToHistory(data: any, url: string) {
  if (!data.title || !url) return;
  const entry: HistoryEntry = {
    title: data.title,
    price: data.price ? `₹${cleanPrice(data.price)}` : "",
    image: data.mainImage || "",
    url,
    brand: data.brand ? cleanBrandName(data.brand) : "",
    rating: data.ratingValue || "",
    category: detectProductCategory(data.title, data.features || []),
    ts: Date.now(),
  };
  chrome.storage.local.get(HISTORY_STORAGE_KEY, (result) => {
    let history: HistoryEntry[] = result[HISTORY_STORAGE_KEY] || [];
    history = history.filter(h => h.url !== url);
    history.unshift(entry);
    if (history.length > HISTORY_MAX_ITEMS) history = history.slice(0, HISTORY_MAX_ITEMS);
    chrome.storage.local.set({ [HISTORY_STORAGE_KEY]: history });
  });
}

// ── Populate ──
function populatePanel(data: any, _ratingFilter?: string) {
  clearPanel();
  hideStatus();

  saveToHistory(data, lastProductUrl);

  let staggerIdx = 0;
  function revealCard(card: HTMLElement | null) {
    if (!card) return;
    card.style.display = "block";
    card.style.animationDelay = `${staggerIdx * STAGGER_DELAY}s`;
    staggerIdx++;
  }

  // Image
  if (data.mainImage && cardImage && valImage) {
    revealCard(cardImage);
    valImage.src = data.mainImage;
    valImage.alt = data.title || "Product";
  }

  // Title + brand
  if (data.title && cardTitle && valTitle) {
    revealCard(cardTitle);
    valTitle.textContent = data.title;
    if (valBrand && data.brand) {
      const brand = cleanBrandName(data.brand);
      if (brand) valBrand.textContent = brand;
    }
  }

  // Price block
  if (data.price && cardPrice && valPrice) {
    revealCard(cardPrice);
    const price = cleanPrice(data.price);
    const fraction = data.priceFraction ? `.${data.priceFraction}` : "";
    valPrice.textContent = `₹${price}${fraction}`;
    if (valMrp && data.listPrice) valMrp.textContent = data.listPrice;
    if (valSavings && data.savings) valSavings.textContent = data.savings;
    if (valDeal && data.dealBadge) {
      valDeal.className = "badge-deal";
      valDeal.textContent = `🏷️ ${data.dealBadge}`;
    }
    if (valCoupon && data.coupon) {
      valCoupon.className = "badge-coupon";
      valCoupon.textContent = `🎟️ ${data.coupon}`;
    }
    if (valEmi && data.emi) {
      const emiText = truncateText(data.emi, EMI_MAX_LENGTH);
      valEmi.className = "emi-line";
      valEmi.innerHTML = `<span class="emi-icon">💳</span> ${escapeHtml(emiText)}`;
    }
  }

  // Availability & delivery
  if ((data.availability || data.delivery) && cardAvailability) {
    revealCard(cardAvailability);
    if (valAvailability && data.availability) valAvailability.textContent = data.availability;
    if (valDelivery && data.delivery) valDelivery.innerHTML = `📦 ${escapeHtml(data.delivery)}`;
    if (valFastestDelivery && data.fastestDelivery) valFastestDelivery.innerHTML = `⚡ ${escapeHtml(data.fastestDelivery)}`;
  }

  // Features
  if (data.features?.length && cardFeatures && valFeatures) {
    revealCard(cardFeatures);
    valFeatures.innerHTML = data.features.slice(0, MAX_FEATURES)
      .map((f: string) => `<li>${escapeHtml(f)}</li>`)
      .join("");
  }

  // Rating
  if (data.ratingValue && cardRating) {
    revealCard(cardRating);
    const numRating = parseRatingNumber(data.ratingValue);
    if (valRatingValue) valRatingValue.textContent = numRating.toFixed(1);
    if (valRatingStars) valRatingStars.innerHTML = renderStars(numRating);
    if (valRatingCount) {
      const countMatch = (data.ratingCount || "").match(/([\d,]+)\s*(?:ratings?|reviews?|global ratings?)/i);
      valRatingCount.textContent = countMatch ? `${countMatch[1]} ratings` : "";
    }

    // Histogram bars
    if (data.ratingBtns?.length && ratingHistogram) {
      const histogramData = data.ratingBtns
        .map((btn: any) => {
          const labelMatch = btn.label?.match(/(\d)\s*star/i);
          const pctMatch = btn.pct?.match(/(\d+)/);
          if (labelMatch && pctMatch) {
            return { stars: parseInt(labelMatch[1]), pct: parseInt(pctMatch[1]) };
          }
          return null;
        })
        .filter(Boolean);

      if (histogramData.length > 0) {
        ratingHistogram.innerHTML = histogramData.map((row: any) =>
          `<div class="histogram-row" data-star="${row.stars}">
            <span class="histogram-label">${row.stars} star</span>
            <div class="histogram-bar-track">
              <div class="histogram-bar-fill" style="width: ${row.pct}%"></div>
            </div>
            <span class="histogram-pct">${row.pct}%</span>
          </div>`
        ).join("");

        Array.from(ratingHistogram.querySelectorAll(".histogram-row")).forEach(el => {
          el.addEventListener("click", () => {
            const star = (el as HTMLElement).dataset.star || "";
            requestPageData(`${star} star`);
          });
        });
      }
    }

    // Fallback to text buttons if histogram parsing fails
    if (data.ratingBtns?.length && ratingHistogram && !ratingHistogram.innerHTML && ratingFilters) {
      ratingFilters.innerHTML = data.ratingBtns.map((btn: any, idx: number) =>
        `<button class="rating-btn${btn.selected ? " selected" : ""}" data-idx="${idx}">${escapeHtml(btn.text)}</button>`
      ).join("");
      Array.from(ratingFilters.querySelectorAll(".rating-btn")).forEach((el: Element) => {
        el.addEventListener("click", (e) => {
          const filter = (e.currentTarget as HTMLElement).textContent?.trim() || "";
          requestPageData(filter);
        });
      });
    }
  }

  // AI Insights (async — show loading, then populate)
  if (cardInsights) {
    revealCard(cardInsights);
    showInsightsLoading();
    loadInsightsAsync(data);
  }

  // Reviews
  if (data.reviews?.length && cardReviews && valReviews) {
    revealCard(cardReviews);
    allReviewsData = data.reviews.slice(0, MAX_REVIEWS).map((r: any) => {
      const starNum = parseRatingNumber(r.stars);
      const starsHtml = starNum > 0
        ? `<div class="review-stars">${renderStars(starNum)} ${starNum.toFixed(1)}</div>`
        : "";
      const title = r.title ? `<div class="review-title-text">${escapeHtml(r.title)}</div>` : "";
      const author = r.author ? `<span class="review-author">${escapeHtml(r.author)}</span>` : "";
      const date = r.date ? `<span class="review-date">${escapeHtml(r.date)}</span>` : "";
      const meta = (author || date) ? `<div class="review-meta">${author}${date}</div>` : "";
      const body = r.body ? `<div class="review-body-text">${escapeHtml(r.body)}</div>` : "";
      const needsToggle = (r.body?.length || 0) > REVIEW_TRUNCATE_LENGTH;
      const toggle = needsToggle ? `<button class="review-toggle">Show more</button>` : "";
      const html = `<div class="review">${starsHtml}${title}${meta}${body}${toggle}</div>`;
      return { stars: starNum, text: `${r.title || ""} ${r.body || ""}`, html };
    });

    valReviews.innerHTML = allReviewsData.map(r => r.html).join("");
    bindReviewToggles();
  }

  // Tech specs
  if (data.specs?.length && cardSpecs && valSpecs) {
    revealCard(cardSpecs);
    valSpecs.innerHTML = data.specs.map((row: any) =>
      `<tr><td>${escapeHtml(row.label)}</td><td>${escapeHtml(row.value)}</td></tr>`
    ).join("");
  }

  // Seller
  if (data.seller && cardSeller && valSeller) {
    revealCard(cardSeller);
    valSeller.innerHTML = `<span class="seller-badge">${escapeHtml(data.seller)}</span>`;
  }

  // Stay on Details tab after scan (default landing view)
  switchToTab("details");
}

// ── AI Insights helpers ──

let cachedInsights: Awaited<ReturnType<typeof generateInsights>> | null = null;

function showInsightsLoading() {
  if (insightsDealScore) {
    insightsDealScore.innerHTML = `
      <div class="insights-loading">
        <div class="insights-loading-spinner"></div>
        <span>Analyzing with AI…</span>
      </div>
    `;
  }
  if (insightsProsList) insightsProsList.innerHTML = "";
  if (insightsConsList) insightsConsList.innerHTML = "";
}

function renderInsights(insights: Awaited<ReturnType<typeof generateInsights>>) {
  const sourceText = insights.source === "local" ? "Local" : "AI";
  const sourceLabel = insights.source !== "local"
    ? `<span class="insights-source insights-source--ai">${sourceText}</span>`
    : '<span class="insights-source insights-source--local">Local</span>';

  if (insightsDealScore) {
    const scoreColor = insights.dealScore >= 7 ? "#34c759"
      : insights.dealScore >= 4 ? "#f5a623" : "#ff453a";
    insightsDealScore.innerHTML = `
      <div class="deal-score-badge" style="border-color: ${scoreColor}20">
        <span class="deal-score-number" style="color: ${scoreColor}">${insights.dealScore}</span>
        <span class="deal-score-label">/ 10</span>
      </div>
      <div class="deal-score-info">
        <span class="deal-score-verdict">${escapeHtml(insights.dealVerdict)}</span>
        ${sourceLabel}
      </div>
    `;
  }

  if (insightsProsList) {
    insightsProsList.innerHTML = insights.pros.length > 0
      ? insights.pros.map(p => `<li>${escapeHtml(p)}</li>`).join("")
      : `<li class="insight-empty">No strong positives detected</li>`;
  }

  if (insightsConsList) {
    insightsConsList.innerHTML = insights.cons.length > 0
      ? insights.cons.map(c => `<li>${escapeHtml(c)}</li>`).join("")
      : `<li class="insight-empty">No significant negatives detected</li>`;
  }

  // Layman spec explanations
  const specsExplained = (insights as any).specsExplained || [];
  if (specsExplained.length > 0 && insightsDealScore?.parentElement) {
    let existingSpecs = insightsDealScore.parentElement.querySelector(".specs-layman");
    if (existingSpecs) existingSpecs.remove();
    const section = document.createElement("div");
    section.className = "specs-layman";
    section.innerHTML = `
      <div class="specs-layman-title">What the specs mean</div>
      ${specsExplained.map((s: any) => `
        <div class="spec-layman-row">
          <span class="spec-layman-label">${escapeHtml(s.label)}</span>
          <span class="spec-layman-original">${escapeHtml(s.original)}</span>
          <span class="spec-layman-explain">${escapeHtml(s.layman)}</span>
        </div>
      `).join("")}
    `;
    insightsDealScore.parentElement.appendChild(section);
  }

  // Chat suggestions from AI
  if ((insights as any).chatSuggestions?.length) {
    renderChatSuggestions((insights as any).chatSuggestions);
  }
}

async function loadInsightsAsync(data: any) {
  try {
    const insights = await generateInsights(data);
    cachedInsights = insights;
    renderInsights(insights);
  } catch (err) {
    console.error("[bodhi-leaf] Insights generation failed:", err);
    if (insightsDealScore) {
      insightsDealScore.innerHTML = `<span class="insight-empty">Could not generate insights</span>`;
    }
  }
}

// ── Zen Mode ──
let zenActive = false;
let zenLoading = false;

function setZenEnabled(enabled: boolean) {
  if (!zenBtn) return;
  if (enabled) {
    zenBtn.classList.remove("zen-disabled");
    zenBtn.removeAttribute("aria-disabled");
  } else {
    zenBtn.classList.add("zen-disabled");
    zenBtn.setAttribute("aria-disabled", "true");
  }
}

function syncZenState(tabId: number): Promise<boolean> {
  return new Promise((resolve) => {
    (chrome.scripting.executeScript as any)({
      target: { tabId },
      world: "MAIN",
      func: () => !!document.getElementById("bodhi-zen-backdrop"),
    }, (results: any) => {
      resolve(results?.[0]?.result === true);
    });
  });
}

async function toggleZenMode() {
  if (!lastScanData || !lastScanTabId || zenLoading) return;

  const overlayExists = await syncZenState(lastScanTabId);
  if (zenActive && !overlayExists) {
    zenActive = false;
    zenBtn?.classList.remove("zen-active");
  }

  if (zenActive || overlayExists) {
    hideZenMode(lastScanTabId);
    zenActive = false;
    zenBtn?.classList.remove("zen-active");
    return;
  }

  zenLoading = true;
  zenBtn?.classList.add("zen-loading");

  try {
    const insights = cachedInsights || await generateInsights(lastScanData);
    cachedInsights = insights;
    showZenMode(lastScanTabId, lastScanData, insights);
    zenActive = true;
    zenBtn?.classList.add("zen-active");
  } catch (err) {
    console.error("[bodhi-leaf] Zen mode insights failed:", err);
  } finally {
    zenLoading = false;
    zenBtn?.classList.remove("zen-loading");
  }
}

// ── Init ──

// Tab switching
type TabName = "insights" | "details" | "profile";
const tabBtns: Record<TabName, HTMLButtonElement | null> = {
  insights: tabInsightsBtn,
  details: tabDetailsBtn,
  profile: tabProfileBtn,
};
const tabPanes: Record<TabName, HTMLElement | null> = {
  insights: tabInsights,
  details: tabDetails,
  profile: tabProfile,
};

function switchToTab(tab: TabName) {
  for (const key of Object.keys(tabBtns) as TabName[]) {
    const btn = tabBtns[key];
    const pane = tabPanes[key];
    if (key === tab) {
      btn?.classList.add("active");
      btn?.setAttribute("aria-selected", "true");
      if (pane) pane.style.display = "block";
    } else {
      btn?.classList.remove("active");
      btn?.setAttribute("aria-selected", "false");
      if (pane) pane.style.display = "none";
    }
  }
  if (tab === "profile") loadUserProfileFromTab();
}

loadBtn?.addEventListener("click", () => {
  cachedInsights = null;
  requestPageData();
});

zenBtn?.addEventListener("click", () => {
  toggleZenMode();
});

closeBtn?.addEventListener("click", () => {
  window.close();
});

// Auto-scan when the sidepanel loads
if (!hasAutoScanned) {
  hasAutoScanned = true;
  cachedInsights = null;
  requestPageData();
}

tabInsightsBtn?.addEventListener("click", () => switchToTab("insights"));
tabDetailsBtn?.addEventListener("click", () => switchToTab("details"));
tabProfileBtn?.addEventListener("click", () => switchToTab("profile"));

// Insights refresh button - re-generate AI insights
insightsRefreshBtn?.addEventListener("click", async () => {
  if (!lastScanData || !insightsRefreshBtn) return;

  // Show loading state
  insightsRefreshBtn.classList.add("refreshing");
  insightsRefreshBtn.disabled = true;

  // Clear cached insights to force regeneration
  cachedInsights = null;
  showInsightsLoading();

  try {
    await loadInsightsAsync(lastScanData);
  } finally {
    insightsRefreshBtn.classList.remove("refreshing");
    insightsRefreshBtn.disabled = false;
  }
});

// Clear browsing history
profileClearHistoryBtn?.addEventListener("click", () => {
  chrome.storage.local.remove(HISTORY_STORAGE_KEY, () => {
    renderHistory([]);
    updateStats([]);
  });
});

// Reset quiz preferences
profileResetBtn?.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id;
    if (!tabId) return;
    (chrome.scripting.executeScript as any)({
      target: { tabId },
      world: "MAIN",
      func: () => {
        try {
          localStorage.removeItem("__bodhiPrefs");
        } catch { /* ignore */ }
      },
    }, () => {
      renderUserProfile({});
    });
  });
});

// ── Chat FAB + Overlay ──
let chatOverlayOpen = false;
let unreadCount = 0;

function toggleChatOverlay(open?: boolean) {
  const shouldOpen = open !== undefined ? open : !chatOverlayOpen;
  chatOverlayOpen = shouldOpen;
  if (chatOverlay) chatOverlay.style.display = shouldOpen ? "flex" : "none";
  chatFab?.classList.toggle("chat-fab--open", shouldOpen);
  if (shouldOpen) {
    unreadCount = 0;
    if (chatBadge) chatBadge.style.display = "none";
    chatInput?.focus();
    if (chatMessagesEl) chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
  }
}

chatFab?.addEventListener("click", () => toggleChatOverlay());
chatOverlayClose?.addEventListener("click", () => toggleChatOverlay(false));

function incrementUnread() {
  if (chatOverlayOpen) return;
  unreadCount++;
  if (chatBadge) {
    chatBadge.textContent = String(unreadCount);
    chatBadge.style.display = "flex";
  }
}

// Chat helpers
function appendChatMessage(role: "user" | "assistant" | "error", text: string) {
  if (!chatMessagesEl) return;
  const div = document.createElement("div");
  div.classList.add("chat-message");
  if (role === "user") div.classList.add("chat-message-user");
  else if (role === "assistant") div.classList.add("chat-message-assistant");
  else div.classList.add("chat-message-error");
  div.textContent = text;
  chatMessagesEl.appendChild(div);
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

async function handleChatSubmit(message: string) {
  if (!lastScanData || !isAIAvailable() || isChatSending) return;
  if (!message.trim()) return;

  isChatSending = true;
  if (chatSendBtn) chatSendBtn.disabled = true;

  appendChatMessage("user", message.trim());
  const userMsg: ChatMessage = { role: "user", content: message.trim() };
  chatHistory.push(userMsg);

  try {
    const response = await callBackendForChat(lastScanData, chatHistory, message.trim());
    const answer = response.answer ?? "";
    appendChatMessage("assistant", answer);
    chatHistory.push({ role: "assistant", content: answer });
    saveChatHistory();
    incrementUnread();
  } catch (err) {
    console.error("[bodhi-leaf] Chat failed:", err);
    appendChatMessage("error", "Sorry, the product chat is unavailable right now. Please try again in a moment.");
  } finally {
    isChatSending = false;
    if (chatSendBtn) chatSendBtn.disabled = false;
  }
}

chatForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const value = chatInput?.value ?? "";
  if (!value.trim()) return;
  if (chatInput) chatInput.value = "";
  handleChatSubmit(value);
});

// Review filtering
let currentSentiment = "all";
reviewSearch?.addEventListener("input", () => {
  filterReviews(currentSentiment, reviewSearch.value);
});

document.querySelectorAll(".review-sentiment-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".review-sentiment-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentSentiment = (btn as HTMLElement).dataset.sentiment || "all";
    filterReviews(currentSentiment, reviewSearch?.value || "");
  });
});
