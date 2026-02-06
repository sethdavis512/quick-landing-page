import { defineConfig } from "astro/config";
import { tailwindPlugin } from "@quick-landing-page/tailwind-config/plugin";

export default defineConfig({
  vite: {
    plugins: [tailwindPlugin()],
  },
});
