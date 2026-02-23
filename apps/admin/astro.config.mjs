import { defineConfig, envField } from "astro/config";
import node from "@astrojs/node";
import { tailwindPlugin } from "@quick-landing-page/tailwind-config/plugin";

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  vite: { plugins: [tailwindPlugin()] },
  env: {
    schema: {
      DATABASE_URL: envField.string({ context: "server", access: "secret" }),
    },
  },
});
