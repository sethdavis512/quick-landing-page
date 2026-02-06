import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = postgres(databaseUrl);

async function waitForConnection(retries = 10, delayMs = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      await sql`SELECT 1`;
      return;
    } catch (err) {
      console.log(`Waiting for Postgres (attempt ${i + 1}/${retries})...`);
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

export async function initDb() {
  await waitForConnection();
  await sql`
    CREATE TABLE IF NOT EXISTS signups (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      campaign TEXT NOT NULL,
      name TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS signups_email_campaign_idx
    ON signups (email, campaign)
  `;
}

export default sql;
