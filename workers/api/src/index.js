/**
 * ZC OCW — Cloudflare Worker API
 *
 * Routes:
 * GET    /api/acknowledgments        → acknowledgments page config
 * PUT    /api/acknowledgments        → save acknowledgments config [admin]
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
 * POST   /api/feedback              → submit feedback (public)
 * GET    /api/feedback              → list feedback [admin]
 * GET    /api/feedback/:id          → get feedback by id [admin]
 * GET    /api/profiles              → list playlist profiles
 * GET    /api/profiles/:id          → get profile by playlist_id
 * PUT    /api/profiles              → bulk upsert profiles [admin]
 * PUT    /api/profiles/:id          → upsert single profile [admin]
 * GET    /api/admins/me             → { isAdmin, email } for the caller's Firebase token
 * GET    /api/admins                → list admin emails       [admin]
 * POST   /api/admins                → grant admin by email    [admin]
 * DELETE /api/admins/:email         → revoke admin by email   [admin]
 * GET    /api/health                → health check
 *
 * Authentication:
 * Admin routes require header: Authorization: Bearer <Firebase ID token>
 * The token is verified against Firebase's public keys, then the caller's
 * email is checked against the `admins` D1 table (or FIREBASE_SUPER_ADMIN_EMAIL,
 * which always counts as admin — this is how you bootstrap the very first one).
 */

import { jwtVerify, createRemoteJWKSet } from 'jose';

// Firebase ID tokens are RS256-signed by Google; this is Google's fixed
// public JWKS endpoint for "secure token" (Firebase Auth) — same for every
// Firebase project, cached in-memory by `jose` across requests.
const FIREBASE_JWKS = createRemoteJWKSet(
	new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
);


// ── CORS headers — allow your frontend to call this API ────────────────────
function corsHeaders(env, req) {
	const origin = req.headers.get('Origin') || '';
	const allowed = [
		env.ALLOWED_ORIGIN,
		'https://zc-ocw.vercel.app',
		'https://ocw.zewailcity.edu.eg',
		'http://localhost:3000',
		'http://localhost:5173',
	].filter(Boolean);

	const allowedOrigin = allowed.find((a) => origin && origin.startsWith(a)) || origin || '*';

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

function sanitize(str) {
	if (!str) return '';
	return String(str).replace(/[<>]/g, '').slice(0, 5000);
}

// ── Auth check ──────────────────────────────────────────────────────────────
// Verifies the caller sent a real, valid Firebase ID token (signature +
// expiry + project), then checks that the token's email is allowed to
// administer this site. Returns the verified email on success, or null.
async function verifyAdmin(req, env) {
	const header = req.headers.get('Authorization') || '';
	const token = header.replace('Bearer ', '').trim();
	if (!token) return null;

	let payload;
	try {
		const result = await jwtVerify(token, FIREBASE_JWKS, {
			issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
			audience: env.FIREBASE_PROJECT_ID,
		});
		payload = result.payload;
	} catch {
		return null; // bad signature, expired, wrong project, malformed, etc.
	}

	const email = (payload.email || '').toLowerCase();
	if (!email || !payload.email_verified) return null;

	// Bootstrap path: this email is always admin, even before the admins
	// table has any rows — set once as a Worker secret, see DEPLOYMENT.md.
	if (env.FIREBASE_SUPER_ADMIN_EMAIL && email === env.FIREBASE_SUPER_ADMIN_EMAIL.toLowerCase()) {
		return email;
	}

	const row = await env.DB.prepare('SELECT email FROM admins WHERE email = ?').bind(email).first();
	return row ? email : null;
}

// Convenience boolean wrapper for routes that only need a yes/no.
async function isAdmin(req, env) {
	return (await verifyAdmin(req, env)) !== null;
}

// Verifies caller sent any valid Firebase ID token (user or admin). Returns { uid, email } or null.
async function verifyUser(req, env) {
	const header = req.headers.get('Authorization') || '';
	const token = header.replace('Bearer ', '').trim();
	if (!token) return null;

	try {
		const result = await jwtVerify(token, FIREBASE_JWKS, {
			issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
			audience: env.FIREBASE_PROJECT_ID,
		});
		const payload = result.payload;
		const uid = payload.sub || payload.user_id;
		if (!uid) return null;
		return { uid, email: payload.email || null };
	} catch {
		return null;
	}
}

// In-memory rate limiting map per IP (per worker isolate)
const ipHits = new Map();
function isRateLimited(req, limit = 60, windowMs = 60000) {
	const ip = req.headers.get('CF-Connecting-IP') || req.headers.get('X-Forwarded-For') || 'unknown';
	const now = Date.now();
	const record = ipHits.get(ip) || { count: 0, reset: now + windowMs };
	if (now > record.reset) {
		record.count = 0;
		record.reset = now + windowMs;
	}
	record.count++;
	ipHits.set(ip, record);
	return record.count > limit;
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
				if (!(await isAdmin(req, env))) return err('Unauthorized', 401, cors);
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

			// ── GET /api/acknowledgments ─────────────────────────────────────────
			if (resource === 'acknowledgments' && !id && req.method === 'GET') {
				const row = await env.DB.prepare('SELECT config_json FROM acknowledgments WHERE id = 1').first();
				if (!row) return json(null, 200, cors); // client falls back to its local default
				return json(JSON.parse(row.config_json), 200, cors);
			}

			// ── PUT /api/acknowledgments ──────────────────────────────────────── [admin]
			if (resource === 'acknowledgments' && !id && req.method === 'PUT') {
				if (!(await isAdmin(req, env))) return err('Unauthorized', 401, cors);
				const body = await req.json();
				await env.DB.prepare(
					`
          INSERT INTO acknowledgments (id, config_json, updated_at)
          VALUES (1, ?, datetime('now'))
          ON CONFLICT(id) DO UPDATE SET
            config_json = excluded.config_json,
            updated_at  = excluded.updated_at
        `,
				)
					.bind(JSON.stringify(body))
					.run();
				return json({ ok: true }, 200, cors);
			}

			// ── GET /api/admins/me ──────────────────────────────────────────────
			// Frontend calls this right after Firebase login to decide whether to
			// show the admin UI. Never trust a client-side role check alone —
			// every actual admin write below re-verifies via isAdmin() regardless.
			if (resource === 'admins' && id === 'me' && req.method === 'GET') {
				const email = await verifyAdmin(req, env);
				return json({ isAdmin: !!email, email: email || null }, 200, cors);
			}

			// ── GET /api/admins ──────────────────────────────────────────────── [admin]
			if (resource === 'admins' && !id && req.method === 'GET') {
				if (!(await isAdmin(req, env))) return err('Unauthorized', 401, cors);
				const { results } = await env.DB.prepare('SELECT email, added_by, added_at FROM admins ORDER BY added_at').all();
				return json(results, 200, cors);
			}

			// ── POST /api/admins ─────────────────────────────────────────────── [admin]
			// Body: { email }. Grants admin access to another Firebase account.
			if (resource === 'admins' && !id && req.method === 'POST') {
				const grantedBy = await verifyAdmin(req, env);
				if (!grantedBy) return err('Unauthorized', 401, cors);
				const body = await req.json();
				const email = (body.email || '').trim().toLowerCase();
				if (!email || !email.includes('@')) return err('Valid email required', 400, cors);
				await env.DB.prepare('INSERT OR IGNORE INTO admins (email, added_by) VALUES (?, ?)').bind(email, grantedBy).run();
				return json({ ok: true, email }, 201, cors);
			}

			// ── DELETE /api/admins/:email ────────────────────────────────────── [admin]
			if (resource === 'admins' && id && req.method === 'DELETE') {
				const requester = await verifyAdmin(req, env);
				if (!requester) return err('Unauthorized', 401, cors);
				const targetEmail = decodeURIComponent(id).toLowerCase();
				if (env.FIREBASE_SUPER_ADMIN_EMAIL && targetEmail === env.FIREBASE_SUPER_ADMIN_EMAIL.toLowerCase()) {
					return err('Cannot remove the super admin', 400, cors);
				}
				await env.DB.prepare('DELETE FROM admins WHERE email = ?').bind(targetEmail).run();
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
							// R2_PUBLIC_ID is already the full https://pub-xxxx.r2.dev base URL
						// (see wrangler.jsonc) — do not re-wrap it in https://pub-…/.r2.dev.
						row.url = `${env.R2_PUBLIC_ID}/${row.file_key}`;
						}
						return row;
					}),
				);
				return json(enriched, 200, cors);
			}

			// ── POST /api/materials/:playlistId ────────────────────────────────
			if (resource === 'materials' && id && req.method === 'POST') {
				if (!(await isAdmin(req, env))) return err('Unauthorized', 401, cors);
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
				if (!(await isAdmin(req, env))) return err('Unauthorized', 401, cors);
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
				if (!(await isAdmin(req, env))) return err('Unauthorized', 401, cors);

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

				return json(
					{ id: newId, fileKey, size: file.size, publicUrl: `${env.R2_PUBLIC_ID}/${fileKey}` },
					201,
					cors,
				);
			}

			// ── GET /api/books/:playlistId ─────────────────────────────────────
			if (resource === 'books' && id && req.method === 'GET') {
				const { results } = await env.DB.prepare('SELECT * FROM books WHERE playlist_id = ? ORDER BY added_at').bind(id).all();
				return json(results, 200, cors);
			}

			// ── POST /api/books/:playlistId ────────────────────────────────────
			if (resource === 'books' && id && req.method === 'POST') {
				if (!(await isAdmin(req, env))) return err('Unauthorized', 401, cors);
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
				if (!(await isAdmin(req, env))) return err('Unauthorized', 401, cors);
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
				if (!(await isAdmin(req, env))) return err('Unauthorized', 401, cors);
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
				if (!(await isAdmin(req, env))) return err('Unauthorized', 401, cors);
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

			// ── POST /api/feedback ─────────────────────────────────────────────────────
			if (resource === 'feedback' && req.method === 'POST') {
				const body = await req.json();

				// Validate required fields
				if (!body.name || !body.email || !body.message || !body.type) {
					return err('Name, email, message and type are required', 400, cors);
				}
				if (!['bug', 'contact'].includes(body.type)) {
					return err('Type must be bug or contact', 400, cors);
				}

				const id = crypto.randomUUID();

				// Store in D1 with sanitized inputs
				await env.DB.prepare(
					`
					INSERT INTO feedback (id, type, name, email, category, title, subject, steps, message, browser, department, email_sent)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
				`,
				)
					.bind(
						id,
						body.type,
						sanitize(body.name),
						sanitize(body.email),
						sanitize(body.category) || null,
						sanitize(body.title) || null,
						sanitize(body.subject) || null,
						sanitize(body.steps) || null,
						sanitize(body.message),
						sanitize(body.browser) || null,
						sanitize(body.department) || null,
					)
					.run();

				// Optional: Try Resend if configured — never fail the request if email fails
				if (env.RESEND_API_KEY && env.FEEDBACK_EMAIL) {
					try {
						const email = env.FEEDBACK_EMAIL.trim();
						if (!email.includes('@')) throw new Error('Invalid FEEDBACK_EMAIL format');

						const [localPart, domain] = email.split('@');
						const to = `${localPart}+${body.type}@${domain}`; // e.g., team+bug@domain.com

						const subject =
							body.type === 'bug'
								? `[ZC-OCW-BUG] ${sanitize(body.category) || 'General'}: ${sanitize(body.title) || 'New Report'}`
								: `[ZC-OCW-CONTACT] ${sanitize(body.department) || 'General'}: ${sanitize(body.subject) || 'New Message'}`;

						const emailBody = [
							`Type: ${body.type.toUpperCase()}`,
							`From: ${sanitize(body.name)} <${sanitize(body.email)}>`,
							'',
							sanitize(body.message),
							body.steps ? `\nSteps to reproduce:\n${sanitize(body.steps)}` : '',
							`\nBrowser: ${sanitize(body.browser) || 'N/A'}`,
							`\n---`,
							`Sent from ZC OCW Feedback System`,
						].join('\n');

						const emailRes = await fetch('https://api.resend.com/emails', {
							method: 'POST',
							headers: {
								Authorization: `Bearer ${env.RESEND_API_KEY}`,
								'Content-Type': 'application/json',
							},
							body: JSON.stringify({
								from: `ZC OCW <onboarding@resend.dev>`,
								to: [to],
								subject: subject.slice(0, 998), // Resend limit
								reply_to: sanitize(body.email),
								text: emailBody,
								headers: {
									'X-Feedback-Type': body.type,
									'X-OCW-Source': 'zc-ocw-platform',
								},
							}),
						});

						if (emailRes.ok) {
							await env.DB.prepare('UPDATE feedback SET email_sent = 1 WHERE id = ?').bind(id).run();
							console.log('✅ Email sent via Resend to:', to);
						} else {
							const errorText = await emailRes.text().catch(() => 'unknown');
							console.error('❌ Resend API error:', emailRes.status, errorText);
						}
					} catch (e) {
						console.error('❌ Email send failed:', e.message);
						// D1 already stored it — feedback is never lost
					}
				}

				return json({ ok: true, id }, 201, cors);
			}

			// ── GET /api/feedback ── Admin only: list all feedback ─────────────────────
			if (resource === 'feedback' && !id && req.method === 'GET') {
				if (!(await isAdmin(req, env))) return err('Unauthorized', 401, cors);

				const type = url.searchParams.get('type');
				let sql = 'SELECT * FROM feedback';
				const params = [];

				if (type) {
					sql += ' WHERE type = ?';
					params.push(type);
				}
				sql += ' ORDER BY created_at DESC LIMIT 100';

				const { results } = await env.DB.prepare(sql)
					.bind(...params)
					.all();
				return json(results, 200, cors);
			}

			// ── GET /api/feedback/:id ── Admin only: get single feedback ───────────────
			if (resource === 'feedback' && id && req.method === 'GET') {
				if (!(await isAdmin(req, env))) return err('Unauthorized', 401, cors);

				const row = await env.DB.prepare('SELECT * FROM feedback WHERE id = ?').bind(id).first();
				if (!row) return err('Not found', 404, cors);

				return json(row, 200, cors);
			}

			// ── GET /api/schools-programs ─────────────────────────────────────────
			if (resource === 'schools-programs' && !id && req.method === 'GET') {
				const row = await env.DB.prepare('SELECT config_json FROM schools_programs WHERE id = 1').first();
				if (!row) return json(null, 200, cors);
				return json(JSON.parse(row.config_json), 200, cors);
			}

			// ── PUT /api/schools-programs ───────────────────────────────────────── [admin]
			if (resource === 'schools-programs' && !id && req.method === 'PUT') {
				if (!(await isAdmin(req, env))) return err('Unauthorized', 401, cors);
				const body = await req.json();
				await env.DB.prepare(
					`
					INSERT INTO schools_programs (id, config_json, updated_at)
					VALUES (1, ?, datetime('now'))
					ON CONFLICT(id) DO UPDATE SET
						config_json = excluded.config_json,
						updated_at  = excluded.updated_at
				`,
				)
					.bind(JSON.stringify(body))
					.run();
				return json({ ok: true }, 200, cors);
			}

			// ── GET /api/user-data/:key ─────────────────────────────────────────── [auth user]
			if (resource === 'user-data' && id && req.method === 'GET') {
				const user = await verifyUser(req, env);
				if (!user) return err('Unauthorized', 401, cors);
				const row = await env.DB.prepare('SELECT value_json FROM user_data WHERE uid = ? AND key = ?')
					.bind(user.uid, id)
					.first();
				if (!row) return json(null, 200, cors);
				return json(JSON.parse(row.value_json), 200, cors);
			}

			// ── PUT /api/user-data/:key ─────────────────────────────────────────── [auth user]
			if (resource === 'user-data' && id && req.method === 'PUT') {
				if (isRateLimited(req, 120)) return err('Too many requests', 429, cors);
				const user = await verifyUser(req, env);
				if (!user) return err('Unauthorized', 401, cors);
				const body = await req.json();
				await env.DB.prepare(
					`
					INSERT INTO user_data (uid, key, value_json, updated_at)
					VALUES (?, ?, ?, datetime('now'))
					ON CONFLICT(uid, key) DO UPDATE SET
						value_json = excluded.value_json,
						updated_at = excluded.updated_at
				`,
				)
					.bind(user.uid, id, JSON.stringify(body))
					.run();
				return json({ ok: true }, 200, cors);
			}

			// ── GET /api/pages/:slug ──────────────────────────────────────────────
			if (resource === 'pages' && id && req.method === 'GET') {
				const row = await env.DB.prepare('SELECT content_json FROM page_content WHERE page_slug = ?').bind(id).first();
				if (!row) return json(null, 200, cors);
				return json(JSON.parse(row.content_json), 200, cors);
			}

			// ── PUT /api/pages/:slug ────────────────────────────────────────────── [admin]
			if (resource === 'pages' && id && req.method === 'PUT') {
				if (!(await isAdmin(req, env))) return err('Unauthorized', 401, cors);
				const body = await req.json();
				await env.DB.prepare(
					`
					INSERT INTO page_content (page_slug, content_json, updated_at)
					VALUES (?, ?, datetime('now'))
					ON CONFLICT(page_slug) DO UPDATE SET
						content_json = excluded.content_json,
						updated_at   = excluded.updated_at
				`,
				)
					.bind(id, JSON.stringify(body))
					.run();
				return json({ ok: true }, 200, cors);
			}

			// ── POST /api/stats/ping ───────────────────────────────────────────── [public activity ping]
			if (resource === 'stats' && id === 'ping' && req.method === 'POST') {
				if (isRateLimited(req, 120)) return json({ ok: true }, 200, cors);
				await env.DB.prepare(
					`
					INSERT INTO site_stats (key, value, updated_at)
					VALUES ('page_views', 1, datetime('now'))
					ON CONFLICT(key) DO UPDATE SET
						value = value + 1,
						updated_at = datetime('now')
				`,
				).run();
				return json({ ok: true }, 200, cors);
			}

			// ── GET /api/stats/active ──────────────────────────────────────────── [active session estimation]
			if (resource === 'stats' && id === 'active' && req.method === 'GET') {
				const row = await env.DB.prepare("SELECT value FROM site_stats WHERE key = 'page_views'").first();
				const totalViews = row ? row.value : 0;
				// Synthetic active estimate based on total activity (or fallback baseline)
				const activeCount = Math.max(1, Math.min(42, Math.floor(totalViews / 50) + 3));
				return json({ activeLearners: activeCount, totalViews }, 200, cors);
			}

			// ── GET /api/sky ────────────────────────────────────────────────────── [astronomyapi.com real-time ephemeris]
			if (url.pathname === '/api/sky' && req.method === 'GET') {
				if (env.ASTRONOMY_API_APP_ID && env.ASTRONOMY_API_APP_SECRET) {
					try {
						const auth = btoa(`${env.ASTRONOMY_API_APP_ID}:${env.ASTRONOMY_API_APP_SECRET}`);
						const now = new Date();
						const dateStr = now.toISOString().split('T')[0];
						const timeStr = now.toTimeString().split(' ')[0];
						const astroUrl = `https://api.astronomyapi.com/api/v2/bodies/positions?latitude=30.03&longitude=30.95&elevation=50&from_date=${dateStr}&to_date=${dateStr}&time=${timeStr}`;
						const res = await fetch(astroUrl, {
							headers: { Authorization: `Basic ${auth}` },
						});
						if (res.ok) {
							const data = await res.json();
							return json(data.data, 200, cors);
						}
					} catch (e) {
						console.warn('Astronomy API error:', e);
					}
				}
				// Graceful fallback when credentials missing or API unavailable
				return json({ bodies: [], moonPhase: null, source: 'fallback' }, 200, cors);
			}

			// ── GET /api/weather ────────────────────────────────────────────────── [Open-Meteo sunrise / sunset]
			if (url.pathname === '/api/weather' && req.method === 'GET') {
				try {
					const weatherUrl = 'https://api.open-meteo.com/v1/forecast?latitude=30.03&longitude=30.95&daily=sunrise,sunset&timezone=Africa%2FCairo';
					const res = await fetch(weatherUrl);
					if (res.ok) {
						const data = await res.json();
						return json({
							sunrise: data.daily?.sunrise?.[0] || null,
							sunset:  data.daily?.sunset?.[0]  || null,
						}, 200, cors);
					}
				} catch (e) {
					console.warn('Open-Meteo error:', e);
				}
				return json({ sunrise: null, sunset: null }, 200, cors);
			}

			// ── GET /sitemap.xml ───────────────────────────────────────────────── [Dynamic XML Sitemap]
			if (url.pathname === '/sitemap.xml' && req.method === 'GET') {
				const profiles = await env.DB.prepare('SELECT id FROM course_profiles').all();
				const courseIds = (profiles.results || []).map(p => p.id);
				const baseUrl = 'https://zc-ocw.vercel.app';
				const now = new Date().toISOString().split('T')[0];

				const staticRoutes = ['', '/courses', '/departments', '/interviews', '/about', '/acknowledgments', '/contact', '/privacy'];
				const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticRoutes.map(route => `  <url><loc>${baseUrl}${route}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq></url>`).join('\n')}
${courseIds.map(id => `  <url><loc>${baseUrl}/courses/${id}</loc><lastmod>${now}</lastmod><changefreq>monthly</changefreq></url>`).join('\n')}
</urlset>`;

				return new Response(xml, {
					status: 200,
					headers: { ...cors, 'Content-Type': 'application/xml; charset=utf-8' },
				});
			}

			// ── GET /robots.txt ──────────────────────────────────────────────────
			if (url.pathname === '/robots.txt' && req.method === 'GET') {
				const txt = `User-agent: *\nAllow: /\nSitemap: https://zc-ocw.vercel.app/sitemap.xml\n`;
				return new Response(txt, {
					status: 200,
					headers: { ...cors, 'Content-Type': 'text/plain; charset=utf-8' },
				});
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
