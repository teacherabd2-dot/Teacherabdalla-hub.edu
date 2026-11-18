import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

type DrizzleDb = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsDrizzleDb?: DrizzleDb;
};

export const MISSING_DB_MESSAGE =
  "DATABASE_URL is not set. Add your PostgreSQL connection string in your hosting dashboard " +
  "(Vercel → Project → Settings → Environment Variables → DATABASE_URL) and redeploy. " +
  "Then open /api/setup once to create the tables.";

/**
 * The pool is created lazily (on the first real database request) instead of at
 * import time. This lets `next build` succeed on a fresh deployment before the
 * DATABASE_URL environment variable has been added yet.
 */
function getPool(): Pool {
  if (globalForDb.__arenaNextJsPostgresqlPool) {
    return globalForDb.__arenaNextJsPostgresqlPool;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(MISSING_DB_MESSAGE);
  }

  // Hosted providers (Neon, Supabase, Render, Railway) require SSL.
  const isLocalDatabase =
    /(localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(databaseUrl) ||
    /sslmode=disable/i.test(databaseUrl);

  const created = new Pool({
    connectionString: databaseUrl,
    ...(isLocalDatabase ? {} : { ssl: { rejectUnauthorized: false } }),
    max: 5,
    idleTimeoutMillis: 15_000,
    connectionTimeoutMillis: 15_000,
  });

  globalForDb.__arenaNextJsPostgresqlPool = created;
  return created;
}

function getDb(): DrizzleDb {
  if (globalForDb.__arenaNextJsDrizzleDb) {
    return globalForDb.__arenaNextJsDrizzleDb;
  }
  const created = drizzle(getPool(), { schema });
  globalForDb.__arenaNextJsDrizzleDb = created;
  return created;
}

/** Lazily-initialised connection pool. Safe to import at build time. */
export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const instance = getPool() as unknown as Record<string | symbol, unknown>;
    const value = instance[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
}) as Pool;

/** Lazily-initialised Drizzle client. Safe to import at build time. */
export const db = new Proxy({} as DrizzleDb, {
  get(_target, prop) {
    const instance = getDb() as unknown as Record<string | symbol, unknown>;
    const value = instance[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
}) as DrizzleDb;

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
