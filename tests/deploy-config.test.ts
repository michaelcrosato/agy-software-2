// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "..");
const dockerfile = readFileSync(resolve(root, "Dockerfile"), "utf8");
const flytoml = readFileSync(resolve(root, "fly.toml"), "utf8");
const nextcfg = readFileSync(resolve(root, "next.config.ts"), "utf8");

describe("deploy config", () => {
  it("next.config enables standalone output", () => {
    expect(nextcfg).toMatch(/output:\s*["']standalone["']/);
  });
  it("Dockerfile builds from the standalone output and runs server.js", () => {
    expect(dockerfile).toMatch(/\.next\/standalone/);
    expect(dockerfile).toMatch(/server\.js/);
    expect(dockerfile).toMatch(/\.next\/static/);
    expect(dockerfile).toMatch(/HOSTNAME/);
  });
  it("fly.toml mounts a persistent volume at the SQLite directory", () => {
    const dest = flytoml.match(/destination\s*=\s*["']([^"']+)["']/);
    const dbUrl = flytoml.match(/DATABASE_URL\s*=\s*["']file:([^"']+)["']/);
    expect(dest).not.toBeNull();
    expect(dbUrl).not.toBeNull();
    // The SQLite file must live UNDER the mounted volume directory.
    expect(dbUrl![1].startsWith(dest![1])).toBe(true);
  });
  it("fly.toml health check targets /api/health", () => {
    expect(flytoml).toMatch(/\/api\/health/);
  });
});
