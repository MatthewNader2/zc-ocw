# ZC OCW — Deployment & Operations Guide

## Architecture Overview

```
Browser (User) ──► Vercel Global CDN (React 18 SPA)
                       │
                       ├──► Cloudflare Worker API (Edge Proxy & D1 SQLite Database)
                       └──► YouTube Data API v3 (Course Video Playlists)
```

- **Frontend**: React 18 + Vite + TailwindCSS hosted on **Vercel**.
- **Backend API**: Cloudflare Workers serverless API proxy (`workers/api`).
- **Database**: Cloudflare D1 serverless SQLite database.
- **Storage**: Cloudflare R2 / Local fallback for course materials and textbooks.

---

## Automatic Deployment Workflow (Vercel CI/CD)

### 1. How Vercel Deployment Works
Vercel is directly integrated with the GitHub repository (`MatthewNader2/zc-ocw`). 

- **Automatic Trigger**: Every git push to the `main` branch automatically triggers Vercel to pull the latest code, execute `npm run build`, and deploy the production bundle to your live domain within ~30 seconds.
- **No Manual Build Step Required**: You do **not** need to press any button in Vercel to update your website when code changes are pushed to `main`.

### 2. Required Vercel Environment Variables
Ensure the following variables are configured in **Vercel Dashboard → Project Settings → Environment Variables**:

| Variable Name | Purpose | Example Value |
|---|---|---|
| `VITE_WORKER_URL` | Base URL of your deployed Cloudflare Worker API | `https://zc-ocw-api.your-subdomain.workers.dev` |
| `VITE_YOUTUBE_CHANNEL_ID` | Official Zewail City YouTube Channel ID | `UCGNOEBp7AZaY4XPNoagpv8w` |
| `VITE_ADMIN_PASSWORD` | Secure password for accessing `/admin` routes | `YourSecretAdminPassword123!` |

---

## Backend Deployment Guide (Cloudflare Workers & D1)

The backend code is housed inside `workers/api`. Changes to the backend API or database schema are managed via Cloudflare Wrangler.

### 1. Database Schema Deployment
To provision or update the Cloudflare D1 production database schema:
```bash
cd workers/api
npx wrangler d1 execute zc-ocw-db --remote --file=schema.sql
```

### 2. Deploying Worker API Code
To deploy updates to the Cloudflare Worker API proxy:
```bash
cd workers/api
npx wrangler deploy
```

---

## Action Items for You (What You Need to Do)

### Current Release (v3.1.0 Updates)
- **Zero manual steps required!** All batch code updates have already been committed and pushed to `origin/main`. Vercel has automatically built and deployed the live site.

### Checklist for Initial Setup (Only if setting up a new domain/environment)
1. **Verify Vercel Environment Variables**: Ensure `VITE_WORKER_URL`, `VITE_YOUTUBE_CHANNEL_ID`, and `VITE_ADMIN_PASSWORD` are set in Vercel.
2. **Custom Domain (Optional)**: In Vercel → Project Settings → Domains, add `ocw.zewailcity.edu.eg` and point your CNAME record to `cname.vercel-dns.com`.
3. **Cloudflare Worker URL**: Ensure your Worker URL in `VITE_WORKER_URL` is active and responding to `/api/youtube/playlists`.

---

## Handoff & Maintenance Summary

- **Local Development**: `npm run dev` (Frontend) & `cd workers/api && npx wrangler dev` (Backend).
- **Production Build Check**: `npm run build`.
- **LocalStorage Namespace**: All client-side storage keys use `zcocw_` prefix managed via `src/services/storage.js`.
- **Security Headers**: Standardized in `vercel.json` (`X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`).
