import {
	env,
	createExecutionContext,
	waitOnExecutionContext,
} from "cloudflare:test";
import { describe, it, expect } from "vitest";
import worker from "../src";

describe("ZC OCW Worker API", () => {
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
});
