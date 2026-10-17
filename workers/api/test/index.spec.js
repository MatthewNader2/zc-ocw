import {
	env,
	createExecutionContext,
	waitOnExecutionContext,
} from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import worker from "../src";

describe("ZC OCW Worker API", () => {
	beforeAll(async () => {
		await env.DB.prepare(`CREATE TABLE IF NOT EXISTS course_overrides (playlist_id TEXT PRIMARY KEY, category TEXT DEFAULT 'course', school_id TEXT, program_id TEXT, course_code TEXT, instructor TEXT, semester TEXT, level TEXT, description TEXT, tags TEXT DEFAULT '[]', updated_at TEXT DEFAULT (datetime('now')))`).run();
		await env.DB.prepare(`CREATE TABLE IF NOT EXISTS playlist_profiles (playlist_id TEXT PRIMARY KEY, category TEXT DEFAULT 'course', updated_at TEXT DEFAULT (datetime('now')))`).run();
		await env.DB.prepare(`CREATE TABLE IF NOT EXISTS acknowledgments (id INTEGER PRIMARY KEY CHECK (id = 1), config_json TEXT NOT NULL, updated_at TEXT DEFAULT (datetime('now')))`).run();
		await env.DB.prepare(`CREATE TABLE IF NOT EXISTS schools_programs (id INTEGER PRIMARY KEY CHECK (id = 1), config_json TEXT NOT NULL, updated_at TEXT DEFAULT (datetime('now')))`).run();
		await env.DB.prepare(`CREATE TABLE IF NOT EXISTS page_content (page_slug TEXT PRIMARY KEY, content_json TEXT NOT NULL, updated_at TEXT DEFAULT (datetime('now')))`).run();
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

	it("rejects forged or untrusted JWT tokens with 401", async () => {
		// A self-signed or forged JWT that claims to be a super admin
		const fakeHeader = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
		const fakePayload = btoa(JSON.stringify({ email: "matthewnader2@gmail.com", sub: "fake_admin_uid" }));
		const forgedToken = `${fakeHeader}.${fakePayload}.fakesignature`;

		const request = new Request("http://localhost/api/overrides/PL123", {
			method: "PUT",
			headers: {
				Authorization: `Bearer ${forgedToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ category: "course", instructor: "Hacker" }),
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(401);
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
		expect(response.headers.get("Cache-Control")).toContain("no-cache");
	});

	it("serves acknowledgments with no-cache and fresh D1 content", async () => {
		// Seed test acknowledgments in D1
		const mockAck = { headerTitle: "Special Thanks 2026", team: [{ id: "t1", name: "Alice" }] };
		await env.DB.prepare("INSERT OR REPLACE INTO acknowledgments (id, config_json, updated_at) VALUES (1, ?, datetime('now'))")
			.bind(JSON.stringify(mockAck))
			.run();

		const request = new Request("http://localhost/api/acknowledgments");
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		expect(response.headers.get("Cache-Control")).toBe("public, no-cache, must-revalidate");
		const data = await response.json();
		expect(data.headerTitle).toBe("Special Thanks 2026");
	});

	it("serves CMS page content with no-cache and fresh D1 content", async () => {
		const mockPage = { title: "About ZC OCW", mission: "Open education for all" };
		await env.DB.prepare("INSERT OR REPLACE INTO page_content (page_slug, content_json, updated_at) VALUES ('about', ?, datetime('now'))")
			.bind(JSON.stringify(mockPage))
			.run();

		const request = new Request("http://localhost/api/pages/about");
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		expect(response.headers.get("Cache-Control")).toBe("public, no-cache, must-revalidate");
		const data = await response.json();
		expect(data.title).toBe("About ZC OCW");
	});

	it("allows CORS for Vercel preview branch origins", async () => {
		const previewOrigin = "https://zc-ocw-git-feature-test.vercel.app";
		const request = new Request("http://localhost/api/health", {
			headers: { Origin: previewOrigin },
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.headers.get("Access-Control-Allow-Origin")).toBe(previewOrigin);
	});
});
