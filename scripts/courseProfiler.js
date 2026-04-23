#!/usr/bin/env node
/**
 * scripts/courseProfiler.js
 *
 * Auto-profiles your YouTube channel playlists against the shared ZC course catalog.
 * Outputs: scripts/course-profile-output.json
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ── 🧠 Import Shared Frontend Logic ──
// We are importing the exact same detection engine the React app uses.
// No more catalog.txt needed!
import { detectFromTitle } from "../src/data/coursesCatalog.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Load .env manually ──
function loadEnv() {
  const envPath = path.join(__dirname, "../.env");
  if (!fs.existsSync(envPath)) {
    console.error("❌ .env not found");
    process.exit(1);
  }
  const vars = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key && !key.startsWith("#"))
      vars[key.trim()] = rest
        .join("=")
        .trim()
        .replace(/^["']|["']$/g, "");
  }
  return vars;
}

const env = loadEnv();
const API_KEY = env.VITE_YOUTUBE_API_KEY;
const CHANNEL_ID = env.VITE_YOUTUBE_CHANNEL_ID;

if (!API_KEY || !CHANNEL_ID) {
  console.error(
    "❌ Missing VITE_YOUTUBE_API_KEY or VITE_YOUTUBE_CHANNEL_ID in .env",
  );
  process.exit(1);
}

// ── YouTube API Fetching ──
async function fetchAll(url) {
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(`YouTube API: ${data.error.message}`);
  return data;
}

async function fetchAllPlaylists() {
  let playlists = [],
    pageToken = "";
  do {
    const paginationParam = pageToken ? `&pageToken=${pageToken}` : "";
    const url = `https://www.googleapis.com/youtube/v3/playlists?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,contentDetails&maxResults=50${paginationParam}`;

    const data = await fetchAll(url);
    playlists = playlists.concat(data.items ?? []);
    pageToken = data.nextPageToken ?? "";

    // Slight delay to respect YouTube API rate limits
    if (pageToken) await new Promise((r) => setTimeout(r, 200));
  } while (pageToken);
  return playlists;
}

// ── Main Execution ──
async function main() {
  console.log("🔍 ZC OCW Course Profiler (API & Shared Logic Edition)\n");
  console.log(`📡 Channel: ${CHANNEL_ID}`);
  console.log("⏳ Fetching playlists via YouTube API…\n");

  const playlists = await fetchAllPlaylists();
  console.log(`✅ Found ${playlists.length} playlists\n`);

  const results = [];
  const stats = { high: 0, medium: 0, low: 0, none: 0, schools: {} };

  for (const pl of playlists) {
    const { snippet, contentDetails, id } = pl;

    // Call the exact same function the React UI uses!
    const detection = detectFromTitle(snippet.title) || { confidence: "none" };

    // Track statistics
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
      title: snippet.title,
      lectureCount: contentDetails.itemCount,
      detection,
      suggested: {
        schoolId: detection.schoolId ?? null,
        courseCode: detection.code ?? null,
        courseName: detection.name ?? null,
        instructor: detection.instructor ?? null,
      },
    });
  }

  // Sort by confidence so the best matches are at the top
  results.sort((a, b) => {
    const confA = a.detection?.confidence ?? "none";
    const confB = b.detection?.confidence ?? "none";
    if (confA !== confB) {
      const confVal = { high: 4, medium: 3, low: 2, none: 1 };
      return confVal[confB] - confVal[confA];
    }
    return a.title.localeCompare(b.title);
  });

  // ── Print table ──
  console.log(
    "┌──────────────────────────────────┬──────────┬──────────────────────┬────────┐",
  );
  console.log(
    "│ YouTube Title                    │ Code     │ Instructor           │ Conf   │",
  );
  console.log(
    "├──────────────────────────────────┼──────────┼──────────────────────┼────────┤",
  );
  for (const r of results) {
    const title = r.title.slice(0, 32).padEnd(32);
    const code = (r.detection?.code ?? "—").padEnd(8);
    const inst = (r.detection?.instructor ?? "—").slice(0, 20).padEnd(20);
    const conf = (r.detection?.confidence ?? "none").padEnd(6);
    console.log(`│ ${title} │ ${code} │ ${inst} │ ${conf} │`);
  }
  console.log(
    "└──────────────────────────────────┴──────────┴──────────────────────┴────────┘",
  );

  const detectedCount = stats.high + stats.medium + stats.low;
  console.log("\n📊 Summary:");
  console.log(
    `   Detected:   ${detectedCount} / ${playlists.length} playlists (${Math.round((detectedCount / playlists.length) * 100)}%)`,
  );
  console.log(`   Undetected: ${stats.none}`);

  const activeSchools = Object.fromEntries(
    Object.entries(stats.schools).filter(([_, v]) => v > 0),
  );
  console.log(`   By school:  ${JSON.stringify(activeSchools)}`);

  // ── Output JSON ──
  const outputPath = path.join(__dirname, "../src/data/auto-profiles.json");
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), stats, results },
      null,
      2,
    ),
  );
  console.log(`\n💾 Full results saved to: scripts/course-profile-output.json`);
  console.log(`🗑️  You can now safely delete scripts/catalog.txt!`);
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
