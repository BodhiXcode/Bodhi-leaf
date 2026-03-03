import { SELECTORS } from "../config/selectors";
import { showPortalAnimation, hidePortalAnimation } from "./portal-animation";
import { showZenMode, hideZenMode } from "../zen/zen-mode";
import { generateInsights } from "../zen/zen-insights";

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

// ── Helpers ──
const insightsDealScore = document.getElementById("insights-deal-score");
const insightsProsList = document.getElementById("insights-pros-list");
const insightsConsList = document.getElementById("insights-cons-list");

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
    if (!tabUrl.includes("amazon.")) {
      isScanning = false;
      setScanning(false);
      hideSkeleton();
      showStatus('<span class="status-icon">🛒</span>Bodhi Leaf works on <strong>Amazon</strong> product pages.<br>Navigate to a product and try again.');
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
          populatePanel(results[0].result, ratingFilter);
          setZenEnabled(true);
          container?.scrollTo({ top: 0, behavior: "smooth" });
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
    valReviews.innerHTML = data.reviews.slice(0, MAX_REVIEWS).map((r: any) => {
      const starNum = parseRatingNumber(r.stars);
      const stars = starNum > 0
        ? `<div class="review-stars">${renderStars(starNum)} ${starNum.toFixed(1)}</div>`
        : "";
      const title = r.title ? `<div class="review-title-text">${escapeHtml(r.title)}</div>` : "";
      const author = r.author ? `<span class="review-author">${escapeHtml(r.author)}</span>` : "";
      const date = r.date ? `<span class="review-date">${escapeHtml(r.date)}</span>` : "";
      const meta = (author || date) ? `<div class="review-meta">${author}${date}</div>` : "";
      const body = r.body ? `<div class="review-body-text">${escapeHtml(r.body)}</div>` : "";
      const needsToggle = (r.body?.length || 0) > REVIEW_TRUNCATE_LENGTH;
      const toggle = needsToggle ? `<button class="review-toggle">Show more ↓</button>` : "";
      return `<div class="review">${stars}${title}${meta}${body}${toggle}</div>`;
    }).join("");

    Array.from(valReviews.querySelectorAll(".review-toggle")).forEach(btn => {
      btn.addEventListener("click", (e) => {
        const review = (e.currentTarget as HTMLElement).parentElement;
        if (!review) return;
        const expanded = review.classList.toggle("review--expanded");
        (e.currentTarget as HTMLElement).textContent = expanded ? "Show less ↑" : "Show more ↓";
      });
    });
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
  const sourceText = insights.source === "local" ? "Local" : "AWS Bedrock";
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

async function toggleZenMode() {
  if (!lastScanData || !lastScanTabId || zenLoading) return;

  if (zenActive) {
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
