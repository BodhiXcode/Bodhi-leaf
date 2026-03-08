# Privacy Policy — Bodhi Leaf: ACC

**Last updated:** March 8, 2026

Bodhi Leaf: ACC ("Bodhi Leaf", "the extension", "we", "our") is an open-source browser extension that helps users make informed purchase decisions while shopping online. This privacy policy explains what data the extension accesses, how it is used, and how it is stored.

## Data We Access

### Product Page Content
When you click **Scan Page** on a supported shopping site, the extension reads publicly visible product information from the page, including:
- Product title, brand, and price
- Ratings, reviews, and specifications
- Seller information and deal badges
- Product images

This data is used solely to generate AI-powered insights for you.

### Browsing History (Local Only)
The extension stores a list of products you have scanned in your browser's local storage. This includes the product title, price, category, and timestamp. This data:
- Never leaves your browser
- Is stored only in `chrome.storage.local`
- Can be cleared at any time via the **Profile** tab > **Clear History** button

### Product Fit Preferences (Local Only)
If you use the "Is This Right for You?" evaluation in Zen Mode, your responses are stored in your browser's local storage to personalize future evaluations. This data:
- Never leaves your browser
- Can be reset at any time via the **Profile** tab > **Reset Preferences** button

## Data We Send to Our Backend

When you scan a product, the extracted product data (title, price, ratings, reviews, specs) is sent to our backend API hosted on AWS for AI processing. The backend uses:
- **Amazon Bedrock** to generate deal scores, pros/cons, review analysis, chat responses, translations, and product fit evaluation questions
- **Amazon Polly** to generate text-to-speech audio in multiple languages

### What is NOT sent:
- Your name, email, or any personal identifiers
- Your browsing history
- Your IP address (beyond what is inherent in any HTTPS request)
- Any data from non-product pages

### Data retention:
- Product data sent to the backend is processed in real-time and **not stored** on our servers
- No logs of product data or user requests are retained beyond standard AWS CloudWatch logs (which contain only error diagnostics, not product content)

## Third-Party Services

| Service | Purpose | Provider |
|---|---|---|
| Amazon Bedrock | AI analysis and text generation | Amazon Web Services |
| Amazon Polly | Text-to-speech audio generation | Amazon Web Services |

We do not use any analytics, tracking, or advertising services.

## Data Sharing

- We do **not** sell or transfer user data to third parties
- We do **not** use user data for advertising or profiling
- We do **not** use user data to determine creditworthiness or for lending purposes

## Your Controls

| Action | How |
|---|---|
| Clear browsing history | Profile tab > Clear History |
| Reset preferences | Profile tab > Reset Preferences |
| Stop all data access | Disable or uninstall the extension |

## Changes to This Policy

If we make changes to this privacy policy, we will update the "Last updated" date above. Continued use of the extension after changes constitutes acceptance of the updated policy.

## Contact

For questions about this privacy policy, please open an issue at:
https://github.com/BodhiXcode/Bodhi-leaf/issues

## Authors

Smil Thakur, Agnibha Sarkar
