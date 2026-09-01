import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  dts: false,
  sourcemap: true,
  clean: true,
  // tsup externalizes package.json "dependencies" by default; the shared
  // package is TypeScript source, so it must be bundled into the server.
  noExternal: ["@weathergpt/shared"],
  external: [
    "express",
    "cors",
    "dotenv",
    "zod",
    // Native module + heavy SMTP client: load from node_modules at runtime.
    "better-sqlite3",
    "nodemailer",
  ],
});