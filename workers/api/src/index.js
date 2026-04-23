/**
 * ZC OCW — Cloudflare Worker API
 *
 * Routes:
 *   GET    /api/overrides              → all course overrides
 *   GET    /api/overrides/:id          → one course override
 *   PUT    /api/overrides/:id          → upsert course override  [admin]
 *   GET    /api/materials/:playlistId  → materials for a course
 *   POST   /api/materials/:playlistId  → add material            [admin]
 *   DELETE /api/materials/:id          → delete material         [admin]
 *   GET    /api/books/:playlistId      → books for a course
 *   POST   /api/books/:playlistId      → add book                [admin]
 *   DELETE /api/books/:id             → delete book             [admin]
 *   POST   /api/upload/:playlistId    → upload file to R2       [admin]
 *
 * Authentication:
 *   Admin routes require header: Authorization: Bearer YOUR_ADMIN_PASSWORD
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
