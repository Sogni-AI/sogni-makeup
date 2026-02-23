# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sogni Makeover is an AI-powered virtual makeover web application that enables users to transform their appearance using advanced image editing models. Built with React 18 + TypeScript + Vite (frontend) and Node.js/Express (backend), it uses the Sogni Client SDK for DePIN-powered image generation and the Qwen Image Edit 2511 model for targeted image modifications.

**Live site**: https://makeover.sogni.ai

## Development Commands

```bash
# Install all dependencies (including server via prepare script)
npm install

# Configure backend
cp server/.env.example server/.env  # Add Sogni credentials

# Run development servers
cd server && npm run dev    # Terminal 1: Backend (port 3002)
npm run dev                 # Terminal 2: Frontend (port 5176)

# Build
npm run build               # Production build
npm run build:staging       # Staging build

# Code quality
npm run lint                # ESLint (must pass with 0 warnings)
npm run validate:useeffect  # Validate useEffect patterns before committing
```

## Local Development URLs

**NEVER use localhost or 127.0.0.1**. Always use the Nginx-proxied subdomains:
- Frontend: `https://makeover-local.sogni.ai`
- Backend API: `https://makeover-api-local.sogni.ai`

Reason: CORS, cookies (.sogni.ai domain), and OAuth redirects all require proper subdomains.

## Architecture

### System Flow

**For Logged-Out Users (Demo Mode):**
```
Frontend -> Backend API -> Sogni Client SDK -> Sogni Socket Service
```
The backend acts as a secure proxy to the Sogni SDK, keeping credentials server-side only.

**For Logged-In Users:**
```
Frontend -> FrontendSogniClientAdapter -> Sogni Client SDK (direct) -> Sogni Socket Service
```
When users are authenticated, the frontend uses the SDK directly via `FrontendSogniClientAdapter`. This bypasses the backend for image generation, providing lower latency and direct WebSocket communication.

### Key Directories

- `src/` - React frontend
  - `components/` - React components organized by feature
    - `auth/` - Authentication flows
    - `camera/` - Camera capture and image upload
    - `makeover/` - Makeover transformation UI
    - `results/` - Before/after comparison views
    - `shared/` - Reusable UI components
    - `layout/` - Layout and navigation components
  - `config/` - Environment-aware configuration (URLs, settings)
  - `constants/` - Application constants and makeover presets
  - `context/` - React Context providers (AppContext, etc.)
  - `hooks/` - Custom React hooks
  - `services/` - API communication, auth, Sogni SDK adapter
  - `styles/` - Global styles and Tailwind utilities
  - `types/` - TypeScript type definitions
  - `utils/` - Utility functions (image processing, etc.)
- `server/` - Express backend (separate package.json, port 3002)
  - `routes/` - API route handlers
  - `services/` - Core SDK instance management
- `public/` - Static assets, PWA manifest, icons
- `scripts/` - CLI tools, deployment, nginx configuration

### AI Model: Qwen Image Edit 2511

The makeover feature uses the **Qwen Image Edit 2511** model, which supports:
- Targeted image editing via text prompts
- Face-aware transformations (hairstyle, makeup, accessories)
- Style transfer while preserving facial identity
- High-quality output with natural blending

The model accepts a source image and a text prompt describing the desired transformation, and produces an edited image that applies the requested changes while maintaining the subject's identity.

### Server-Sent Events (SSE) for Progress

Real-time generation updates use EventSource, not WebSockets:
```typescript
GET /api/sogni/progress/:projectId?clientAppId=xxx
// Events: connected, progress, jobCompleted, complete, error
```

## Related Sogni Repositories

These sibling repositories are available locally for reference:

- **`../sogni-client`** - Sogni Client SDK (TypeScript). Reference for SDK features, Project/Job entities, WebSocket communication.
- **`../sogni-socket`** - Sogni Socket Service. WebSocket server for job routing between artists and GPU workers.
- **`../sogni-api`** - Sogni REST API. Backend for accounts, authentication, transactions.
- **`../sogni-photobooth`** - Sogni Photobooth app. Reference implementation for the dual-mode architecture (demo proxy + frontend SDK).
- **`../ComfyUI`** - Sogni Comfy Fast Worker. ComfyUI-based GPU worker for image generation.

## useEffect Rules (MANDATORY)

Every useEffect must pass `npm run validate:useeffect` before committing.

**Golden Rule**: Each effect has ONE responsibility.

**NEVER add to dependency arrays**:
- Functions (`initializeSogni`, `handleClick`, `updateSetting`)
- Whole objects (`settings`, `authState`)
- Context functions (`updateSetting`, `clearCache`)

**Only add primitives that should trigger the effect**:
```typescript
// CORRECT - separate effects for separate concerns
useEffect(() => {
  if (authState.isAuthenticated) initializeSogni();
}, [authState.isAuthenticated]);

useEffect(() => {
  if (settings.watermark) updateWatermark();
}, [settings.watermark]);
```

## Environment Configuration

| File | Purpose |
|------|---------|
| `server/.env` | Backend secrets (SOGNI_USERNAME, SOGNI_PASSWORD, Redis config) |
| `.env.local` | Frontend local dev (VITE_* vars) |
| `.env.production` | Frontend production config |
| `scripts/nginx/local.conf` | Nginx reverse proxy configuration |

## Debugging

- Check for `code: 4015` errors (multiple SDK instances conflict)
- Check for "Invalid nonce" errors (concurrent SDK creation)
- The SDK supports concurrent projects - never assume sequential processing
- Always examine actual code before making assumptions about behavior
