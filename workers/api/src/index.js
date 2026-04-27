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
 * POST   /api/feedback              → submit feedback (public)
 * GET    /api/feedback              → list feedback [admin]
 * GET    /api/feedback/:id          → get feedback by id [admin]
 * GET    /api/profiles              → list playlist profiles
 * GET    /api/profiles/:id          → get profile by playlist_id
 * PUT    /api/profiles              → bulk upsert profiles [admin]
 * PUT    /api/profiles/:id          → upsert single profile [admin]
 * GET    /api/health                → health check
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

function sanitize(str) {
	if (!str) return '';
	return String(str).replace(/[<>]/g, '').slice(0, 5000);
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
				if (!isAdmin(req, env)) return err('Unauthorized', 401, cors);

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
				if (!isAdmin(req, env)) return err('Unauthorized', 401, cors);

				const row = await env.DB.prepare('SELECT * FROM feedback WHERE id = ?').bind(id).first();
				if (!row) return err('Not found', 404, cors);

				return json(row, 200, cors);
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
