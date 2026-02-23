import { defineAction } from "astro:actions";
import { z } from "astro/zod";
import sql from "../db.js";

export const server = {
  getStats: defineAction({
    handler: async function () {
      const rows = await sql`
        SELECT campaign, COUNT(*)::int AS signups,
               MIN(created_at) AS first, MAX(created_at) AS latest
        FROM signups GROUP BY campaign ORDER BY campaign
      `;
      return rows;
    },
  }),

  getCampaigns: defineAction({
    handler: async function () {
      const rows = await sql`
        SELECT DISTINCT campaign FROM signups ORDER BY campaign
      `;
      return rows.map(function (r) {
        return r.campaign as string;
      });
    },
  }),

  getSignups: defineAction({
    input: z.object({
      campaign: z.string().optional(),
      search: z.string().optional(),
    }),
    handler: async function (input) {
      const { campaign, search } = input;

      if (campaign && search) {
        return await sql`
          SELECT id, email, campaign, name, created_at
          FROM signups
          WHERE campaign = ${campaign} AND email ILIKE ${"%" + search + "%"}
          ORDER BY created_at DESC
        `;
      }

      if (campaign) {
        return await sql`
          SELECT id, email, campaign, name, created_at
          FROM signups
          WHERE campaign = ${campaign}
          ORDER BY created_at DESC
        `;
      }

      if (search) {
        return await sql`
          SELECT id, email, campaign, name, created_at
          FROM signups
          WHERE email ILIKE ${"%" + search + "%"}
          ORDER BY created_at DESC
        `;
      }

      return await sql`
        SELECT id, email, campaign, name, created_at
        FROM signups
        ORDER BY created_at DESC
      `;
    },
  }),
};
