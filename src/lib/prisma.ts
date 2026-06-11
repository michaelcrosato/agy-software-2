/**
 * Shared Prisma client singleton — F-0002
 * Prisma 7 requires a driver adapter for SQLite; we use better-sqlite3.
 * The globalThis cache survives Next.js hot-reload in dev (standard singleton pattern).
 */

import { PrismaClient } from "../../prisma/generated/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

export type { PrismaClient };

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaBetterSqlite3({ url: dbUrl });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
