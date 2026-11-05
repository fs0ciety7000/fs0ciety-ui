import { defineConfig } from "tsdown";

// clean: false so dist/css/tokens.css written by `gen` survives bundling.
export default defineConfig({
	entry: ["src/index.ts"],
	format: "esm",
	dts: true,
	clean: false,
});
