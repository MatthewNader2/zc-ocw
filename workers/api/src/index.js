/**
 * ZC OCW — Cloudflare Worker API
 *
 * Routes:
 * GET    /api/overrides              → all course overrides
 * GET    /api/overrides/:id          → one course override
 * PUT    /api/overrides/:id          → upsert course override  [admin]
 * GET    /api/materials/:playlistId  → materials for a course
 * POST   /api/materials/:playlistId  → add material            [admin]
 * DELETE /api/materials/:id          → delete material         [admin]
 * GET    /api/books/:playlistId      → books for a course
 * POST   /api/books/:playlistId      → add book                [admin]
 * DELETE /api/books/:id             → delete book             [admin]
 * POST   /api/upload/:playlistId    → upload file to R2       [admin]
 * GET    /api/youtube/playlists     → fetch YouTube playlists (proxy)
 * GET    /api/youtube/channels      → fetch YouTube channel details (proxy)
 *
 * Authentication:
 * Admin routes require header: Authorization: Bearer YOUR_ADMIN_PASSWORD
 */

// ── CORS headers — allow your frontend to call this API ────────────────────
function corsHeaders(env, req) {
	const origin = req.headers.get('Origin') || '';
	const allowed = [
		env.ALLOWED_ORIGIN, // localhost:3000 in dev
		'https://zc-ocw.vercel.app', // your Vercel URL
		'https://ocw.zewailcity.edu.eg', // your custom domain
	].filter(Boolean);

	const allowedOrigin = allowed.find((a) => origin.startsWith(a)) || allowed[0];

	return {
		'Access-Control-Allow-Origin': allowedOrigin,
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		'Access-Control-Max-Age': '86400',
	};
}

// ── Response helpers ────────────────────────────────────────────────────────
function json(data, status = 200, cors = {}) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json', ...cors },
	});
}

function err(message, status = 400, cors = {}) {
	return json({ error: message }, status, cors);
}

// ── Auth check ──────────────────────────────────────────────────────────────
function isAdmin(req, env) {
	const header = req.headers.get('Authorization') || '';
	const token = header.replace('Bearer ', '').trim();
	return token === env.ADMIN_PASSWORD;
}

// ── Main router ─────────────────────────────────────────────────────────────
export default {
	async fetch(req, env) {
		const cors = corsHeaders(env, req);

		// Handle CORS preflight — browser sends this before the real request
		if (req.method === 'OPTIONS') {
			return new Response(null, { status: 204, headers: cors });
		}

		const url = new URL(req.url);

		// Generic YouTube Proxy Handler
		if (url.pathname.startsWith('/api/youtube/')) {
			const endpoint = url.pathname.replace('/api/youtube/', '');
			const params = new URLSearchParams(url.search);
			params.set('key', env.YOUTUBE_API_KEY);

			// Dynamic Part handling based on endpoint
			if (!params.has('part')) {
				if (endpoint === 'playlists' || endpoint === 'playlistItems') {
					params.set('part', 'snippet,contentDetails');
				} else if (endpoint === 'channels') {
					params.set('part', 'snippet,statistics,brandingSettings');
				} else if (endpoint === 'videos') {
					params.set('part', 'snippet,contentDetails,statistics');
				} else {
					params.set('part', 'snippet');
				}
			}

			const targetUrl = `https://www.googleapis.com/youtube/v3/${endpoint}?${params.toString()}`;

			try {
				const response = await fetch(targetUrl);
				const data = await response.json();
				return json(data, response.status, cors);
			} catch (e) {
				return err('YouTube Proxy Error', 500, cors);
			}
		}

		// Handle YouTube Proxy Routes BEFORE splitting segments
		if (url.pathname === '/api/youtube/playlists' && req.method === 'GET') {
			const channelId = url.searchParams.get('channelId');
			if (!channelId) return err('Missing channelId', 400, cors);

			const ytUrl = `https://www.googleapis.com/youtube/v3/playlists?channelId=${channelId}&part=snippet,contentDetails&maxResults=20&key=${env.YOUTUBE_API_KEY}`;

			try {
				const response = await fetch(ytUrl);
				const data = await response.json();
				if (!response.ok) return err(data.error?.message || 'YouTube API Error', response.status, cors);
				return json(data, 200, cors);
			} catch (e) {
				return err('Failed to fetch from YouTube', 500, cors);
			}
		}

		if (url.pathname === '/api/youtube/channels' && req.method === 'GET') {
			const id = url.searchParams.get('id');
			if (!id) return err('Missing id', 400, cors);

			const ytUrl = `https://www.googleapis.com/youtube/v3/channels?id=${id}&part=snippet,statistics,brandingSettings&key=${env.YOUTUBE_API_KEY}`;

			try {
				const response = await fetch(ytUrl);
				const data = await response.json();
				if (!response.ok) return err(data.error?.message || 'YouTube API Error', response.status, cors);
				return json(data, 200, cors);
			} catch (e) {
				return err('Failed to fetch from YouTube', 500, cors);
			}
		}

		// Standard resource routing
		const segments = url.pathname.replace('/api/', '').split('/');
		const [resource, id] = segments;

		try {
			// ── GET /api/overrides ─────────────────────────────────────────────
			if (resource === 'overrides' && !id && req.method === 'GET') {
				const { results } = await env.DB.prepare('SELECT * FROM course_overrides ORDER BY playlist_id').all();
				return json(results, 200, cors);
			}

			// ── GET /api/overrides/:playlistId ─────────────────────────────────
			if (resource === 'overrides' && id && req.method === 'GET') {
				const row = await env.DB.prepare('SELECT * FROM course_overrides WHERE playlist_id = ?').bind(id).first();
				if (!row) return json({}, 200, cors);
				return json({ ...row, tags: JSON.parse(row.tags || '[]') }, 200, cors);
			}

			// ── PUT /api/overrides/:playlistId ─────────────────────────────────
			if (resource === 'overrides' && id && req.method === 'PUT') {
				if (!isAdmin(req, env)) return err('Unauthorized', 401, cors);
				const body = await req.json();
				await env.DB.prepare(
					`
          INSERT INTO course_overrides
            (playlist_id, school_id, program_id, course_code, instructor,
             semester, level, description, tags, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          ON CONFLICT(playlist_id) DO UPDATE SET
            school_id   = excluded.school_id,
            program_id  = excluded.program_id,
            course_code = excluded.course_code,
            instructor  = excluded.instructor,
            semester    = excluded.semester,
            level       = excluded.level,
            description = excluded.description,
            tags        = excluded.tags,
            updated_at  = excluded.updated_at
        `,
				)
					.bind(
						id,
						body.schoolId || null,
						body.programId || null,
						body.courseCode || null,
						body.instructor || null,
						body.semester || null,
						body.level || null,
						body.description || null,
						JSON.stringify(Array.isArray(body.tags) ? body.tags : []),
					)
					.run();
				return json({ ok: true }, 200, cors);
			}

			// ── GET /api/materials/:playlistId ─────────────────────────────────
			if (resource === 'materials' && id && req.method === 'GET') {
				const { results } = await env.DB.prepare('SELECT * FROM materials WHERE playlist_id = ? ORDER BY added_at').bind(id).all();

				// For R2-stored files, generate a presigned URL
				const enriched = await Promise.all(
					results.map(async (row) => {
						if (row.file_key && !row.url) {
							// Public R2 URL (if bucket is public) or signed URL
							row.url = `https://pub-${env.R2_PUBLIC_ID}.r2.dev/${row.file_key}`;
						}
						return row;
					}),
				);
				return json(enriched, 200, cors);
			}

			// ── POST /api/materials/:playlistId ────────────────────────────────
			if (resource === 'materials' && id && req.method === 'POST') {
				if (!isAdmin(req, env)) return err('Unauthorized', 401, cors);
				const body = await req.json();
				const newId = crypto.randomUUID();
				await env.DB.prepare(
					`
          INSERT INTO materials (id, playlist_id, type, label, url, file_key, file_size, mime_type)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
				)
					.bind(
						newId,
						id,
						body.type || 'other',
						body.label || '',
						body.url || null,
						body.fileKey || null,
						body.fileSize || null,
						body.mimeType || null,
					)
					.run();
				return json({ id: newId }, 201, cors);
			}

			// ── DELETE /api/materials/:id ──────────────────────────────────────
			if (resource === 'materials' && id && req.method === 'DELETE') {
				if (!isAdmin(req, env)) return err('Unauthorized', 401, cors);
				// If file was in R2, delete it too
				const row = await env.DB.prepare('SELECT file_key FROM materials WHERE id = ?').bind(id).first();
				if (row?.file_key) {
					await env.STORAGE.delete(row.file_key);
				}
				await env.DB.prepare('DELETE FROM materials WHERE id = ?').bind(id).run();
				return json({ ok: true }, 200, cors);
			}

			// ── POST /api/upload/:playlistId ───────────────────────────────────
			if (resource === 'upload' && id && req.method === 'POST') {
				if (!isAdmin(req, env)) return err('Unauthorized', 401, cors);

				const contentType = req.headers.get('Content-Type') || '';
				if (!contentType.includes('multipart/form-data')) {
					return err('Expected multipart/form-data', 400, cors);
				}

				const formData = await req.formData();
				const file = formData.get('file');
				const label = formData.get('label') || file.name;
				const type = formData.get('type') || 'other';

				if (!file) return err('No file in request', 400, cors);

				const ext = file.name.split('.').pop();
				const fileKey = `${id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

				// Upload to R2
				await env.STORAGE.put(fileKey, file.stream(), {
					httpMetadata: { contentType: file.type },
				});

				// Save metadata to D1
				const newId = crypto.randomUUID();
				await env.DB.prepare(
					`
          INSERT INTO materials (id, playlist_id, type, label, file_key, file_size, mime_type)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
				)
					.bind(newId, id, type, label, fileKey, file.size, file.type)
					.run();

				return json({ id: newId, fileKey, size: file.size }, 201, cors);
			}

			// ── GET /api/books/:playlistId ─────────────────────────────────────
			if (resource === 'books' && id && req.method === 'GET') {
				const { results } = await env.DB.prepare('SELECT * FROM books WHERE playlist_id = ? ORDER BY added_at').bind(id).all();
				return json(results, 200, cors);
			}

			// ── POST /api/books/:playlistId ────────────────────────────────────
			if (resource === 'books' && id && req.method === 'POST') {
				if (!isAdmin(req, env)) return err('Unauthorized', 401, cors);
				const body = await req.json();
				const newId = crypto.randomUUID();
				await env.DB.prepare(
					`
          INSERT INTO books (id, playlist_id, title, author, edition, isbn, url)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
				)
					.bind(newId, id, body.title || '', body.author || null, body.edition || null, body.isbn || null, body.url || null)
					.run();
				return json({ id: newId }, 201, cors);
			}

			// ── DELETE /api/books/:id ──────────────────────────────────────────
			if (resource === 'books' && id && req.method === 'DELETE') {
				if (!isAdmin(req, env)) return err('Unauthorized', 401, cors);
				await env.DB.prepare('DELETE FROM books WHERE id = ?').bind(id).run();
				return json({ ok: true }, 200, cors);
			}

			// ── GET /api/profiles ──────────────────────────────────────────────────────
			if (resource === 'profiles' && !id && req.method === 'GET') {
				const { results } = await env.DB.prepare('SELECT * FROM playlist_profiles ORDER BY category, title').all();
				return json(results, 200, cors);
			}

			// ── GET /api/profiles/:playlistId ──────────────────────────────────────────
			if (resource === 'profiles' && id && req.method === 'GET') {
				const row = await env.DB.prepare('SELECT * FROM playlist_profiles WHERE playlist_id = ?').bind(id).first();
				if (!row) return json({}, 200, cors);
				return json(
					{
						...row,
						detection: JSON.parse(row.detection || '{}'),
						suggested: JSON.parse(row.suggested || '{}'),
					},
					200,
					cors,
				);
			}

			// ── PUT /api/profiles ──────────────────────────────────────────────────────
			// Bulk upsert (profiler script uses this)
			if (resource === 'profiles' && !id && req.method === 'PUT') {
				if (!isAdmin(req, env)) return err('Unauthorized', 401, cors);
				const body = await req.json();
				const profiles = Array.isArray(body) ? body : [body];

				for (const p of profiles) {
					await env.DB.prepare(
						`
      INSERT INTO playlist_profiles
        (playlist_id, title, cleaned_title, category, school_id, program_id,
         course_code, course_name, instructor, semester, year, is_incomplete,
         lecture_count, confidence, detection, suggested, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(playlist_id) DO UPDATE SET
        title         = excluded.title,
        cleaned_title = excluded.cleaned_title,
        category      = excluded.category,
        school_id     = excluded.school_id,
        program_id    = excluded.program_id,
        course_code   = excluded.course_code,
        course_name   = excluded.course_name,
        instructor    = excluded.instructor,
        semester      = excluded.semester,
        year          = excluded.year,
        is_incomplete = excluded.is_incomplete,
        lecture_count = excluded.lecture_count,
        confidence    = excluded.confidence,
        detection     = excluded.detection,
        suggested     = excluded.suggested,
        updated_at    = excluded.updated_at
    `,
					)
						.bind(
							p.playlistId,
							p.title || null,
							p.cleanedTitle || null,
							p.category || 'course',
							p.suggested?.schoolId || null,
							p.suggested?.programId || null,
							p.suggested?.courseCode || null,
							p.suggested?.courseName || null,
							p.suggested?.instructor || null,
							p.suggested?.semester || null,
							p.suggested?.year || null,
							p.suggested?.isIncomplete ? 1 : 0,
							p.lectureCount || null,
							p.detection?.confidence || null,
							JSON.stringify(p.detection || {}),
							JSON.stringify(p.suggested || {}),
						)
						.run();
				}
				return json({ ok: true, count: profiles.length }, 200, cors);
			}

			// ── PUT /api/profiles/:playlistId ──────────────────────────────────────────
			if (resource === 'profiles' && id && req.method === 'PUT') {
				if (!isAdmin(req, env)) return err('Unauthorized', 401, cors);
				const body = await req.json();
				await env.DB.prepare(
					`
    INSERT INTO playlist_profiles
      (playlist_id, category, school_id, program_id, course_code, course_name,
       instructor, semester, year, is_incomplete, lecture_count, confidence,
       detection, suggested, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(playlist_id) DO UPDATE SET
      category      = excluded.category,
      school_id     = excluded.school_id,
      program_id    = excluded.program_id,
      course_code   = excluded.course_code,
      course_name   = excluded.course_name,
      instructor    = excluded.instructor,
      semester      = excluded.semester,
      year          = excluded.year,
      is_incomplete = excluded.is_incomplete,
      lecture_count = excluded.lecture_count,
      confidence    = excluded.confidence,
      detection     = excluded.detection,
      suggested     = excluded.suggested,
      updated_at    = excluded.updated_at
  `,
				)
					.bind(
						id,
						body.category || 'course',
						body.schoolId || null,
						body.programId || null,
						body.courseCode || null,
						body.courseName || null,
						body.instructor || null,
						body.semester || null,
						body.year || null,
						body.isIncomplete ? 1 : 0,
						body.lectureCount || null,
						body.confidence || null,
						JSON.stringify(body.detection || {}),
						JSON.stringify(body.suggested || {}),
					)
					.run();
				return json({ ok: true }, 200, cors);
			}

			// ── Health check ───────────────────────────────────────────────────
			if (url.pathname === '/api/health') {
				return json({ status: 'ok', timestamp: new Date().toISOString() }, 200, cors);
			}

			return err('Not found', 404, cors);
		} catch (e) {
			console.error('Worker error:', e);
			return err('Internal server error', 500, cors);
		}
	},
};
