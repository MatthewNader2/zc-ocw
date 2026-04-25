#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { detectFromTitle } from "../src/data/coursesCatalog.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.join(__dirname, "../.env");
  if (!fs.existsSync(envPath)) {
    console.error("Error: .env file not found.");
    process.exit(1);
  }
  const vars = {};
  const lines = fs.readFileSync(envPath, "utf8").split("\n");

  lines.forEach((line) => {
    const parts = line.split("=");
    const key = parts[0];
    if (key && !key.startsWith("#")) {
      const value = parts.slice(1).join("=").trim();
      vars[key.trim()] = value.split('"').join("").split("'").join("");
    }
  });
  return vars;
}

const env = loadEnv();
const API_KEY = env.VITE_YOUTUBE_API_KEY;
const CHANNEL_ID = env.VITE_YOUTUBE_CHANNEL_ID;

if (!API_KEY || !CHANNEL_ID) {
  console.error(
    "Missing VITE_YOUTUBE_API_KEY or VITE_YOUTUBE_CHANNEL_ID in .env",
  );
  process.exit(1);
}

/* ═══════════════════════════════════════════════════════
   1.  Enhanced Catalog Loader  (code + name + school)
   ═══════════════════════════════════════════════════════ */
function loadDynamicCatalog() {
  const catalogPath = path.join(__dirname, "catalog.txt");
  if (!fs.existsSync(catalogPath)) return [];

  let content = fs.readFileSync(catalogPath, "utf8");
  const courses = [];

  // Strip tags
  while (content.includes("<")) {
    const start = content.indexOf("<");
    const end = content.indexOf(">", start);
    if (end !== -1) {
      content = content.substring(0, start) + content.substring(end + 1);
    } else {
      break;
    }
  }

  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let currentSchool = null;
  let pendingCode = null;

  lines.forEach((line) => {
    // Detect school headers dynamically
    if (line.toLowerCase().startsWith("school of")) {
      const name = line
        .replace(/^School of\s+/i, "")
        .trim()
        .toLowerCase();
      if (name.includes("computational")) currentSchool = "computational";
      else if (name.includes("science")) currentSchool = "science";
      else if (name.includes("engineering")) currentSchool = "engineering";
      else currentSchool = "general";
      return;
    }

    if (!currentSchool) return;

    const parts = line.split(" ");
    const firstWord = parts[0];
    const secondWord = parts.length > 1 ? parts[1] : "";

    const isCode =
      firstWord === firstWord.toUpperCase() && !isNaN(parseInt(secondWord));

    if (isCode) {
      const code = `${firstWord} ${secondWord}`;
      if (parts.length > 2) {
        courses.push({
          code,
          name: parts.slice(2).join(" ").trim(),
          school: currentSchool,
        });
      } else {
        pendingCode = code;
      }
    } else if (pendingCode) {
      courses.push({ code: pendingCode, name: line, school: currentSchool });
      pendingCode = null;
    }
  });

  return courses;
}

const catalogCourses = loadDynamicCatalog();

/* ═══════════════════════════════════════════════════════
   2.  Text helpers  (normalisation & fuzzy similarity)
   ═══════════════════════════════════════════════════════ */
function normalizeText(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordOverlapScore(title, candidate) {
  const t = normalizeText(title);
  const c = normalizeText(candidate);
  const tWords = t.split(" ").filter((w) => w.length > 2);
  const cWords = c.split(" ").filter((w) => w.length > 2);
  if (tWords.length === 0 || cWords.length === 0) return 0;

  let matches = 0;
  const used = new Set();

  for (const w of tWords) {
    for (let i = 0; i < cWords.length; i++) {
      if (used.has(i)) continue;
      const cw = cWords[i];
      if (
        w === cw ||
        (w.length > 4 && cw.includes(w)) ||
        (cw.length > 4 && w.includes(cw))
      ) {
        matches++;
        used.add(i);
        break;
      }
    }
  }

  const union = new Set([...tWords, ...cWords]);
  return union.size === 0 ? 0 : matches / union.size;
}

function findBestCatalogMatch(title, courses) {
  let best = null;
  let bestScore = 0;
  const threshold = 0.35;

  for (const course of courses) {
    const score = wordOverlapScore(title, course.name);
    if (score > bestScore) {
      bestScore = score;
      best = course;
    }
  }
  return best && bestScore >= threshold
    ? { course: best, score: bestScore }
    : null;
}

function detectCategory(title, detection) {
  const lower = title.toLowerCase().trim();
  if (lower === "interviews")
    return { category: "interviews", categoryLabel: "Interviews" };
  if (lower.includes("public lectures"))
    return { category: "public-lectures", categoryLabel: "Public Lectures" };
  if (lower.includes("once upon an undergrad"))
    return { category: "special", categoryLabel: "Once Upon an Undergrad" };
  if (lower.includes("physics club"))
    return { category: "club", categoryLabel: "Physics Club" };
  return { category: "course", categoryLabel: "Course" };
}

function inferSchoolFromTitle(title) {
  const t = normalizeText(title);
  const keywords = {
    science: [
      "physics",
      "quantum",
      "relativity",
      "cosmology",
      "thermodynamics",
      "electromagnetism",
      "mechanics",
      "calculus",
      "algebra",
      "differential",
      "mathematical",
      "chemistry",
      "biochemistry",
      "biology",
      "optics",
      "wave",
      "statistical",
      "vector",
      "geometry",
      "electrodynamics",
      "astronomy",
      "particle",
      "nuclear",
    ],
    engineering: [
      "signal",
      "digital",
      "computer",
      "network",
      "robotics",
      "vision",
      "communications",
      "information",
      "control",
      "wireless",
      "rf",
      "mixed",
      "ic",
      "circuit",
      "architecture",
      "aerodynamics",
      "programming",
      "database",
      "data structure",
      "vlsi",
      "embedded",
      "antenna",
      "propulsion",
    ],
    computational: [
      "artificial intelligence",
      "computational",
      "machine learning",
      "deep learning",
      "neural",
      "natural language",
      "reinforcement",
      "object oriented",
      "algorithm",
      "intelligence",
    ],
  };

  const scores = { science: 0, engineering: 0, computational: 0 };
  for (const [school, words] of Object.entries(keywords)) {
    for (const w of words) if (t.includes(w)) scores[school] += 1;
  }

  // Contextual boosts
  if (t.includes("electrodynamics")) scores.science += 2;
  if (t.includes("special theory")) scores.science += 2;
  if (t.includes("vector calculus")) scores.science += 1.5;

  const max = Math.max(...Object.values(scores));
  if (max === 0) return null;
  return Object.entries(scores).find(([, s]) => s === max)[0];
}

/* ═══════════════════════════════════════════════════════
   3.  Robust metadata extraction
   ═══════════════════════════════════════════════════════ */
function extractMetadataAndClean(rawTitle) {
  let title = rawTitle;

  const metadata = {
    semester: null,
    year: null,
    isIncomplete: false,
    extractedInstructor: null,
  };

  // Legacy typo: double-l → Roman II
  title = title.split("ll").join("II");

  // ── CFP Summer School  (extract as Summer semester, clean carefully) ──
  const cfpRegex = /CFP\s+Summer\s+School\s*[-–—]?\s*/i;
  if (cfpRegex.test(title)) {
    metadata.semester = "Summer";
    title = title.replace(cfpRegex, "").trim();
  }

  // ── Semester + Year via regex (handles punctuation & ordering variations) ──
  const termPatterns = [
    { regex: /\b(Spring|Fall|Summer)[\s,]+(\d{4})\b/i, term: 1, year: 2 },
    { regex: /\b(\d{4})[\s,]+(Spring|Fall|Summer)\b/i, term: 2, year: 1 },
    { regex: /\((Spring|Fall|Summer)[\s,]+(\d{4})\)/i, term: 1, year: 2 },
  ];

  for (const p of termPatterns) {
    const m = title.match(p.regex);
    if (m) {
      metadata.semester =
        m[p.term].charAt(0).toUpperCase() + m[p.term].slice(1).toLowerCase();
      metadata.year = parseInt(m[p.year]);
      title = title.replace(m[0], "").trim();
      break;
    }
  }

  // Stand-alone year fallback
  if (!metadata.year) {
    const ym = title.match(/\b(20\d{2})\b/);
    if (ym) {
      metadata.year = parseInt(ym[1]);
      title = title.replace(ym[0], "").trim();
    }
  }

  // ── Incomplete flag ──
  if (/incomplete/i.test(title)) {
    metadata.isIncomplete = true;
    title = title
      .replace(/\(incomplete\)/gi, "")
      .replace(/incomplete/gi, "")
      .trim();
  }

  // ── Instructor (broad prefix support) ──
  const instructorPatterns = [
    /[-–—]\s*(Dr\.?\s+[^-–—()]+)/i,
    /[-–—]\s*(Prof\.?\s+[^-–—()]+)/i,
    /[-–—]\s*(Eng\.?\s+[^-–—()]+)/i,
    /[-–—]\s*(Mr\.?\s+[^-–—()]+)/i,
    /[-–—]\s*(Ms\.?\s+[^-–—()]+)/i,
    /[-–—]\s*(Mrs\.?\s+[^-–—()]+)/i,
    /\bby\s+(Dr\.?\s+[^-–—()]+)/i,
  ];

  for (const pattern of instructorPatterns) {
    const m = title.match(pattern);
    if (m) {
      metadata.extractedInstructor = m[1].trim().replace(/[.,;]$/, "");
      title = title.replace(m[0], "").trim();
      break;
    }
  }

  // ── Clean-up ──
  title = title
    .replace(/\(\s*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
  title = title.replace(/^[-–—]+|[-–—]+$/g, "").trim();

  // ── Expand truncated catalog names ──
  const titleParts = title
    .split(/[-–—]/)
    .map((p) => p.trim())
    .filter(Boolean);
  let courseSegment = titleParts[0] || title;

  if (courseSegment.length > 3) {
    const segLower = courseSegment.toLowerCase();
    for (const c of catalogCourses) {
      const catLower = c.name.toLowerCase();
      if (catLower.startsWith(segLower) || segLower.startsWith(catLower)) {
        courseSegment = c.name;
        break;
      }
    }
  }

  titleParts[0] = courseSegment;
  const cleanedTitle = titleParts.join(" - ").replace(/\s+/g, " ").trim();

  return { cleanedTitle, metadata };
}

/* ═══════════════════════════════════════════════════════
   4.  Multi-strategy detection with fallbacks
   ═══════════════════════════════════════════════════════ */
function detectEnhanced(cleanedTitle, metadata) {
  const isValid = (d) => d && d.confidence && d.confidence !== "none";

  // Strategy 1: direct detection
  let d = detectFromTitle(cleanedTitle);
  if (isValid(d)) return d;

  // Strategy 2: strip "Introduction to" prefix
  const noIntro = cleanedTitle.replace(/^introduction\s+to\s+/i, "").trim();
  if (noIntro.length > 3 && noIntro !== cleanedTitle) {
    d = detectFromTitle(noIntro);
    if (isValid(d))
      return { ...d, confidence: d.confidence === "high" ? "high" : "medium" };
  }

  // Strategy 3: strip trailing Roman numerals (I, II, III, IV, V…)
  const noRoman = cleanedTitle.replace(/\s+[IVX]+$/i, "").trim();
  if (noRoman.length > 3 && noRoman !== cleanedTitle) {
    d = detectFromTitle(noRoman);
    if (isValid(d)) return { ...d, confidence: "medium" };
  }

  // Strategy 4: remove parenthetical qualifiers
  const noParens = cleanedTitle.replace(/\s*\([^)]*\)/g, "").trim();
  if (noParens.length > 3 && noParens !== cleanedTitle) {
    d = detectFromTitle(noParens);
    if (isValid(d)) return { ...d, confidence: "medium" };
  }

  // Strategy 5: fuzzy match against the local catalog
  const catalogHit = findBestCatalogMatch(cleanedTitle, catalogCourses);
  if (catalogHit) {
    return {
      confidence: catalogHit.score > 0.7 ? "medium" : "low",
      schoolId: catalogHit.course.school,
      code: catalogHit.course.code,
      name: catalogHit.course.name,
      instructor: metadata.extractedInstructor,
    };
  }

  // Strategy 6: keyword-based school inference (last resort)
  const inferredSchool = inferSchoolFromTitle(cleanedTitle);
  if (inferredSchool) {
    return {
      confidence: "low",
      schoolId: inferredSchool,
      code: null,
      name: cleanedTitle,
      instructor: metadata.extractedInstructor,
    };
  }

  return { confidence: "none" };
}

/* ═══════════════════════════════════════════════════════
   5.  YouTube API helpers  (unchanged)
   ═══════════════════════════════════════════════════════ */
async function fetchAll(url) {
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

async function fetchAllPlaylists() {
  let playlists = [];
  let pageToken = "";
  do {
    const paginationParam = pageToken ? `&pageToken=${pageToken}` : "";
    const url = `https://www.googleapis.com/youtube/v3/playlists?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,contentDetails&maxResults=50${paginationParam}`;

    const data = await fetchAll(url);
    playlists = playlists.concat(data.items ?? []);
    pageToken = data.nextPageToken ?? "";

    if (pageToken) await new Promise((r) => setTimeout(r, 200));
  } while (pageToken);
  return playlists;
}

/* ═══════════════════════════════════════════════════════
   6.  Main
   ═══════════════════════════════════════════════════════ */
async function main() {
  console.log("🔍 ZC OCW Course Profiler (Smart Dynamic Edition)\n");
  console.log(`📡 Channel: ${CHANNEL_ID}`);
  console.log("⏳ Fetching playlists via YouTube API…\n");

  const playlists = await fetchAllPlaylists();
  console.log(`✅ Found ${playlists.length} playlists\n`);

  const results = [];
  const stats = { high: 0, medium: 0, low: 0, none: 0, schools: {} };

  playlists.forEach((pl) => {
    const { snippet, contentDetails, id } = pl;
    const rawTitle = snippet.title;

    const { cleanedTitle, metadata } = extractMetadataAndClean(rawTitle);
    const detection = detectEnhanced(cleanedTitle, metadata);
    const { category, categoryLabel } = detectCategory(rawTitle, detection);

    if (detection.confidence === "high") stats.high++;
    else if (detection.confidence === "medium") stats.medium++;
    else if (detection.confidence === "low") stats.low++;
    else stats.none++;

    if (detection.schoolId && detection.schoolId !== "general") {
      stats.schools[detection.schoolId] =
        (stats.schools[detection.schoolId] ?? 0) + 1;
    }

    results.push({
      playlistId: id,
      title: rawTitle,
      cleanedTitle: cleanedTitle !== rawTitle ? cleanedTitle : undefined,
      lectureCount: contentDetails.itemCount,
      metadata,
      category,
      categoryLabel,
      detection,
      suggested: {
        schoolId: detection.schoolId ?? null,
        courseCode: detection.code ?? null,
        courseName: detection.name ?? null,
        instructor: detection.instructor ?? metadata.extractedInstructor,
        semester: metadata.semester,
        year: metadata.year,
        category,
        isIncomplete: metadata.isIncomplete,
      },
    });
  });

  results.sort((a, b) => {
    const confA = a.detection?.confidence ?? "none";
    const confB = b.detection?.confidence ?? "none";
    if (confA !== confB) {
      const confVal = { high: 4, medium: 3, low: 2, none: 1 };
      return confVal[confB] - confVal[confA];
    }
    return a.title.localeCompare(b.title);
  });

  // ── Push to Cloudflare D1 ──────────────────────────────────────────────────
  if (env.VITE_WORKER_URL && env.VITE_ADMIN_PASSWORD) {
    try {
      const res = await fetch(`${env.VITE_WORKER_URL}/api/profiles`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.VITE_ADMIN_PASSWORD}`,
        },
        body: JSON.stringify(results),
      });
      if (res.ok) {
        console.log("☁️  Profiles synced to Cloudflare D1");
      } else {
        console.warn("⚠️  Failed to sync profiles to D1:", res.status);
      }
    } catch (e) {
      console.warn("⚠️  D1 sync error:", e.message);
    }
  }

  console.log(
    "┌──────────────────────────────────┬──────────┬──────────────────────┬────────┬─────────────┐",
  );
  console.log(
    "│ YouTube Title                    │ Code     │ Instructor           │ Conf   │ Semester    │",
  );
  console.log(
    "├──────────────────────────────────┼──────────┼──────────────────────┼────────┼─────────────┤",
  );

  results.forEach((r) => {
    const title = r.title.slice(0, 32).padEnd(32);
    const code = (r.detection?.code ?? "—").padEnd(8);
    const inst = (r.suggested?.instructor ?? "—").slice(0, 20).padEnd(20);
    const conf = (r.detection?.confidence ?? "none").padEnd(6);
    const sem = (
      r.metadata?.semester
        ? `${r.metadata.semester} ${r.metadata.year ?? ""}`.trim()
        : "—"
    ).padEnd(11);
    console.log(`│ ${title} │ ${code} │ ${inst} │ ${conf} │ ${sem} │`);
  });

  console.log(
    "└──────────────────────────────────┴──────────┴──────────────────────┴────────┴─────────────┘",
  );

  const detectedCount = stats.high + stats.medium + stats.low;
  console.log("\n📊 Summary:");
  console.log(
    `   Detected:   ${detectedCount} / ${playlists.length} playlists (${Math.round((detectedCount / playlists.length) * 100)}%)`,
  );
  console.log(`   Undetected: ${stats.none}`);
  console.log(`   High:       ${stats.high}`);
  console.log(`   Medium:     ${stats.medium}`);
  console.log(`   Low:        ${stats.low}`);

  const activeSchools = {};
  Object.keys(stats.schools).forEach((key) => {
    if (stats.schools[key] > 0) activeSchools[key] = stats.schools[key];
  });
  console.log(`   By school:  ${JSON.stringify(activeSchools)}`);

  const outputPath = path.join(__dirname, "../src/data/auto-profiles.json");
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), stats, results },
      null,
      2,
    ),
  );
  console.log(`\n💾 Full results saved to: src/data/auto-profiles.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
