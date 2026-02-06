import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import sql, { initDb } from "./db.js";
import { signupSchema } from "@quick-landing-page/shared-config";

const app = new Hono();

app.use("/signups/*", cors());
app.use("/signups", cors());

app.get("/health", function (c) {
  return c.json({ status: "ok" });
});

app.get("/signups", async function (c) {
  const campaign = c.req.query("campaign");
  const rows = campaign
    ? await sql`SELECT id, email, campaign, name, created_at FROM signups WHERE campaign = ${campaign} ORDER BY created_at DESC`
    : await sql`SELECT id, email, campaign, name, created_at FROM signups ORDER BY created_at DESC`;
  return c.json(rows);
});

app.post("/signups", async function (c) {
  const body = await c.req.json();
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return c.json({ error: firstError.message }, 400);
  }

  const { email, campaign, name } = parsed.data;

  try {
    const [row] = await sql`
      INSERT INTO signups (email, campaign, name)
      VALUES (${email.trim().toLowerCase()}, ${campaign}, ${name ?? null})
      RETURNING id, email, campaign, created_at
    `;
    return c.json(row, 201);
  } catch (err: any) {
    if (err.code === "23505") {
      return c.json({ error: "This email is already signed up for this campaign" }, 409);
    }
    console.error("Signup insert error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

const port = Number(process.env.PORT) || 3001;

await initDb();
console.log(`API server running on port ${port}`);

serve({ fetch: app.fetch, port });
