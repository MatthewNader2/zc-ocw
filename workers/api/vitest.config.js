import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";
import crypto from "node:crypto";
import { Blob } from "node:buffer";

if (!crypto.hash) {
	crypto.hash = function (algorithm, data, outputEncoding) {
		return crypto.createHash(algorithm).update(data).digest(outputEncoding);
	};
}

if (typeof globalThis.File === "undefined") {
	class File extends Blob {
		constructor(sources, name, options = {}) {
			super(sources, options);
			this.name = name;
			this.lastModified = options.lastModified || Date.now();
		}
	}
	globalThis.File = File;
}

if (!String.prototype.toWellFormed) {
	String.prototype.toWellFormed = function () {
		return this.toString();
	};
}

export default defineWorkersConfig({
	test: {
		poolOptions: {
			workers: {
				wrangler: { configPath: "./wrangler.jsonc" },
			},
		},
	},
});
