export const SELECTORS = {
    amazon: {
        // ── Core product info ──
        productName: "#productTitle",
        productBrand: "#bylineInfo",
        productPrice: "span.a-price-whole",
        productPriceFraction: "span.a-price-fraction",
        productPriceSymbol: "span.a-price-symbol",
        listPrice: "span.a-price[data-a-strike='true'] span.a-offscreen",     // MRP / strikethrough price
        savingsPercent: "span.savingsPercentage",
        dealBadge: "#dealBadge_feature_div span.a-badge-text",

        // ── Availability & delivery ──
        availability: "#availability span",
        deliveryMessage: "#mir-layout-DELIVERY_BLOCK-slot-PRIMARY_DELIVERY_MESSAGE_LARGE",
        fastestDelivery: "#mir-layout-DELIVERY_BLOCK-slot-SECONDARY_DELIVERY_MESSAGE_LARGE",

        // ── Images ──
        mainImage: "#landingImage",
        thumbnailImages: "#altImages ul li.imageThumbnail img",

        // ── Feature bullets ──
        features: "#feature-bullets ul.a-unordered-list li span.a-list-item",

        // ── Product description ──
        productDescription: "#productDescription p, #productDescription span",

        // ── "From the manufacturer" / A+ content ──
        aplusContent: "#aplus_feature_div",

        // ── Ratings & reviews ──
        ratingValue: "#acrPopover span.a-icon-alt",                     // e.g. "4.2 out of 5 stars"
        ratingCount: "#acrCustomerReviewText",                          // e.g. "1,234 ratings"
        ratingMetadata: "#cm_cr_dp_d_rating_histogram",
        ratingFilterBtns: "#histogramTable tr",
        reviewDivs: "div[data-hook='review']",
        reviewTitle: "a[data-hook='review-title'] span:not(.a-letter-space)",
        reviewBody: "span[data-hook='review-body'] span",
        reviewerName: "span.a-profile-name",
        reviewStars: "i[data-hook='review-star-rating'] span.a-icon-alt",
        reviewDate: "span[data-hook='review-date']",
        reviewHelpful: "span[data-hook='helpful-vote-statement']",

        // ── Technical / product details table ──
        technicalDetails: "#productDetails_techSpec_section_1 tr, #prodDetails table.prodDetTable tr",
        additionalInfo: "#productDetails_detailBullets_sections1 tr",
        detailBullets: "#detailBulletsWrapper_feature_div li span.a-list-item",

        // ── Buy box ──
        buyBoxSeller: "#sellerProfileTriggerId",
        fulfilledBy: "#tabular-buybox span.tabular-buybox-text",
        addToCartBtn: "#add-to-cart-button",
        buyNowBtn: "#buy-now-button",

        // ── Variations (size, color, etc.) ──
        variationLabels: "#variation_size_name span.selection, #variation_color_name span.selection",
        variationOptions: "ul.swatchesSquare li, ul.dropdown-prompt li",

        // ── "Frequently bought together" & "Customers also bought" ──
        frequentlyBoughtTogether: "#sims-fbt .a-fixed-left-grid",
        customersAlsoBought: "#sp_detail .a-carousel-card",

        // ── Best seller rank ──
        bestSellerRank: "#SalesRank, #detailBulletsWrapper_feature_div li:has(span:contains('Best Sellers Rank'))",

        // ── Warranty & returns ──
        warranty: "#productSupportAndReturnPolicy-702702_feature_div",

        // ── EMI / payment options ──
        emiOptions: "#inemi_feature_div, #EMILearnMoreLinkId",
        paymentOffers: "#sopp_feature_div",

        // ── Coupon ──
        coupon: "#couponBadgeRegularVpc, #vpcButton",

        // ── Q&A ──
        questionsCount: "#askATFLink span.a-size-base",
    },
};