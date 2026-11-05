import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "test/e2e",
	snapshotPathTemplate: "{testDir}/__snapshots__/{testFileName}/{arg}{ext}",
	reporter: [["list"]],
	use: { baseURL: "http://localhost:4173" },
	expect: {
		toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: "disabled" },
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	webServer: {
		command: "node node_modules/http-server/bin/http-server . -p 4173 -s",
		cwd: import.meta.dirname,
		url: "http://localhost:4173/test/e2e/specimen.html",
		reuseExistingServer: !process.env.CI,
	},
});
