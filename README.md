# Vibe Editor

![Vibe Editor Thumbnail](public/vibe-code-editor-thumbnail.svg)

Vibe Editor is a browser-based coding workspace built with Next.js App Router, Monaco, and WebContainers. It includes project templates, GitHub import/export, an in-browser terminal, package management, and per-user editor settings.

## What It Currently Includes

- Monaco-based code editor with file explorer and tabbed editing
- WebContainer-powered preview and terminal (`xterm.js`) running in-browser
- Dashboard for creating, listing, editing, duplicating, and deleting playground projects
- Template-based project creation (React, Next.js, Express, Vue, Hono, Angular)
- GitHub integration:
  - Import repo into a playground
  - Export playground to new/existing GitHub repo
  - Deploy flow that pushes to GitHub then opens Vercel import
- npm package search/install/uninstall from inside the playground
- User settings for editor preferences (font size, tab size, theme, minimap, auto-save, word wrap, notifications)
- PWA assets: manifest, service worker, offline fallback page
- Command palette and keyboard shortcuts modal

## Important Behavior Notes

- Auth is enforced for all app routes except `/auth/sign-in` (see `proxy.ts` + `routes.ts`).
- AI suggestion API (`/api/code-suggestion`) is currently a stub and returns no suggestion until an LLM provider is integrated.
- Rate limiting is in-memory (`lib/rate-limit.ts`) and resets on server restart.

## Tech Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui + Radix UI
- Better Auth (OAuth via GitHub, optional Google)
- Prisma + MongoDB
- TanStack Query + Zustand
- Monaco Editor + WebContainer API + xterm.js

## Project Structure

```text
.
├── app/                          # App Router pages and API routes
├── components/                   # Shared UI and infrastructure components
├── features/                     # Domain modules (auth, dashboard, playground, settings, webcontainers)
├── hooks/                        # Shared hooks and query hooks
├── lib/                          # Environment, auth helpers, DB, API utilities, rate limiting
├── prisma/schema.prisma          # Prisma models for MongoDB
├── public/                       # Static assets, PWA manifest, service worker
├── vibecode-starters/            # Starter template source projects
├── .env.example                  # Example environment variables
└── README.md
```

## Prerequisites

- Node.js 20+
- MongoDB database
- GitHub OAuth app credentials
- Google OAuth credentials (optional, only if you want Google sign-in)

## Environment Variables

Copy `.env.example` to `.env` and fill required values:

```bash
DATABASE_URL=
AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
GITHUB_ID=
GITHUB_SECRET=
GOOGLE_ID=
GOOGLE_SECRET=
```

Notes:

- `AUTH_SECRET` must be at least 32 characters.
- `GOOGLE_ID`/`GOOGLE_SECRET` are optional in code.
- In production, set `BETTER_AUTH_URL` (or `NEXTAUTH_URL`) explicitly.

## Local Development

1. Install dependencies:
   - `npm install`
2. Generate Prisma client and sync schema:
   - `npx prisma generate`
   - `npx prisma db push`
3. Start dev server:
   - `npm run dev`
4. Open:
   - `http://localhost:3000`

## Available Scripts

- `npm run dev` - Run Next.js dev server with Turbopack
- `npm run build` - Generate Prisma client and build app
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## API Surface (Current)

- `GET/POST /api/auth/[...nextauth]` - Better Auth handler
- `POST /api/code-suggestion` - AI suggestion endpoint (stub)
- `GET /api/health` - DB connectivity check
- `GET/PUT /api/settings` - User editor/settings preferences
- `GET /api/npm/search` - npm package search
- `GET /api/github/repos` - Fetch connected GitHub repos
- `POST /api/github/import` - Import repo to playground
- `POST /api/github/export` - Export playground to GitHub
- `PUT/DELETE /api/dashboard/projects/:id` - Update/delete project
- `POST /api/dashboard/projects/:id/duplicate` - Duplicate project
- `GET /api/template/:id` - Resolve template JSON for playground

## Keyboard Shortcuts (Implemented UI)

- `Ctrl/Cmd + K` or `/` - Open command palette
- `?` - Open keyboard shortcuts modal
- `Ctrl + S` - Save active file
- `Ctrl + Space` - Trigger AI suggestion request (returns empty until AI backend is configured)

## Deployment Notes

- `vercel.json` is configured to use Bun for install/build on Vercel.
- API function timeouts are set per route group in `vercel.json`.
- CORS and security headers (`COOP`/`COEP`) are set in `next.config.ts` for WebContainer compatibility.

## Known Gaps / TODOs

- AI completion provider integration is not wired yet.
- Keyboard shortcut customization UI is marked as "coming soon."
- Rate limiting should move to Redis (or similar) for multi-instance production setups.
