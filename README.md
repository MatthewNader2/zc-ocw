# ZC OCW (OpenCourseWare)

A modern, highly engaging OpenCourseWare platform built to centralize and enhance the educational experience for university students. This full-stack application seamlessly integrates with our university's official YouTube channel to curate educational video content, while wrapping it in a dedicated learning environment packed with interactive features and supplemental academic resources.

## ✨ Key Features

### 🎓 For Students
* **YouTube Video Integration:** Automatically fetches and synchronizes course playlists from the official OCW YouTube channel, providing a distraction-free, ad-free video player interface tailored for learning.
* **Interactive Bookmarking:** Students can bookmark specific courses or individual video lectures, allowing them to quickly pick up exactly where they left off without navigating through complex hierarchies.
* **Enriched Course Materials:** Videos are supplemented with downloadable resources. Students can access slide decks, assignments, textbooks, and other reference materials directly beneath the video player.
* **Fast & Responsive UI:** Designed as a modern Single Page Application (SPA), the platform guarantees seamless page transitions and instantaneous content loading without full page refreshes.

### ⚙️ For Administrators
* **Metadata Management:** The admin dashboard allows faculty and platform managers to enrich raw YouTube playlists with critical university metadata (School IDs, Program IDs, Course Codes, Semesters, and specific tags).
* **Resource Uploads:** Administrators can attach PDFs, textbooks, and other necessary file types directly to specific courses, securely managing them via Cloudflare's ecosystem.
* **Secure Access:** Protected routes and environment-level security ensure that only authorized personnel can execute database schemas, alter course details, or upload new materials.

---

## 🛠 Architecture & Tech Stack

This project utilizes a decoupled, modern edge computing architecture, separating the client-side interface from the serverless backend.

### Frontend (Client-Side)
* **Framework:** React 18 powered by Vite.
* **Routing:** React Router DOM (Client-side routing for SPA functionality).
* **Styling:** TailwindCSS for utility-first, highly responsive design.
* **Hosting:** Vercel Global Edge Network.

### Backend (API & Database)
* **Runtime:** Cloudflare Workers (Serverless edge execution).
* **Database:** Cloudflare D1 (Serverless SQLite database designed for the edge).
* **Storage (Planned/Supported):** Cloudflare R2 for storing downloadable course materials and textbook PDFs.
* **Development CLI:** Wrangler (`wrangler d1`, `wrangler deploy`).

---

## 📂 Repository Structure

The project follows a monorepo-style structure, housing both the Vite frontend and the Cloudflare Worker API.

```text
zc-ocw/
├── public/                 # Static assets for the frontend
├── src/                    # Frontend React codebase
│   ├── assets/             # Images, global CSS, icons
│   ├── components/         # Reusable React components (UI, layout, sections)
│   ├── context/            # React Context providers (State management)
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Route-level components (Home, Courses, Admin, etc.)
│   ├── services/           # API integration and fetch calls
│   └── utils/              # Helper functions
├── workers/api/            # Backend Cloudflare Worker API
│   ├── src/                # Worker routing and logic (Hono/IttyRouter/Fetch handlers)
│   ├── schema.sql          # D1 SQLite database initialization schema
│   └── wrangler.jsonc      # Cloudflare deployment and binding configurations
├── vercel.json             # Vercel SPA routing configuration
├── vite.config.ts          # Vite build configuration
└── package.json            # Frontend dependency manifest
```

---

## 🚀 Local Development Guide

### Prerequisites
1.  **Node.js** (v18+ recommended)
2.  **Git**
3.  **Cloudflare Wrangler CLI** installed globally (`npm install -g wrangler`)

### 1. Database Setup
The backend utilizes Cloudflare D1. To set up your local development database:
```bash
cd workers/api
wrangler d1 execute zc-ocw-db --local --file=schema.sql
```

### 2. Running the Backend API
Start the local Cloudflare Worker environment to handle API requests:
```bash
cd workers/api
wrangler dev
```
*The local API will typically run on `http://localhost:8787`.*

### 3. Running the Frontend
In a new terminal window, navigate to the root directory, install dependencies, and start the Vite development server:
```bash
cd zc-ocw
npm install
npm run dev
```
*The local frontend will typically run on `http://localhost:5173`.*

---

## 🌍 Deployment

### Deploying the Database & Backend (Cloudflare)
1. Ensure your production D1 database is linked in `workers/api/wrangler.jsonc`.
2. Apply the schema to your production database:
   ```bash
   wrangler d1 execute zc-ocw-db --remote --file=workers/api/schema.sql
   ```
3. Deploy the Worker:
   ```bash
   wrangler deploy --config=workers/api/wrangler.jsonc
   ```

### Deploying the Frontend (Vercel)
This project is configured to deploy automatically via GitHub integration to Vercel. 
1. The `vercel.json` file ensures that all traffic is correctly routed to `index.html` to prevent 404 errors on SPA routes like `/admin`.
2. Ensure you have set your Environment Variables (e.g., `VITE_API_URL`) in the Vercel Dashboard to point to your deployed Cloudflare Worker URL.
3. Simply commit and push your code to the `main` branch to trigger a new build.

```bash
git add .
git commit -m "Your commit message"
git push
```
