import { select, input } from "@inquirer/prompts";
import sql from "./db.js";

function formatTable(rows: Record<string, unknown>[]) {
  if (rows.length === 0) {
    console.log("\n  No signups found.\n");
    return;
  }

  const cols = Object.keys(rows[0]);
  const widths = cols.map(function (col) {
    return Math.max(
      col.length,
      ...rows.map(function (r) {
        const val = r[col];
        if (val instanceof Date) return val.toISOString().length;
        return String(val ?? "").length;
      })
    );
  });

  const header = cols.map((c, i) => c.padEnd(widths[i])).join("  ");
  const divider = widths.map((w) => "-".repeat(w)).join("  ");

  console.log();
  console.log(`  ${header}`);
  console.log(`  ${divider}`);
  for (const row of rows) {
    const line = cols
      .map(function (c, i) {
        const val = row[c];
        if (val instanceof Date) return val.toISOString().padEnd(widths[i]);
        return String(val ?? "").padEnd(widths[i]);
      })
      .join("  ");
    console.log(`  ${line}`);
  }
  console.log(`\n  ${rows.length} row(s)\n`);
}

async function viewAll() {
  const rows = await sql`
    SELECT id, email, campaign, name, created_at
    FROM signups ORDER BY created_at DESC
  `;
  formatTable(rows);
}

async function viewByCampaign() {
  const campaigns = await sql`
    SELECT DISTINCT campaign FROM signups ORDER BY campaign
  `;

  if (campaigns.length === 0) {
    console.log("\n  No campaigns found.\n");
    return;
  }

  const campaign = await select({
    message: "Which campaign?",
    choices: campaigns.map(function (r) {
      return { name: r.campaign, value: r.campaign };
    }),
  });

  const rows = await sql`
    SELECT id, email, name, created_at
    FROM signups WHERE campaign = ${campaign} ORDER BY created_at DESC
  `;
  formatTable(rows);
}

async function searchByEmail() {
  const query = await input({ message: "Email search:" });

  const rows = await sql`
    SELECT id, email, campaign, name, created_at
    FROM signups WHERE email ILIKE ${"%" + query + "%"} ORDER BY created_at DESC
  `;
  formatTable(rows);
}

async function viewStats() {
  const rows = await sql`
    SELECT campaign, COUNT(*)::int AS signups,
           MIN(created_at) AS first, MAX(created_at) AS latest
    FROM signups GROUP BY campaign ORDER BY campaign
  `;
  formatTable(rows);
}

async function main() {
  let running = true;

  while (running) {
    const action = await select({
      message: "What would you like to do?",
      choices: [
        { name: "View all signups", value: "all" },
        { name: "View by campaign", value: "campaign" },
        { name: "Search by email", value: "search" },
        { name: "Campaign stats", value: "stats" },
        { name: "Exit", value: "exit" },
      ],
    });

    switch (action) {
      case "all":
        await viewAll();
        break;
      case "campaign":
        await viewByCampaign();
        break;
      case "search":
        await searchByEmail();
        break;
      case "stats":
        await viewStats();
        break;
      case "exit":
        running = false;
        break;
    }
  }

  await sql.end();
}

main();
