import { SELECTORS } from "./selectors";
import { showPortalAnimation, hidePortalAnimation } from "./portal-animation";

// ── DOM refs ──
const loadBtn = document.getElementById("lbtn");
const status = document.getElementById("status");
const skeleton = document.getElementById("skeleton");

const cardImage = document.getElementById("card-image");
const cardTitle = document.getElementById("card-title");
const cardPrice = document.getElementById("card-price");
const cardAvailability = document.getElementById("card-availability");
const cardFeatures = document.getElementById("card-features");
const cardRating = document.getElementById("card-rating");
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
const valRatingCount = document.getElementById("val-rating-count");
const ratingFilters = document.getElementById("rating-filters");
const valReviews = document.getElementById("val-reviews");
const valSpecs = document.getElementById("val-specs");
const valSeller = document.getElementById("val-seller");

// ── Helpers ──
const allCards = () => [cardImage, cardTitle, cardPrice, cardAvailability, cardFeatures, cardRating, cardReviews, cardSpecs, cardSeller];

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
  if (ratingFilters) ratingFilters.innerHTML = "";
  if (valReviews) valReviews.innerHTML = "";
  if (valSpecs) valSpecs.innerHTML = "";
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
const PORTAL_MIN_DISPLAY_MS = 3500;

function requestPageData(ratingFilter?: string) {
  clearPanel();
  showSkeleton();

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]?.id) return;
    const tabId = tabs[0].id;
    const portalStart = Date.now();
    showPortalAnimation(tabId);

    (chrome.scripting.executeScript as any)({
      target: { tabId },
      world: "MAIN",
      func: function (selectors: any, ratingFilter: string | undefined) {
        const getText = (sel: string) => {
          const el = document.querySelector(sel);
          return el ? (el.textContent?.trim() || "") : "";
        };
        const getAttr = (sel: string, attr: string) => {
          const el = document.querySelector(sel);
          return el ? (el.getAttribute(attr) || "") : "";
        };
        const getList = (sel: string) => {
          return Array.from(document.querySelectorAll(sel)).map(e => e.textContent?.trim() || "").filter(Boolean);
        };
        const getTableRows = (sel: string) => {
          return Array.from(document.querySelectorAll(sel)).map(tr => {
            const cells = tr.querySelectorAll("th, td");
            if (cells.length >= 2) {
              return { label: cells[0].textContent?.trim() || "", value: cells[1].textContent?.trim() || "" };
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
              return {
                text: el.textContent?.trim() || '',
                selected: el.classList.contains('a-histogram-row-selected') || false
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
              title: titleEl?.textContent?.trim() || '',
              body: bodyEl?.textContent?.trim() || '',
              author: nameEl?.textContent?.trim() || '',
              stars: starsEl?.textContent?.trim() || '',
              date: dateEl?.textContent?.trim() || '',
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
        if (results && results[0]?.result) {
          populatePanel(results[0].result, ratingFilter);
        } else {
          showStatus("No product data found on this page.");
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
    card.style.animationDelay = `${staggerIdx * 0.08}s`;
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
    if (valBrand && data.brand) valBrand.textContent = data.brand;
  }

  // Price block
  if (data.price && cardPrice && valPrice) {
    revealCard(cardPrice);
    const fraction = data.priceFraction ? `.${data.priceFraction}` : "";
    valPrice.textContent = `₹${data.price}${fraction}`;
    if (valMrp && data.listPrice) valMrp.textContent = data.listPrice;
    if (valSavings && data.savings) valSavings.textContent = data.savings;
    if (valDeal && data.dealBadge) valDeal.textContent = `🏷️ ${data.dealBadge}`;
    if (valCoupon && data.coupon) valCoupon.textContent = `🎟️ ${data.coupon}`;
    if (valEmi && data.emi) valEmi.textContent = data.emi;
  }

  // Availability & delivery
  if ((data.availability || data.delivery) && cardAvailability) {
    revealCard(cardAvailability);
    if (valAvailability && data.availability) valAvailability.textContent = data.availability;
    if (valDelivery && data.delivery) valDelivery.textContent = `📦 ${data.delivery}`;
    if (valFastestDelivery && data.fastestDelivery) valFastestDelivery.textContent = `⚡ ${data.fastestDelivery}`;
  }

  // Features
  if (data.features?.length && cardFeatures && valFeatures) {
    revealCard(cardFeatures);
    valFeatures.innerHTML = data.features.slice(0, 10)
      .map((f: string) => `<li>${escapeHtml(f)}</li>`)
      .join("");
  }

  // Rating
  if (data.ratingValue && cardRating) {
    revealCard(cardRating);
    if (valRatingValue) valRatingValue.textContent = data.ratingValue;
    if (valRatingCount) valRatingCount.textContent = data.ratingCount || "";
    if (data.ratingBtns?.length && ratingFilters) {
      ratingFilters.innerHTML = data.ratingBtns.map((btn: any, idx: number) =>
        `<button class="rating-btn${btn.selected ? ' selected' : ''}" data-idx="${idx}">${escapeHtml(btn.text)}</button>`
      ).join("");
      Array.from(ratingFilters.querySelectorAll('.rating-btn')).forEach((el: Element) => {
        el.addEventListener('click', (e) => {
          const filter = (e.currentTarget as HTMLElement).textContent?.trim() || '';
          requestPageData(filter);
        });
      });
    }
  }

  // Reviews — structured cards
  if (data.reviews?.length && cardReviews && valReviews) {
    revealCard(cardReviews);
    valReviews.innerHTML = data.reviews.map((r: any) => {
      const stars = r.stars ? `<div class="review-stars">${escapeHtml(r.stars)}</div>` : '';
      const title = r.title ? `<div class="review-title-text">${escapeHtml(r.title)}</div>` : '';
      const author = r.author ? `<span class="review-author">${escapeHtml(r.author)}</span>` : '';
      const date = r.date ? `<span class="review-date">${escapeHtml(r.date)}</span>` : '';
      const meta = (author || date) ? `<div class="review-meta">${author}${date}</div>` : '';
      const body = r.body ? escapeHtml(r.body) : '';
      const needsToggle = body.length > 200;
      return `<div class="review">${stars}${title}${meta}${body}${needsToggle ? `<button class="review-toggle">Show more</button>` : ''
        }</div>`;
    }).join("");
    Array.from(valReviews.querySelectorAll('.review-toggle')).forEach(btn => {
      btn.addEventListener('click', (e) => {
        const review = (e.currentTarget as HTMLElement).parentElement;
        if (!review) return;
        const expanded = review.classList.toggle('review--expanded');
        (e.currentTarget as HTMLElement).textContent = expanded ? 'Show less' : 'Show more';
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
    valSeller.textContent = data.seller;
  }
}

// ── Sanitize ──
function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ── Init ──
loadBtn?.addEventListener("click", () => {
  requestPageData();
});