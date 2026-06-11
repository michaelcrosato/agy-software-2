import { execSync } from "node:child_process";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "../..");

// Seed the database before every E2E run.
// The seed is idempotent — running it here (and in the gate shim) is safe.
execSync("npm run seed", { cwd: ROOT, stdio: "inherit" });
