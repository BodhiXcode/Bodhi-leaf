# Bodhi Leaf: ACC

**Your Adaptive Commerce Copilot** -- a Chrome extension that extracts and surfaces comprehensive product intelligence from Amazon product pages in a sleek side panel.

## What It Does

Bodhi Leaf adds a side panel to Chrome that lets you scan any Amazon product page with one click. It scrapes the page's DOM in real-time and presents the extracted data in a clean, card-based dark UI -- giving you a distraction-free summary of everything that matters about a product.

### Extracted Data

| Category | Details |
|---|---|
| **Product** | Title, brand |
| **Price** | Current price, MRP, savings %, deal badges, coupons, EMI options |
| **Availability** | Stock status, delivery date, fastest delivery |
| **Features** | Up to 10 key bullet points |
| **Ratings** | Overall rating, total count, filterable star distribution |
| **Reviews** | Up to 10 reviews with author, date, stars, and expandable body text |
| **Specs** | Full technical details table |
| **Seller** | Buy box seller name |

## Tech Stack

- **TypeScript 5.9** (strict mode)
- **esbuild** for bundling
- **Chrome Extension Manifest v3** (`sidePanel`, `scripting`, `activeTab`, `storage`)
- **Plain CSS** with custom properties (Apple-inspired dark theme)
- **Inter** font via Google Fonts

## Project Structure

```
Bodhi-leaf/
├── src/                          # Source code
│   ├── background/               # Service worker
│   │   └── service-worker.ts     #   Opens side panel on icon click, message listener
│   ├── content/                  # Content script
│   │   └── content-script.ts     #   Sends basic page metadata to background
│   ├── sidepanel/                # Side panel module
│   │   ├── sidepanel.ts          #   Core UI — scan orchestration, data rendering
│   │   ├── sidepanel.css         #   Dark theme styles
│   │   └── portal-animation.ts   #   Loading overlay animation
│   ├── zen/                      # Zen Mode module
│   │   ├── zen-mode.ts           #   Overlay injection API, CSS, DOM builder, TTS, drag
│   │   └── zen-insights.ts       #   AI insights engine — deal scoring, pros/cons, TTS script
│   └── config/                   # Shared configuration
│       └── selectors.ts          #   CSS selectors for Amazon product page elements
├── public/                       # Static assets (copied to dist/ at build time)
│   ├── manifest.json             #   Chrome extension manifest (v3)
│   ├── sidepanel.html            #   Side panel markup
│   └── icons/
│       └── bodhix.jpg            #   Extension icon
├── scripts/                      # Build tooling
│   └── build.mjs                 #   esbuild bundler + asset copier
├── docs/                         # Documentation
│   └── ANALYSIS.md               #   Deep analysis, bug tracker, and feature roadmap
├── dist/                         # Build output — load this as the extension
├── tsconfig.json
├── package.json
└── .gitignore
```

## How It Works

1. **Click the extension icon** -- the side panel opens.
2. **Click "Scan"** on any Amazon product page.
3. A teal sci-fi **portal animation** overlays the page while scanning.
4. The extension uses `chrome.scripting.executeScript` with `world: "MAIN"` to run an extraction function directly in the page's DOM context, using centralized CSS selectors.
5. Extracted data flows back to the side panel and renders as **staggered-reveal cards** with skeleton loading states.
6. Use **rating filter buttons** to filter reviews by star rating, and **expand/collapse** long reviews inline.

### Zen Mode

After scanning, click the **Zen Mode** button to open an interactive overlay directly on the Amazon page:

- **Product summary** with image, price, rating, and savings at a glance
- **Text-to-Speech** -- reads a generated product script aloud with play/pause/stop and speed control
- **AI Insights** -- deal score (0-10) with animated ring, auto-extracted pros and cons from review sentiment analysis
- **Quick Specs** -- top 6 specs selected by priority in a clean grid
- **Draggable** -- grab the header to reposition anywhere on screen
- **Minimize/Close** -- collapse to header only or dismiss entirely

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (18+)
- npm
- Google Chrome

### Install & Build

```bash
# Install dependencies
npm install

# Build the extension
npm run build
```

This bundles TypeScript into `dist/`, copies static assets from `public/`, and produces a ready-to-load extension directory.

### Load into Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right)
3. Click **Load unpacked**
4. Select the **`dist/`** folder inside the project

### Development

```bash
npm run dev
```

Watches for file changes and rebuilds automatically. After each rebuild, click the refresh icon on the extension card in `chrome://extensions/` to pick up changes.

## Architecture

```
┌─────────────┐     icon click     ┌──────────────────┐
│  background │ ──────────────────▶ │    side panel    │
│  (service   │                    │  (sidepanel.ts)  │
│   worker)   │                    └────────┬─────────┘
└─────────────┘                             │
                                   "Scan Page" click
                                            │
                              ┌─────────────▼──────────────┐
                              │  chrome.scripting           │
                              │  .executeScript()           │
                              │  world: "MAIN"              │
                              └─────────────┬──────────────┘
                                            │
                    ┌───────────────────────▼───────────────────────┐
                    │              Amazon product page              │
                    │                                               │
                    │  ┌─────────────┐    ┌──────────────────────┐  │
                    │  │  selectors  │───▶│  DOM extraction fn   │  │
                    │  └─────────────┘    └──────────┬───────────┘  │
                    │                                │              │
                    │  ┌──────────────────────────┐  │              │
                    │  │  portal-animation overlay │  │              │
                    │  └──────────────────────────┘  │              │
                    └────────────────────────────────┘              │
                                                                   │
                              extracted data (JSON)                 │
                              ◄────────────────────────────────────┘
                                            │
                              ┌─────────────▼──────────────┐
                              │  populatePanel()           │
                              │  → card rendering          │
                              │  → stagger animations      │
                              └────────────────────────────┘
```

## Scripts

| Command | Description |
|---|---|
| `npm run build` | Production build — bundle + copy assets to `dist/` |
| `npm run dev` | Watch mode — auto-rebuild on file changes |
| `npm run clean` | Remove the `dist/` directory |

## License

UNLICENSED

## Authors

Smil Thakur, Agnibha Sarkar
