# ZC OCW — Deployment Guide

## Architecture

```
Browser ──► Vercel (React SPA)
                │
                ├──► YouTube Data API v3  (lectures, playlists, search)
                └──► Supabase             (course metadata, file uploads)
```

No Docker. No Kubernetes. This stack is free, zero-maintenance, and scales automatically.

---

## Step 1 — Supabase (Backend + File Storage)

### Create the project
1. Go to **https://supabase.com** → Sign up (free)
2. Click **New project** → choose a name (e.g. `zc-ocw`) and a region close to Egypt
3. Wait ~2 minutes for provisioning

### Run the schema
1. In your Supabase dashboard → **SQL Editor** → **New query**
2. Paste the entire contents of `supabase/schema.sql`
3. Click **Run**

### Create the storage bucket
1. Left sidebar → **Storage** → **New bucket**
2. Name: `materials`
3. Toggle **Public bucket** ON → **Save**

### Get your keys
Go to **Project Settings** (gear icon) → **API**:
- **Project URL** → `VITE_SUPABASE_URL`
- **anon / public key** → `VITE_SUPABASE_ANON_KEY`
- **service_role key** → `VITE_SUPABASE_SERVICE_KEY` *(keep secret)*

---

## Step 2 — GitHub

```bash
# In D:\zc-ocw\zc-ocw\
git init                        # already done if you ran setup.sh
git remote add origin https://github.com/YOUR_USERNAME/zc-ocw.git
git add .
git commit -m "feat: initial ZC OCW site"
git push -u origin main
```

Create the repo first at https://github.com/new (name: `zc-ocw`, private recommended).

---

## Step 3 — Vercel (Frontend Hosting)

### First deploy
1. Go to **https://vercel.com** → Sign up with GitHub
2. Click **Add New → Project**
3. Import your `zc-ocw` repo
4. Framework preset: **Vite**
5. Click **Environment Variables** and add all 6 keys from your `.env`:

| Key | Value |
|-----|-------|
| `VITE_YOUTUBE_API_KEY` | your YT key |
| `VITE_YOUTUBE_CHANNEL_ID` | `UCGNOEBp7AZaY4XPNoagpv8w` |
| `VITE_ADMIN_PASSWORD` | your strong password |
| `VITE_SUPABASE_URL` | from Supabase |
| `VITE_SUPABASE_ANON_KEY` | from Supabase |
| `VITE_SUPABASE_SERVICE_KEY` | from Supabase |

6. Click **Deploy** → done in ~30 seconds

Your site is live at `https://zc-ocw.vercel.app` (or your custom domain).

### Custom domain
Vercel → your project → **Settings** → **Domains** → Add `ocw.zewailcity.edu.eg`
Then add a CNAME record in your DNS: `ocw` → `cname.vercel-dns.com`

---

## Updating the site

Every push to `main` triggers an automatic Vercel redeploy:

```bash
# Make your changes, then:
git add .
git commit -m "feat: add new course enrichments"
git push
# ✅ Vercel detects the push and redeploys in ~30s
```

To preview before going live:
```bash
git checkout -b my-feature
# make changes
git push origin my-feature
# Vercel auto-creates a preview URL for this branch
```

---

## Updating course data (without code changes)

1. Go to `https://your-site.vercel.app/admin/login`
2. Log in with your `VITE_ADMIN_PASSWORD`
3. Edit any course — changes save to Supabase instantly, no redeploy needed

---

## Docker (optional — local development only)

Docker is not needed for deployment (Vercel and Supabase handle everything),
but you can use it for a consistent local dev environment:

```dockerfile
# Dockerfile (local dev only)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host"]
```

```bash
docker build -t zc-ocw .
docker run -p 3000:3000 --env-file .env zc-ocw
# → http://localhost:3000
```

**Why not Kubernetes?**
K8s is designed for 50+ microservices at massive scale. ZC OCW has 1 frontend
(a static file bundle) and no custom backend server — Supabase is the backend.
Using K8s here would be like renting a cargo ship to cross the street.
Vercel + Supabase is the right tool: simpler, cheaper (free), and more reliable.

---

## Cost

| Service | Free tier limit | You'll use |
|---------|----------------|------------|
| Vercel | 100 GB bandwidth/mo | < 1 GB |
| Supabase | 500 MB DB, 1 GB storage, 50 MB uploads | < 50 MB |
| YouTube API | 10,000 quota units/day | ~200/day |

**Total cost: $0/month** for any realistic university OCW traffic.

If you ever outgrow Supabase Storage (1 GB), upgrade to the $25/mo Pro plan or
switch file storage to Cloudflare R2 (10 GB free).

---

## Environment variable security

- `VITE_*` keys are bundled into the browser JavaScript — anyone can see them
- `VITE_SUPABASE_ANON_KEY` is designed to be public (read-only by RLS policy)
- `VITE_SUPABASE_SERVICE_KEY` allows writes — in production, move admin writes
  to a Vercel serverless function (`api/admin.js`) so the service key never
  reaches the browser. For a university internal tool this is fine as-is.
- `VITE_ADMIN_PASSWORD` is visible in JS bundle — use a strong password and
  consider adding IP restriction in Vercel if needed.
