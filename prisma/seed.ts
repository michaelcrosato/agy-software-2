/**
 * prisma/seed.ts — thin CLI entry for `npm run seed` / `prisma db seed`
 * The real logic lives in src/lib/seed.ts (inside typecheck + lint gates).
 */

import prisma from "../src/lib/prisma";
import { seed } from "../src/lib/seed";

seed(prisma)
  .catch((err: unknown) => {
    console.error("[seed] Failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
