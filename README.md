<div align="center">

# 🌌 ZC OCW — OpenCourseWare
**A Next-Generation Open Education Platform Inspired by Ahmed Zewail's Vision**

[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-Edge-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Cloudflare D1](https://img.shields.io/badge/Cloudflare_D1-Serverless_SQLite-F38020?logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/d1/)
[![License](https://img.shields.io/badge/License-CC_BY--NC--SA_4.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

<br />

> *"Knowledge becomes more powerful when it is shared."*
>
> — Inspired by Nobel Laureate **Professor Ahmed Zewail** and his lifelong pursuit of a scientific renaissance in Egypt and the Arab world.

<br />

[Explore Courses](https://zc-ocw.vercel.app/courses) • [Interviews & Series](https://zc-ocw.vercel.app/interviews) • [About the Initiative](https://zc-ocw.vercel.app/about) • [Acknowledgments](https://zc-ocw.vercel.app/acknowledgments)

---

</div>

## 📖 The Story & Origin

**Zewail City OpenCourseWare (ZC-OCW)** was founded in **2017** by a group of undergraduate students at the University of Science and Technology in Zewail City. Armed with cameras, microphones, and an unwavering ambition to make high-caliber university education accessible to everyone, the team set out to record, curate, and freely publish complete lecture courses.

What began in university lecture halls has grown into a vibrant scientific library:
- 🎓 **551+ Complete University Lectures**
- 👥 **22,000+ Lifelong Subscribers**
- 🌐 **833,000+ Total Video Views**
- 🧪 **4 Academic Schools**: CSAI (Computer Science & AI), Engineering, Science, and Business.
- 🎙️ **Special Series**: Academic interviews, public keynotes, summer schools, and student research seminars.

Today, ZC-OCW stands as an **independent, student-led open educational platform** dedicated to students and lifelong learners across Egypt, the Middle East, and worldwide.

---

## 🌌 The Celestial & Physics Simulation Engine

ZC-OCW is designed to feel alive. Rather than a static catalog of videos, the interface incorporates **physics-based visual and acoustic systems** that mimic the natural world and celestial mechanics:

```
                  ┌─────────────────────────────────────┐
                  │    Real-Time Ephemeris Engine       │
                  │  (Coordinates: 29.986°N, 31.212°E)   │
                  └──────────────────┬──────────────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           ▼                         ▼                         ▼
 ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
 │  Atmospheric Sky │      │ Dynamic Cosmic   │      │ Harmonic Audio   │
 │ Twilight Colors  │      │ Particle Field   │      │ Synthesizer      │
 │ (Dusk/Dawn/Noon) │      │ (Inverse-Square) │      │ (Web Audio API)  │
 └──────────────────┘      └──────────────────┘      └──────────────────┘
```

### 1. ☀️ Real-Time Cairo/Giza Ephemeris Sky Engine
The platform dynamically calculates the astronomical position of the Sun and Moon based on the physical coordinates of **Zewail City (29.986° N, 31.212° E)**:
* **Atmospheric Scattering & Twilight Phases**: The sky background smoothly shifts through true astronomical twilight states: *Astronomical Dawn*, *Nautical Twilight*, *Civil Golden Hour*, *Solar Noon Zenith*, and *Starlit Night*.
* **Celestial Clock**: An interactive astronomical HUD tracks solar altitude, azimuth, and lunar phase illumination in real-time, grounding the digital learning space in the physical sky above Giza.

### 2. ⚛️ Particle Constellation & Quantum Dynamics
Interactive background canvases simulate cosmic dust and orbital constellations using physics principles:
* **Inverse-Square Proximity Graphing**: Particles drift with Brownian motion; when two particles pass within close range, gravitational node vectors connect them to form dynamic constellations.
* **Cursor & Scroll Resonance**: Particle velocities react to user interaction, accelerating with mouse movement and dampening with smooth inertia.

### 3. 🎵 Harmonic Web Audio Synthesizer
The platform includes an embedded Web Audio API frequency synthesizer that generates tactile acoustic feedback:
* Resonant harmonic tones mimic the soundscapes of scientific frequency generators and optical laboratory equipment, providing subtle, satisfying auditory feedback during UI interactions.

---

## ⚡ Key Features

### 🎓 For Learners
* **Distraction-Free Video Classroom**: Complete ad-free learning interface with responsive 16:9 video playback, timestamped lecture navigation, and playback speed memory.
* **Instant Course Bookmarks & Progress Tracking**: Save courses and individual lectures to your local profile with visual completion dials and quick-resume shortcuts.
* **Integrated Course Materials Hub**: Access slide decks, assignments, syllabi, and reference textbooks directly alongside video lectures.
* **Multi-Tier Search & Filtering**: Instant search across titles, course codes (`PHYS 101`, `CSAI 201`, `CIE 202`), professors, and academic levels (Undergraduate / Graduate).
* **Interviews & Special Content Portal**: Dedicated showcase for faculty interviews, guest keynotes, tech talks, and student club activities.

### 🛡️ For Administrators (CMS & Studio)
* **Customizable Navbar & Section Headings**: Rename navbar tabs, home section titles, taglines, and social links live from the Admin Settings without modifying code.
* **Interactive Team & Hall of Fame Manager**:
  * **Drag-and-Drop Card Reordering**: Effortlessly arrange team members and timeline slides using HTML5 drag-and-drop or quick position buttons.
  * **In-Place Profile Editing**: Update names, roles, bios, and LinkedIn profiles without losing existing data.
  * **Built-in Image Cropper**: Client-side canvas cropper for square avatars and timeline slides with direct Cloudflare R2 upload.
* **Intelligent Auto-Detection Profiler**: Automatically extracts course numbers, semesters, and instructors from YouTube playlist titles via regex heuristics.
* **Materials & Syllabus Uploader**: Attach PDF notes and textbook references directly to any course playlist.

---

## 🛠️ Architecture & Tech Stack

```text
┌────────────────────────────────────────────────────────┐
│                   Frontend (Client)                    │
│      React 18  •  Vite 6  •  Tailwind CSS  •  SPA      │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / REST
                            ▼
┌────────────────────────────────────────────────────────┐
│             Cloudflare Worker API (Edge)               │
│     Routing  •  JWT Auth  •  CORS  •  Observability    │
└──────────────┬───────────────────────────┬─────────────┘
               │                           │
               ▼                           ▼
┌──────────────────────────────┐ ┌───────────────────────┐
│     Cloudflare D1 (SQL)      │ │  Cloudflare R2 (Blob) │
│  Course Overrides & Pages    │ │   Course Materials    │
└──────────────────────────────┘ └───────────────────────┘
```

| Layer | Technology | Details |
|---|---|---|
| **Build & Tooling** | **Vite 6.x** | Ultra-fast HMR, Rollup production bundling |
| **Frontend Framework** | **React 18.x** | Modern component tree with hooks & suspense |
| **Routing** | **React Router 6** | SPA client-side routing with clean URL history |
| **Styling & Motion** | **Tailwind CSS 3.4** | Custom color tokens, glassmorphism, responsive utilities |
| **Icons & Media** | **Lucide React** & **React Player** | Lightweight SVG iconography and YouTube embedding |
| **State & Cache** | **TanStack Query v5** | YouTube API caching, background revalidation |
| **Edge Serverless** | **Cloudflare Workers** | Global low-latency API router (`nodejs_compat`) |
| **Serverless Database**| **Cloudflare D1** | SQLite at the edge for course metadata and CMS content |
| **Asset Storage** | **Cloudflare R2** | S3-compatible bucket for PDF materials and team photos |
| **Authentication** | **Firebase Auth / Jose** | Secure admin authentication and JWT verification |

---

## 📂 Project Structure

```text
zc-ocw/
├── public/                 # Favicons, manifests, and static assets
├── src/
│   ├── components/         # Modular UI component library
│   │   ├── layout/         # Navbar, Footer, Dynamic Theme
│   │   ├── player/         # VideoPlayer, LectureItem, Notes
│   │   ├── sections/       # HeroSection, HomeSpotlight, FeaturedCourses
│   │   └── ui/             # CourseCard, CelestialSky, ParticleBackground, ImageCropper
│   ├── context/            # React contexts (Auth, AdminData, Progress, Settings)
│   ├── data/               # Academic catalogs, schools, site settings defaults
│   ├── hooks/              # Custom hooks (useYouTube, useEditablePage, useTheme)
│   ├── pages/              # Route views (Home, Courses, Interviews, About, Admin)
│   └── services/           # YouTube API v3, Cloudflare D1/R2 API, Storage
├── workers/api/            # Cloudflare Worker Edge API
│   ├── src/                # Worker handlers (CORS, D1 queries, R2 uploads, Auth)
│   ├── schema.sql          # D1 SQLite database initialization schema
│   └── wrangler.jsonc      # Cloudflare worker configuration & bindings
├── package.json            # Frontend manifests (Vite 6, React 18, Tailwind)
└── vite.config.ts          # Vite build & plugin configurations
```

---

## 🚀 Local Development

### Prerequisites
* **Node.js** (v18.0 or higher)
* **npm** or **pnpm**
* **Cloudflare Wrangler CLI** (`npm install -g wrangler`)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/MatthewNader2/zc-ocw.git
cd zc-ocw
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
VITE_YOUTUBE_API_KEY=your_google_youtube_data_api_v3_key
VITE_YOUTUBE_CHANNEL_ID=UCGNOEBp7AZaY4XPNoagpv8w
VITE_WORKER_URL=http://localhost:8787
```

### 3. Run the Cloudflare Worker API (Backend)
```bash
cd workers/api
npm install
# Initialize local D1 database
npx wrangler d1 execute zc-ocw-db --local --file=schema.sql
# Start worker
npx wrangler dev
```

### 4. Start the Frontend Development Server
In a separate terminal:
```bash
cd zc-ocw
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🚢 Deployment Workflow

### Deploying the Backend (Cloudflare Workers + D1)
```bash
cd workers/api
# Apply migrations to production database (if needed)
npx wrangler d1 execute zc-ocw-db --remote --file=schema.sql
# Deploy worker to edge
npx wrangler deploy
```

### Deploying the Frontend (Vercel / Cloudflare Pages)
The repository is set up with continuous deployment. Simply commit and push your changes to `main`:
```bash
git add .
git commit -m "feat: enhance platform features and celestial engine"
git push origin main
```

---

## 📄 License & Attribution

All course recordings, lecture materials, and educational media on **ZC OCW** are shared under the **[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/)** license.

* You are free to share, copy, and adapt the material for any non-commercial purpose.
* Appropriate credit must be given to **Zewail City OpenCourseWare** and the respective instructors.

---

<div align="center">

Made with ❤️ by students for students • **Zewail City OpenCourseWare**

</div>
