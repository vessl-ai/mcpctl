import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli/cli.ts", "src/daemon/daemon.ts"],
  format: ["cjs"],
  dts: true,
  clean: true,
  external: [
    "commander",
    "inquirer",
    "@mcpctl/core",
    "@mcpctl/lib",
    "readline/promises",
  ],
  shims: true,
  banner: { js: "#!/usr/bin/env node" },
  env: {
    NODE_ENV: process.env.NODE_ENV || "production",
  },
  onSuccess: "chmod +x dist/cli.js",
});
