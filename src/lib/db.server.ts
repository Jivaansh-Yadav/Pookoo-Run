import { neon } from "@neondatabase/serverless";

// Server-only Neon client. Env binds at request time on Workers,
// so the connection string must be read inside the function.
export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
}
