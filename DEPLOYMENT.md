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
| `VITE_FIREBASE_API_KEY` | From Firebase Console → Project Settings → General | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Same page | `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Same page — must match the Worker's `FIREBASE_PROJECT_ID` secret below | `your-project-id` |
| `VITE_FIREBASE_APP_ID` | Same page | `1:1234567890:web:abcdef` |

> `VITE_ADMIN_PASSWORD` is **retired** — admin access is now Firebase-account-based (see "Admin Accounts" below). Remove it from Vercel once the new flow is live.

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
1. **Verify Vercel Environment Variables**: Ensure `VITE_WORKER_URL`, `VITE_YOUTUBE_CHANNEL_ID`, and the `VITE_FIREBASE_*` keys are set in Vercel.
2. **Custom Domain (Optional)**: In Vercel → Project Settings → Domains, add `ocw.zewailcity.edu.eg` and point your CNAME record to `cname.vercel-dns.com`.
3. **Cloudflare Worker URL**: Ensure your Worker URL in `VITE_WORKER_URL` is active and responding to `/api/youtube/playlists`.

---

## Handoff & Maintenance Summary

- **Local Development**: `npm run dev` (Frontend) & `cd workers/api && npx wrangler dev` (Backend).
- **Production Build Check**: `npm run build`.
- **LocalStorage Namespace**: All client-side storage keys use `zcocw_` prefix managed via `src/services/storage.js`.
- **Security Headers**: Standardized in `vercel.json` (`X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`).

---

## Admin Accounts (Firebase Authentication)

As of this update, `/admin` is no longer gated by a single shared password.
Everyone — visitors and admins — uses the same sign-in screen
(Google or email/password). Whether an account can reach `/admin` is
decided by the Worker, by checking the signed-in account's email against
an `admins` table in D1.

### 1. Create a Firebase project (free)

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project** → give it any name → you can decline Google Analytics.
2. **Build → Authentication → Get started**. Under **Sign-in method**, enable:
   - **Google** (just toggle it on, pick a support email)
   - **Email/Password**
3. **Project settings (gear icon) → General → Your apps → Add app → Web** (`</>` icon). Register it (no hosting needed). Copy the `firebaseConfig` values — you need `apiKey`, `authDomain`, `projectId`, `appId`.
4. **Authentication → Settings → Authorized domains** — add your Vercel domain (e.g. `zc-ocw.vercel.app`) and your custom domain if you have one. `localhost` is included by default.

### 2. Set the frontend env vars (Vercel)

Add the four `VITE_FIREBASE_*` values from step 1 to **Vercel → Project Settings → Environment Variables** (see table above), then redeploy.

### 3. Set the Worker secrets (Cloudflare)

From `workers/api`:

```bash
npx wrangler secret put FIREBASE_PROJECT_ID
# paste the same projectId from firebaseConfig above

npx wrangler secret put FIREBASE_SUPER_ADMIN_EMAIL
# the email of the very first admin — must be the exact email of a
# Google/email account you'll sign in with. This account is always
# treated as admin, even before the `admins` D1 table has any rows.
```

You can now delete the old `ADMIN_PASSWORD` secret if it's still set:
```bash
npx wrangler secret delete ADMIN_PASSWORD
```

### 4. Run the new migration

```bash
cd workers/api
npx wrangler d1 execute zc-ocw-db --remote --file=migration.sql
npx wrangler deploy
```

This creates the `admins` and `acknowledgments` tables in production D1.

### 5. First login

1. Deploy the frontend (push to `main`, Vercel auto-deploys).
2. Go to `/admin/login` on your live site, sign in with **the exact email**
   you set as `FIREBASE_SUPER_ADMIN_EMAIL` (Google sign-in is easiest —
   guarantees the email matches and is verified).
3. You'll land on `/admin`. From there, go to **Admin → Team** to grant
   admin access to other people's emails — they just need to sign up /
   sign in once first (with Google or email+password), then you add
   their email to the allowlist.

> Regular visitors who sign in (e.g. via Google) but aren't on the
> `admins` list are simply logged-in users — they see a message on the
> login page explaining they don't have admin access, and nothing else
> in the site changes for them yet. That's the seam for building
> visitor-only features later (cloud-synced bookmarks/progress, etc.)
> without touching the admin system.
