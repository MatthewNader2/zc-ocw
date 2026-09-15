import {
	env,
	createExecutionContext,
	waitOnExecutionContext,
} from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import worker from "../src";

describe("ZC OCW Worker API", () => {
	beforeAll(async () => {
		await env.DB.prepare(`CREATE TABLE IF NOT EXISTS course_overrides (playlist_id TEXT PRIMARY KEY, school_id TEXT, program_id TEXT, course_code TEXT, instructor TEXT, semester TEXT, level TEXT, description TEXT, tags TEXT DEFAULT '[]', updated_at TEXT DEFAULT (datetime('now')))`)
			.run();
	});

	it("returns health status ok", async () => {
		const request = new Request("http://localhost/api/health");
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.status).toBe("ok");
	});

	it("returns 401 on protected admin endpoints without auth", async () => {
		const request = new Request("http://localhost/api/admins/me");
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.isAdmin).toBe(false);
	});

	it("blocks disallowed YouTube endpoints", async () => {
		const request = new Request("http://localhost/api/youtube/commentThreads");
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(400);
		const data = await response.json();
		expect(data.error).toBe("Disallowed YouTube endpoint");
	});

	it("blocks unauthorized foreign channel queries", async () => {
		const request = new Request("http://localhost/api/youtube/playlists?channelId=UC_FAKE_CHANNEL_999999");
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(403);
		const data = await response.json();
		expect(data.error).toBe("Access denied to foreign YouTube channel");
	});

	it("sets Cache-Control header on cacheable GET endpoints", async () => {
		const request = new Request("http://localhost/api/overrides");
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		expect(response.headers.get("Cache-Control")).toContain("max-age=");
	});
});
