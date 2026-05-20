# NEXUS — AI-Powered Personal Knowledge Platform

> Turn the internet into your personal AI knowledge system.

NEXUS is a full-stack adaptive knowledge platform that lets you save, organize, discover, and query everything you find across the internet. It combines semantic search, intelligent auto-organization, personalized recommendation systems, and modern AI synthesis into a single cohesive workspace.

---

## What NEXUS Does

| Capability | Description |
|---|---|
| **Smart Ingestion** | Paste URLs, raw text, or bulk links. NEXUS scrapes, summarizes, tags, and categorizes everything automatically. |
| **Semantic Search** | Find sources by meaning using vector embeddings — not just keyword matching. |
| **Auto Collections** | AI groups related sources into named collections automatically. Supports manual overrides. |
| **Ask NEXUS** | Chat with your entire saved library. Claude synthesizes cited answers from your actual saved content. |
| **Discover Engine** | Personalized recommendations powered by your library profile, recent searches, and interaction feedback. |
| **Learning Paths** | Curated tool stacks matched to your interests — Frontend, AI/ML, Robotics, Backend, and more. |
| **Knowledge Gaps** | Identifies adjacent topic areas you haven't explored yet, based on your existing library. |
| **AI Insights** | Full-library analysis revealing focus areas, trends, and what to explore next. |
| **Responsible AI** | Built-in safety classification blocks harmful queries and flags restricted content before ingestion. |
| **Adaptive Recommendations** | Like, dislike, or dismiss suggestions. The Discover engine learns your preferences. |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     NEXUS Frontend                          │
│         Next.js 16 + React 19 + Tailwind CSS v4             │
│                                                             │
│  Landing  │  Library  │  Collections  │  Discover           │
│  Ask      │  Insights │  Add Source   │  Settings           │
└─────────────────────────┬───────────────────────────────────┘
                          │  REST API (NEXT_PUBLIC_API_URL)
┌─────────────────────────▼───────────────────────────────────┐
│                     NEXUS Backend                           │
│              FastAPI + SQLAlchemy (async)                   │
│                                                             │
│  /api/ingest      scrape + AI analyze + embed              │
│  /api/search/ask  semantic search + Claude synthesis        │
│  /api/discover    personalized recommendation engine        │
│  /api/clusters    collections CRUD + auto-organize         │
│  /api/insights    full-library AI analysis                  │
│  /api/sites       CRUD for saved sources                    │
└──────────┬──────────────────────┬───────────────────────────┘
           │                      │
    ┌──────▼──────┐      ┌────────▼──────────┐
    │   SQLite    │      │     ChromaDB       │
    │  (sources,  │      │  (vector embeds,   │
    │  clusters,  │      │   semantic search) │
    │  profiles)  │      └───────────────────┘
    └─────────────┘
           │
    ┌──────▼──────────────────────────────────┐
    │          Anthropic Claude API           │
    │  (summaries · synthesis · organize)     │
    │  Graceful fallback if key not set       │
    └─────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend
| Tech | Version | Purpose |
|---|---|---|
| Next.js | 16 | App Router, SSR, routing |
| React | 19 | UI framework |
| TypeScript | 5 | Type safety |
| Tailwind CSS | v4 | Styling |
| lucide-react | 1.x | Icons |

### Backend
| Tech | Version | Purpose |
|---|---|---|
| FastAPI | 0.115 | REST API framework |
| SQLAlchemy | 2.x (async) | ORM + migrations |
| aiosqlite | 0.20 | Async SQLite driver |
| ChromaDB | 0.5 | Vector embeddings store |
| sentence-transformers | 3.3 | Local embedding model |
| Anthropic SDK | 0.40 | Claude AI integration |
| Playwright | 1.50 | JS-heavy site scraping |
| httpx | 0.28 | HTTP scraping fallback |
| BeautifulSoup4 | 4.12 | HTML parsing |

---

## Features In Depth

### Discover Engine
The Discover engine builds a model of your interests from multiple signals:
- **Library profile** — tag and category frequency across all saved sources
- **Recent queries** — questions asked in Ask NEXUS influence recommendations
- **Interaction feedback** — like/dislike/dismiss signals update a persistent user profile
- **"Because you saved…"** — anchor-based recommendations linked to specific saved sources
- **Knowledge gaps** — adjacent categories with low library coverage
- **Learning paths** — curated tool stacks matched to your interest profile

### Responsible AI Layer
All user queries go through a fast keyword-based safety classifier before any AI processing:
- Blocks self-harm, violence, weapons, malware, hacking, fraud, drug synthesis, stalking, and evasion queries
- Self-harm queries return crisis resources (988, Crisis Text Line) instead of information
- Ingested content is checked for harmful signals before AI analysis runs
- Blocked queries are logged locally (self-harm text is always redacted)
- Discover never surfaces restricted content

### Graceful Degradation
NEXUS is designed to work at every level of connectivity:
- No API key → local rule-based analysis, no AI summaries
- No embeddings → keyword-based search fallback
- Backend unreachable → frontend shows cached state, no crashes
- Playwright unavailable → httpx fallback for all scraping

---

## Local Development

### Prerequisites
- Node.js 20+
- Python 3.11+

### Frontend

```bash
cd nexus-frontend
npm install

# Create environment file
cp .env.local.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
# → http://localhost:3000
```

### Backend

```bash
cd nexus-backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Install Playwright browser (optional — only needed for JS-heavy sites)
playwright install chromium

# Create environment file
cp .env.example .env
# Edit .env — add your ANTHROPIC_API_KEY (optional)

python main.py
# → http://localhost:8000
# → API docs at http://localhost:8000/docs
```

### Running Both

```bash
# Terminal 1
cd nexus-backend && source venv/bin/activate && python main.py

# Terminal 2
cd nexus-frontend && npm run dev
```

---

## Deployment

### Frontend → Vercel

1. Push `nexus-frontend` to a GitHub repository
2. Import the repository in [Vercel](https://vercel.com/new)
3. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL = https://your-nexus-api.up.railway.app
   ```
4. Deploy — Vercel detects Next.js automatically

### Backend → Railway

1. Push `nexus-backend` to a GitHub repository
2. Create a new project in [Railway](https://railway.app)
3. Connect the repository — Railway uses `railway.toml` for build/start commands
4. Add a **Volume** mounted at `/data` (for SQLite + ChromaDB persistence)
5. Set environment variables:
   ```
   ANTHROPIC_API_KEY     = sk-ant-...
   DATABASE_URL          = sqlite+aiosqlite:////data/nexus.db
   CHROMA_PATH           = /data/chroma
   CORS_ORIGINS          = https://your-nexus-app.vercel.app,http://localhost:3000
   PORT                  = (Railway sets this automatically)
   ```
6. Deploy and verify `/health` returns `{"status": "ok"}`
7. Copy the Railway public URL back into the Vercel `NEXT_PUBLIC_API_URL` env var

### Production Checklist

- [ ] `NEXT_PUBLIC_API_URL` set on Vercel
- [ ] `ANTHROPIC_API_KEY` set on Railway
- [ ] `CORS_ORIGINS` includes your Vercel domain
- [ ] Railway volume mounted at `/data`
- [ ] `/health` endpoint returns `ok`
- [ ] Test ingest, search, ask, and discover end-to-end

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ingest` | Ingest a URL — scrape, analyze, embed |
| `GET` | `/api/sites` | List all saved sources |
| `PUT` | `/api/sites/{id}` | Update a source |
| `DELETE` | `/api/sites/{id}` | Delete a source |
| `POST` | `/api/search/ask` | Semantic ask with Claude synthesis |
| `GET` | `/api/search?q=` | Keyword search fallback |
| `POST` | `/api/search/semantic` | Vector similarity search |
| `POST` | `/api/search/compare` | Side-by-side AI comparison |
| `GET` | `/api/clusters` | List collections |
| `POST` | `/api/clusters` | Create collection |
| `POST` | `/api/clusters/auto-organize` | AI-powered auto-grouping |
| `GET` | `/api/discover` | Personalized recommendations |
| `GET` | `/api/discover/search?q=` | Discover + library search |
| `GET` | `/api/insights` | Full-library AI insights |
| `POST` | `/api/profile/feedback` | Record like/dislike/dismiss |
| `GET` | `/health` | Backend health check |

---

## Roadmap

### Now (MVP)
- [x] URL ingestion + AI analysis
- [x] Semantic search + Ask NEXUS
- [x] Auto collections
- [x] Discover engine with learning paths
- [x] Knowledge gaps detection
- [x] AI insights dashboard
- [x] Responsible AI safety layer
- [x] Vercel + Railway deployment ready

### Next
- [ ] Supabase/PostgreSQL migration for multi-user support
- [ ] Login/signup with persistent user libraries
- [ ] Browser extension (Chrome/Firefox)
- [ ] Export to Obsidian / Notion
- [ ] Public shared collections
- [ ] Mobile-optimized PWA

### Future
- [ ] Team workspaces
- [ ] API access for integrations
- [ ] Custom embedding models
- [ ] Offline-first mode

---

## Screenshots

> Add screenshots here after deploying.

---

## Author

Built by **Devin Hill** — [GitHub](https://github.com/devinhill)

NEXUS © 2026 · Built with AI-assisted development
