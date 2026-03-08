# Bodhi Leaf: ACC

**Your Adaptive Commerce Copilot** -- a Chrome/Brave extension + AWS backend that surfaces AI-powered product intelligence from Amazon product pages.

## What It Does

Bodhi Leaf adds a side panel to Chrome (or Brave) that lets you scan any Amazon product page with one click. It scrapes the page's DOM in real-time and presents the extracted data across organized tabs — **Details**, **Insights**, and **Profile** — in a clean dark UI.

An AWS backend (Lambda + API Gateway) powers real-time AI insights via Amazon Bedrock (Nova Micro) and natural-sounding multilingual TTS via Amazon Polly. If the backend is unreachable, the extension falls back gracefully to local keyword-based analysis.

### Key Features

| Feature | Description |
|---|---|
| **Product Details** | Title, brand, price, savings, delivery, specs, reviews — all extracted in one scan |
| **AI Insights** | Deal score (0-10) with animated ring, pros/cons, verdict, star breakdown, seller analysis, new version alerts |
| **Zen Mode** | Full-page interactive overlay on the Amazon page with TTS playback, AI verdict, specs, ratings, and product quiz |
| **Multilingual TTS** | Text-to-speech via Amazon Polly (Kajal voice) in 9 languages: English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam |
| **AI Chat** | Floating chat overlay to ask product-specific questions, with contextual suggestion chips |
| **Product Quiz** | "Is This Right for You?" — AI-generated quiz that evaluates product fit based on your needs |
| **Shopper Profile** | Tracks browsing history, categories, avg ratings, and quiz preferences across sessions |
| **Layman Specs** | Technical specs explained in plain English (e.g. "RTX 5050" → what it means for you) |
| **Accessibility** | Font size, letter spacing, and color blind mode controls |
| **Smart Detection** | Shows message on non-Amazon shopping sites, disables panel on non-product pages |

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
| **Seller** | Buy box seller name + AI-powered seller vs product issue analysis |
| **AI Insights** | Deal score, pros, cons, verdict, star breakdown, layman spec explanations, chat suggestions |

## Tech Stack

### Frontend (Chrome Extension)

- **TypeScript 5.9** (strict mode)
- **esbuild** for bundling with environment variable injection
- **Chrome Extension Manifest v3** (`sidePanel`, `scripting`, `activeTab`, `storage`)
- **Plain CSS** with custom properties (dark theme)

### Backend (AWS)

- **Python 3.12** with **FastAPI**
- **Amazon Bedrock** (Nova Micro) for AI product analysis, chat, quiz generation, and translation
- **Amazon Polly** (Kajal generative voice) for multilingual TTS (en-IN, hi-IN)
- **AWS Lambda** + **API Gateway HTTP API** for serverless hosting
- **AWS SAM** for infrastructure-as-code deployment
- **Mangum** as the Lambda/ASGI adapter

## Project Structure

```
Bodhi-leaf/
├── scripts/
│   ├── start.sh                  # Start frontend + backend locally (one command)
│   └── setup.sh                  # First-time setup (installs everything)
├── frontend/                     # Chrome extension
│   ├── src/
│   │   ├── background/           # Service worker (opens side panel on icon click)
│   │   ├── content/              # Content script (page metadata)
│   │   ├── sidepanel/            # Side panel UI + CSS + accessibility module
│   │   │   ├── sidepanel.ts      # Main panel logic (tabs, chat, profile, history)
│   │   │   ├── sidepanel.css     # All panel styles
│   │   │   └── a11y.ts           # Accessibility controls (font, spacing, color modes)
│   │   ├── zen/                  # Zen Mode overlay + local insights engine
│   │   │   ├── zen-mode.ts       # Full overlay: TTS, quiz, specs, seller, language switch
│   │   │   └── zen-insights.ts   # Insights engine (Bedrock AI + local fallback + TTS script)
│   │   └── config/               # CSS selectors, backend API client
│   │       ├── ai.ts             # API client (insights, TTS, chat, quiz, translate, recommendations)
│   │       └── selectors.ts      # Amazon DOM selectors for scraping
│   ├── public/                   # Static assets (manifest.json, sidepanel.html, icons)
│   ├── scripts/build.mjs         # esbuild bundler + env injection
│   ├── dist/                     # Build output — load this as the extension
│   ├── .env                      # API_BASE_URL (not committed)
│   ├── .env.example              # Template for .env
│   └── package.json
├── backend/                      # Python FastAPI on AWS Lambda
│   ├── app/
│   │   ├── main.py               # FastAPI app, CORS, routes, Mangum handler
│   │   ├── models.py             # Pydantic request/response schemas
│   │   └── services/
│   │       ├── bedrock.py        # Amazon Bedrock wrapper (insights, chat, quiz, translate, recommendations)
│   │       └── polly.py          # Amazon Polly TTS wrapper (multilingual)
│   ├── template.yaml             # AWS SAM template (Lambda + API Gateway)
│   ├── requirements.txt          # Python dependencies
│   ├── .env                      # AWS credentials + config (not committed)
│   ├── .env.example              # Template for .env
│   └── .aws-sam/                 # SAM build artifacts (not committed)
├── docs/
│   └── ANALYSIS.md               # Deep analysis, bug tracker, feature roadmap
├── README.md
└── .gitignore
```

## Quick Start

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| [Node.js](https://nodejs.org/) | 18+ | Frontend build |
| [Python](https://www.python.org/) | 3.9+ | Backend server |
| [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) | Latest | Deploy to AWS (optional for local dev) |
| Chrome or Brave | Latest | Run the extension |

### 1. Clone & Setup

```bash
git clone git@github.com:BodhiXcode/Bodhi-leaf.git && cd Bodhi-leaf
./scripts/setup.sh
```

`setup.sh` is a **one-time** script that:
- Creates a Python virtual environment in `backend/.venv/` and installs pip dependencies
- Installs npm dependencies in `frontend/node_modules/`
- Builds the Chrome extension to `frontend/dist/`
- Creates `.env` files from the `.env.example` templates

You only need to run it once when you first clone the repo (or after a fresh `git pull` that changes dependencies).

### 2. Add AWS Credentials

After setup, open `backend/.env` and paste your **personal** AWS keys:

```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=abc123...
```

Get these from your AWS IAM console: **IAM > Users > Security credentials > Create access key**.

**Never use work/employer AWS credentials.** The backend will refuse to start if keys are missing.

### 3. Start Everything

```bash
./scripts/start.sh
```

This single command starts **both** servers in parallel:
- **Backend** at `http://localhost:8000` (uvicorn with auto-reload)
- **Frontend** in watch mode (esbuild, auto-rebuilds on file changes)

Press `Ctrl+C` to stop both.

### 4. Load the Extension

1. Open `chrome://extensions/` (or `brave://extensions/`)
2. Enable **Developer mode** (toggle top-right)
3. Click **Load unpacked**
4. Select the `frontend/dist/` folder
5. Navigate to any Amazon product page and click the Bodhi Leaf icon

After each rebuild, click the refresh icon on the extension card in `chrome://extensions/` to pick up changes.

## Running Frontend & Backend Separately

If you prefer running them in separate terminals:

**Terminal 1 -- Backend:**

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 -- Frontend:**

```bash
cd frontend
npm run dev                    # watch mode, or: npm run build (one-off)
```

## Environment Variables

### `frontend/.env`

| Variable | Description | Default |
|---|---|---|
| `API_BASE_URL` | Backend URL. Set to `http://localhost:8000` for local dev, or your API Gateway URL for production. | `http://localhost:8000` |

### `backend/.env`

| Variable | Description | Default |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | Your personal AWS access key (from IAM console) | *required* |
| `AWS_SECRET_ACCESS_KEY` | Your personal AWS secret key (from IAM console) | *required* |
| `AWS_REGION` | AWS region for all AWS services | `us-east-1` |
| `BEDROCK_MODEL_ID` | Bedrock model to use | `us.amazon.nova-micro-v1:0` |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check -- returns `{ status, service, region }` |
| `POST` | `/api/insights` | Send scraped product data, get AI insights (summary, pros, cons, deal score, verdict, star breakdown, seller analysis, layman specs, TTS script) |
| `POST` | `/api/tts` | Send text + language_code, get base64-encoded MP3 audio (Polly Kajal voice, supports `en-IN` and `hi-IN`) |
| `POST` | `/api/chat` | Product-aware chat — send message + product context + history, get AI response |
| `POST` | `/api/quiz` | Generate AI-powered product-fit quiz questions from product data |
| `POST` | `/api/translate` | Translate text to any Indian language via Bedrock (Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam) |
| `POST` | `/api/recommendations` | Get product recommendations based on quiz preferences |

Interactive API docs (Swagger UI) available at `http://localhost:8000/docs` when running locally.

## Deploying to AWS

```bash
cd backend

# SAM needs credentials via env vars
export AWS_ACCESS_KEY_ID=your_key_here
export AWS_SECRET_ACCESS_KEY=your_secret_here

sam build
sam deploy --stack-name bodhi-leaf-backend --region us-east-1 \
  --capabilities CAPABILITY_IAM --resolve-s3
```

After deployment, SAM prints the `ApiUrl` output. Copy it and set it as `API_BASE_URL` in `frontend/.env`:

```
API_BASE_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
```

Then rebuild the frontend:

```bash
cd frontend && npm run build
```

Reload the extension in Chrome to pick up the new API URL.

## Architecture

```
┌────────────────────────────────────────────┐
│            Chrome Extension                │
│                                            │
│  Side Panel ──► Scan Page ──► Extract DOM  │
│       │                           │        │
│       │        scraped data       │        │
│       ◄───────────────────────────┘        │
│       │                                    │
│       ▼                                    │
│  fetch() ──────────────────────────────────┼───►  AWS Cloud
│       │                                    │     ┌──────────────────────┐
│       │                                    │     │  API Gateway (HTTP)  │
│       │                                    │     │         │            │
│       │                                    │     │    Lambda/FastAPI    │
│       │                                    │     │      /     \        │
│       │                                    │     │  Bedrock   Polly    │
│       ◄────────── JSON / MP3 ──────────────┼─────│  (Claude)  (Kajal)  │
│       │                                    │     └──────────────────────┘
│       ▼                                    │
│  Render insights, play TTS                 │
│  (falls back to local if backend down)     │
└────────────────────────────────────────────┘
```

## Zen Mode

After scanning, click **Zen** to open an interactive overlay on the Amazon page:

- **Product summary** with image, price, rating, and savings at a glance
- **Multilingual TTS** via Amazon Polly (Kajal voice) — 9 Indian languages with seekable progress bar, speed control, and volume slider
- **AI Verdict** — deal score (0-10) with animated ring, pros/cons side-by-side from Bedrock analysis
- **Quick Specs** — top 6 specs in a responsive grid + star-wise rating breakdown with top issues
- **Layman Explanations** — technical specs translated to plain English
- **"Is This Right for You?"** — AI-generated product-fit quiz with match score and usefulness graph
- **Seller Check** — AI analysis of whether negative reviews are seller-related or product-related
- **New Version Alert** — warns if a newer model is available or launching soon
- **Playback Card** — time display, volume control, narration outline showing what topics are covered
- **Draggable** — grab the header to reposition anywhere on screen
- **Minimize/Close** — collapse to header only or dismiss entirely

## Side Panel

The side panel is organized into three tabs:

- **Details** (default) — all scraped product data in a card-based bento grid layout
- **Insights** — AI-powered analysis with deal score, pros/cons, layman specs, and star breakdown
- **Profile** — browsing history, shopper stats (products scanned, categories, avg rating), and quiz preferences

A **floating chat button** opens a slide-up chat overlay for product-specific questions with suggestion chips.

## Debugging

- **Side panel console**: Right-click the side panel > Inspect > Console tab
- **Content script / Zen overlay**: Open DevTools on the Amazon page > Console tab (look for `[bodhi-leaf]` logs)
- **Backend logs**: Visible in the terminal running `start.sh`, or in CloudWatch when deployed
- **API testing**: Use `http://localhost:8000/docs` (Swagger) or `curl`:

```bash
curl http://localhost:8000/api/health
```

## Cost Estimate (AWS)

| Service | Estimated Cost |
|---|---|
| Lambda | ~$0.00 (free tier) |
| API Gateway HTTP API | ~$0.00 (free tier) |
| Bedrock Nova Micro | ~$0.10/hackathon (cheapest Bedrock model) |
| Polly Generative | ~$0.50/hackathon |
| **Total** | **< $1** |

## Scripts Reference

| Script | What it does |
|---|---|
| `./scripts/setup.sh` | **Run once.** Installs all dependencies (pip + npm), builds frontend, creates `.env` files from templates. |
| `./scripts/start.sh` | **Run daily.** Starts both backend (uvicorn) and frontend (esbuild watch) in parallel. `Ctrl+C` stops both. |
| `cd frontend && npm run build` | One-off production build of the extension |
| `cd frontend && npm run dev` | Frontend watch mode only |
| `cd frontend && npm run clean` | Remove `frontend/dist/` |
| `cd backend && sam build && sam deploy ...` | Deploy backend to AWS |

## License

Proprietary — All Rights Reserved. See [LICENSE.md](LICENSE.md).

## Authors

Smil Thakur, Agnibha Sarkar
