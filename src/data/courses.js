/**
 * src/data/courses.js
 *
 * Static metadata that enriches YouTube playlists.
 * Map your YouTube playlist IDs to department, level, and extra info here.
 *
 * HOW TO USE:
 *   1. Go to your YouTube channel → Playlists
 *   2. Open a playlist → copy the ID from the URL (?list=XXXXXXX)
 *   3. Add an entry below with that playlistId
 */

export const DEPARTMENTS = [
  { slug: 'nanotechnology',    label: 'Nanotechnology',          color: 'bg-blue-100 text-blue-800'   },
  { slug: 'physics',           label: 'Physics',                 color: 'bg-purple-100 text-purple-800'},
  { slug: 'chemistry',         label: 'Chemistry',               color: 'bg-green-100 text-green-800' },
  { slug: 'biology',           label: 'Biology',                 color: 'bg-emerald-100 text-emerald-800'},
  { slug: 'engineering',       label: 'Engineering',             color: 'bg-orange-100 text-orange-800'},
  { slug: 'cs',                label: 'Computer Science',        color: 'bg-rose-100 text-rose-800'   },
  { slug: 'mathematics',       label: 'Mathematics',             color: 'bg-yellow-100 text-yellow-800'},
  { slug: 'humanities',        label: 'Humanities',              color: 'bg-indigo-100 text-indigo-800'},
]

export const LEVELS = ['Undergraduate', 'Graduate', 'All levels']

/**
 * Manually enrich playlist metadata.
 * Any playlist NOT listed here will still appear — just without the extra fields.
 */
export const COURSE_META = {
  // Example — replace with your real playlist IDs:
  // 'PLxxxxxxxxxxxxxxxx': {
  //   department: 'nanotechnology',
  //   level: 'Undergraduate',
  //   instructor: 'Prof. Ahmed Hassan',
  //   semester: 'Fall 2023',
  //   materials: [
  //     { label: 'Syllabus', url: 'https://...' },
  //     { label: 'Lecture Notes', url: 'https://...' },
  //   ],
  // },
}

/** Merge YouTube playlist item with static meta */
export function enrichCourse(ytPlaylist) {
  const meta = COURSE_META[ytPlaylist.id] || {}
  return { ...ytPlaylist, meta }
}

/** Find department config by slug */
export function getDepartment(slug) {
  return DEPARTMENTS.find(d => d.slug === slug)
}
