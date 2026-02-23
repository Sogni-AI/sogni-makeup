<p align="center">
  <a href="https://makeover.sogni.ai">
    <img src="public/og-banner.png" alt="Sogni Makeover — Transform Your Look with AI" width="100%" />
  </a>
</p>

<p align="center">
  <strong>AI-powered virtual makeover app — try new hairstyles, makeup, and styles instantly.</strong>
</p>

<p align="center">
  <a href="https://makeover.sogni.ai">Live App</a> &nbsp;&bull;&nbsp;
  <a href="https://sogni.ai">Sogni AI</a> &nbsp;&bull;&nbsp;
  <a href="https://x.com/sogni_ai">@sogni_ai</a>
</p>

<br/>

Sogni Makeover lets you see how you'd look with a new hairstyle, bold makeup, or a completely different style — all powered by AI. Upload a photo or snap a selfie, pick a transformation, and get a realistic result in seconds. No sign-up required to try it out.

Built on the [Sogni DePIN network](https://sogni.ai) for decentralized GPU-powered image generation.

## Features

- **125+ transformation presets** across 6 categories — Hair, Makeup, Style, Color, Sculpt, and Explore
- **Real-time progress** via Server-Sent Events as your makeover generates
- **Before/after comparison** with an interactive slider
- **Camera capture** with auto-enhance for professional headshot quality
- **Transformation history** to browse and revisit past makeovers
- **PWA support** — installable on mobile and desktop
- **Demo mode** — 3 free generations with no account required
- **Dual architecture** — backend proxy for demos, direct SDK for authenticated users

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express |
| AI Model | Qwen Image Edit 2511 (via Sogni Client SDK) |
| Infrastructure | Sogni DePIN GPU Network, SSE for real-time updates |

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Nginx (for local subdomain proxying)
- Sogni account credentials (for the backend)

### Install

```bash
git clone git@github.com:Sogni-AI/sogni-makeup.git
cd sogni-makeup
npm install
```

### Configure

```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your Sogni credentials:

```env
SOGNI_USERNAME=your_username
SOGNI_PASSWORD=your_password
SOGNI_APP_ID=your_app_id
CLIENT_ORIGIN=https://makeover-local.sogni.ai
PORT=3002
```

### Run

Start the backend and frontend in separate terminals:

```bash
# Terminal 1 — Backend (port 3002)
cd server && npm run dev

# Terminal 2 — Frontend (port 5176)
npm run dev
```

> **Important:** Always use the Nginx-proxied subdomains for local development, never `localhost`. CORS, cookies, and OAuth all require the `.sogni.ai` domain.
>
> - Frontend: `https://makeover-local.sogni.ai`
> - Backend API: `https://makeover-api-local.sogni.ai`

### Build

```bash
npm run build            # Production
npm run build:staging    # Staging
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (React)                    │
│                                                          │
│  Landing → Camera → Studio → Results → History           │
└──────────┬──────────────────────┬────────────────────────┘
           │ Demo Mode            │ Authenticated
           ▼                      ▼
┌─────────────────────┐  ┌────────────────────────────┐
│   Express Backend    │  │  FrontendSogniClientAdapter │
│   (secure proxy)     │  │  (direct SDK connection)    │
└──────────┬──────────┘  └─────────────┬───────────────┘
           │                           │
           ▼                           ▼
┌──────────────────────────────────────────────────────────┐
│              Sogni Client SDK → Socket Service            │
│                   (DePIN GPU Network)                     │
└──────────────────────────────────────────────────────────┘
```

**Demo users** route through the Express backend, which acts as a secure proxy keeping SDK credentials server-side. **Authenticated users** connect directly to the Sogni network via the frontend SDK adapter for lower latency.

## Project Structure

```
src/
├── components/
│   ├── auth/          # Authentication & email verification
│   ├── camera/        # Photo capture & upload
│   ├── studio/        # Makeover transformation UI
│   ├── results/       # Before/after comparison
│   ├── history/       # Past transformations
│   ├── landing/       # Landing page hero
│   ├── layout/        # Header, footer, navigation
│   └── common/        # Shared UI components
├── config/            # Environment-aware configuration
├── constants/         # Presets, settings, model defaults
├── context/           # React Context (AppContext, Toast)
├── hooks/             # Custom React hooks
├── services/          # API, auth, SDK adapter, image processing
├── styles/            # Global styles & Tailwind utilities
├── types/             # TypeScript definitions
└── utils/             # Image processing, cookies, tab sync
server/
├── routes/            # Express API route handlers
└── services/          # Sogni SDK instance management
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend dev server |
| `npm run server:dev` | Start backend dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint (must pass with 0 warnings) |
| `npm run validate:useeffect` | Validate useEffect patterns |

## License

All rights reserved. Copyright Sogni AI, Inc.
