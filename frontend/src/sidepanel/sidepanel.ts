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
const profileResetBtn = document.getElementById("profile-reset-btn") as HTMLButtonElement | null;
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

function renderUserProfile(store: PrefStore) {
  if (!profileBody || !profileSection) return;
  const categories = Object.keys(store);
  if (categories.length === 0) {
    profileBody.innerHTML = `<div class="profile-empty-state">
      <div class="profile-empty-icon">🎯</div>
      <h3>No Preferences Yet</h3>
      <p>Open Zen Mode and take the quick quiz to get personalized product recommendations.</p>
    </div>`;
    return;
  }

  // Helper: map internal keys/values to human-friendly text
  function humanLabel(key: string) {
    const map: Record<string, string> = {
      budget: "Budget Priority",
      usage: "How Often You'll Use It",
      brand: "Brand Trust",
      phone_use: "Phone Purpose",
      laptop_use: "Laptop Purpose",
      monitor_use: "Monitor Purpose",
      audio_use: "Audio Purpose",
      durability: "Durability Need",
      battery_importance: "Battery Life Need",
      connectivity: "Wireless Preference",
      camera_priority: "Camera Use",
    };
    return map[key] || key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }

  function humanValue(key: string, val: string) {
    const v = String(val);
    const lookup: Record<string, Record<string, string>> = {
      budget: { low: "💰 Save Money", mid: "⚖️ Balanced", high: "⭐ Premium Quality" },
      usage: { daily: "📅 Every Day", weekly: "📆 Few Times/Week", occasional: "🗓️ Occasionally" },
      brand: { high: "✅ Very Important", mid: "😐 Somewhat", low: "❌ Not Important" },
      phone_use: { camera: "📸 Camera Focus", gaming: "🎮 Gaming", basic: "📞 Calls & Basics", battery: "🔋 Battery Life" },
      laptop_use: { work: "💼 Work/Coding", gaming: "🎮 Gaming", casual: "🌐 Browsing/Media" },
      monitor_use: { work: "💼 Productivity", gaming: "🎮 Gaming", creative: "🎨 Content Creation" },
      audio_use: { music: "🎵 Music", calls: "📞 Calls/Meetings", gaming: "🎮 Gaming", commute: "🚇 Commute", workout: "💪 Workout", home: "🏠 Home Use" },
      durability: { high: "🏗️ Built to Last", mid: "📦 Decent Quality", low: "💨 Short-term" },
      battery_importance: { high: "🔋 All Day (8+ hrs)", mid: "🔋 Moderate (4-6 hrs)", low: "🔌 Charge Often" },
      connectivity: { essential: "📡 Must Be Wireless", preferred: "📶 Nice to Have", no: "🔌 Wired is Fine" },
      camera_priority: { content: "🎬 Content Creation", social: "📱 Social Media", basic: "📹 Video Calls" },
    };
    return (lookup[key] && lookup[key][v]) || v;
  }

  // Helper: get score for visualization
  function getScoreForPref(key: string, val: string): number {
    const scoreMap: Record<string, Record<string, number>> = {
      budget: { low: 30, mid: 65, high: 90 },
      usage: { daily: 90, weekly: 60, occasional: 30 },
      brand: { high: 90, mid: 60, low: 30 },
      durability: { high: 90, mid: 60, low: 30 },
      battery_importance: { high: 90, mid: 60, low: 30 },
    };
    return (scoreMap[key] && scoreMap[key][val]) || 50;
  }

  // Helper: get color based on score
  function getScoreColor(score: number): string {
    if (score >= 70) return "#34c759";
    if (score >= 40) return "#f5a623";
    return "#ff453a";
  }

  let html = "";

  // Summary stats
  let totalPrefs = 0;
  let totalScore = 0;

  for (const category of categories) {
    const prefs = store[category] || {};
    const prefKeys = Object.keys(prefs);
    if (prefKeys.length === 0) continue;

    // Calculate category score
    let catScore = 0;
    prefKeys.forEach(key => {
      const score = getScoreForPref(key, prefs[key]);
      catScore += score;
      totalScore += score;
      totalPrefs++;
    });
    const avgScore = Math.round(catScore / prefKeys.length);
    const catColor = getScoreColor(avgScore);

    const label = category.charAt(0).toUpperCase() + category.slice(1);

    // Build preference bars
    const prefBars = prefKeys.map((key) => {
      const val = prefs[key];
      const score = getScoreForPref(key, val);
      const color = getScoreColor(score);
      const humanVal = humanValue(key, val);
      // Strip emoji from humanVal for the bar
      const cleanLabel = humanVal.replace(/[\u{1F300}-\u{1F9FF}]/gu, "").trim();
      const emoji = humanVal.match(/[\u{1F300}-\u{1F9FF}]/gu)?.[0] || "📊";

      return `<div class="profile-pref-bar">
        <div class="profile-pref-bar-header">
          <span class="profile-pref-bar-label">${escapeHtml(emoji)} ${escapeHtml(humanLabel(key))}</span>
          <span class="profile-pref-bar-value">${escapeHtml(cleanLabel)}</span>
        </div>
        <div class="profile-pref-bar-track">
          <div class="profile-pref-bar-fill" style="width: ${score}%; background: ${color};"></div>
        </div>
      </div>`;
    }).join("");

    html += `<div class="profile-category">
      <div class="profile-category-header">
        <div class="profile-category-title">${escapeHtml(label)}</div>
        <div class="profile-category-score" style="color: ${catColor}">${avgScore}% Match</div>
      </div>
      <div class="profile-pref-bars">${prefBars}</div>
    </div>`;
  }

  // Overall match score
  const overallScore = totalPrefs > 0 ? Math.round(totalScore / totalPrefs) : 0;
  const overallColor = getScoreColor(overallScore);

  const overallHtml = `<div class="profile-overall">
    <div class="profile-overall-label">Your Shopping Profile</div>
    <div class="profile-overall-score">
      <div class="profile-overall-ring" style="--score-color: ${overallColor}; --score-pct: ${overallScore}">
        <span class="profile-overall-number" style="color: ${overallColor}">${overallScore}</span>
        <span class="profile-overall-unit">%</span>
      </div>
      <div class="profile-overall-text">Profile Strength</div>
    </div>
  </div>`;

  if (!html) {
    profileBody.innerHTML = `<div class="profile-empty-state">
      <div class="profile-empty-icon">🎯</div>
      <h3>No Preferences Yet</h3>
      <p>Open Zen Mode and take the quick quiz to get personalized product recommendations.</p>
    </div>`;
  } else {
    profileBody.innerHTML = overallHtml + html;
  }
}

function loadUserProfileFromTab() {
  if (!profileSection) return;

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

// ── Populate ──
function populatePanel(data: any, _ratingFilter?: string) {
  clearPanel();
  hideStatus();

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

// User profile reset – clears all saved MCQ preferences for this origin
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
        } catch {
          // ignore
        }
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
