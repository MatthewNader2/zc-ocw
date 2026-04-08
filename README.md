# ZC OCW — Zewail City Open CourseWare

A responsive React website that automatically pulls courses (playlists) and lectures (videos)
from the university's YouTube channel, enriched with manually curated metadata.

---

## Quick Start

```bash
# 1. Clone & enter the project
git clone https://github.com/YOUR_USERNAME/zc-ocw.git
cd zc-ocw

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# → fill in VITE_YOUTUBE_API_KEY and VITE_YOUTUBE_CHANNEL_ID (see below)

# 4. Run the dev server
npm run dev
# → http://localhost:3000
```

---

## Environment Variables

Copy `.env.example` → `.env` and fill in:

| Variable                    | Where to get it |
|-----------------------------|-----------------|
| `VITE_YOUTUBE_API_KEY`      | [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → Create API Key. Then enable **YouTube Data API v3**. |
| `VITE_YOUTUBE_CHANNEL_ID`   | Go to your YouTube channel → About → Share → **Copy channel ID**. It starts with `UC`. |
| `VITE_YOUTUBE_CHANNEL_HANDLE` | Optional. Your channel handle e.g. `@ZewailCityOCW`. |

> ⚠️ Never commit `.env` — it's in `.gitignore` already.  
> The free YouTube Data API quota is **10,000 units/day**. React Query caches responses for 10 minutes to keep usage low.

---

## Adding Logos

| File | Where to put it | Used in |
|------|-----------------|---------|
| `logo.svg`     | `public/logo.svg`     | Navbar, Footer, browser favicon |
| `ocw-logo.svg` | `public/ocw-logo.svg` | Hero section (hidden if missing) |

Both files can also be `.png` — just update the `src` in `Navbar.jsx`, `Footer.jsx`, and `HeroSection.jsx`.

---

## Adding / Enriching Courses

Edit `src/data/courses.js`:

```js
export const COURSE_META = {
  'PLxxxxxxxxxxxxxx': {          // ← YouTube Playlist ID
    department: 'nanotechnology',  // ← slug from DEPARTMENTS array
    level: 'Undergraduate',
    instructor: 'Prof. Ahmed Hassan',
    semester: 'Fall 2024',
    materials: [
      { label: 'Syllabus (PDF)', url: 'https://drive.google.com/...' },
      { label: 'Problem Sets',   url: 'https://drive.google.com/...' },
    ],
  },
}
```

Courses not listed here still appear automatically — just without department badge, level, or materials.

---

## Scripts

| Command         | What it does |
|-----------------|--------------|
| `npm run dev`   | Start dev server on port 3000 with hot reload |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint`  | Run ESLint |
| `npm run format`| Prettier auto-format all `src/**` files |

---

## Deploying

### Vercel (recommended — free)
```bash
npm i -g vercel
vercel
# Add VITE_YOUTUBE_API_KEY and VITE_YOUTUBE_CHANNEL_ID in the Vercel dashboard → Settings → Environment Variables
```

### Netlify
```bash
npm run build
# Drag & drop the dist/ folder to netlify.com/drop
# Set env vars in Site settings → Environment variables
```

### GitHub Pages
Use `vite-plugin-gh-pages` or GitHub Actions. Add `base: '/zc-ocw/'` to `vite.config.js` if deploying to a sub-path.

---

## Project Structure

```
zc-ocw/
├── public/
│   ├── logo.svg          ← PUT YOUR LOGO HERE
│   └── ocw-logo.svg      ← PUT YOUR OCW LOGO HERE
├── src/
│   ├── components/
│   │   ├── layout/       Navbar, Footer, Layout
│   │   ├── ui/           CourseCard, VideoCard, SearchBar, Spinners, Error
│   │   └── sections/     HeroSection, FeaturedCourses, DepartmentGrid
│   ├── pages/            Home, Courses, CourseDetail, VideoPlayer, Departments, About, Search
│   ├── hooks/            useYouTube.js  (React Query wrappers)
│   ├── services/         youtube.js     (raw API calls)
│   ├── data/             courses.js     (departments + manual metadata)
│   └── utils/
├── .env.example
├── .gitignore
└── README.md
```

---

## License

Course content: [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)  
Website code: MIT
