# Bodhi Leaf: ACC

**Your Adaptive Commerce Copilot** -- a Chrome extension + AWS backend that surfaces AI-powered product intelligence from Amazon product pages.

## What It Does

Bodhi Leaf adds a side panel to Chrome that lets you scan any Amazon product page with one click. It scrapes the page's DOM in real-time and presents the extracted data in a clean, card-based dark UI -- giving you a distraction-free summary of everything that matters about a product.

An AWS backend (Lambda + API Gateway) powers real-time AI insights via Amazon Bedrock (Claude Haiku) and natural-sounding TTS via Amazon Polly. If the backend is unreachable, the extension falls back gracefully to local keyword-based analysis and browser SpeechSynthesis.

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
| **AI Insights** | Deal score (0-10), pros, cons, verdict -- powered by Amazon Bedrock |

## Tech Stack

### Frontend (Chrome Extension)

- **TypeScript 5.9** (strict mode)
- **esbuild** for bundling
- **Chrome Extension Manifest v3** (`sidePanel`, `scripting`, `activeTab`, `storage`)
- **Plain CSS** with custom properties (Apple-inspired dark theme)

### Backend (AWS)

- **Python 3.12** with **FastAPI**
- **Amazon Bedrock** (Claude 3 Haiku) for AI product analysis
- **Amazon Polly** (Kajal generative voice, Indian English) for TTS
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
│   │   ├── sidepanel/            # Side panel UI, CSS, portal animation
│   │   ├── zen/                  # Zen Mode overlay + local insights engine
│   │   └── config/               # CSS selectors, backend API client
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
│   │       ├── bedrock.py        # Amazon Bedrock (Claude Haiku) wrapper
│   │       └── polly.py          # Amazon Polly TTS wrapper
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
| `AWS_REGION` | AWS region for Bedrock + Polly calls | `us-east-1` |
| `BEDROCK_MODEL_ID` | Bedrock model to use | `anthropic.claude-3-haiku-20240307-v1:0` |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check -- returns `{ status, service, region }` |
| `POST` | `/api/insights` | Send scraped product data, get AI insights (summary, pros, cons, deal score, verdict) |
| `POST` | `/api/tts` | Send text, get base64-encoded MP3 audio (Polly Kajal voice) |

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
- **Text-to-Speech** via Amazon Polly (Kajal generative voice, Indian English) with play/pause/stop and speed control
- **AI Insights** -- deal score (0-10) with animated ring, pros and cons from Bedrock analysis
- **Quick Specs** -- top 6 specs selected by priority in a clean grid
- **Draggable** -- grab the header to reposition anywhere on screen
- **Minimize/Close** -- collapse to header only or dismiss entirely

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
| Bedrock Claude Haiku | ~$0.50/hackathon |
| Polly Generative | ~$0.50/hackathon |
| **Total** | **< $2** |

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

UNLICENSED

## Authors

Smil Thakur, Agnibha Sarkar
