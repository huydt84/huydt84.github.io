import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import mdx from "@astrojs/mdx";

import react from "@astrojs/react";

import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://huydt84.github.io",
  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [mdx(), react(), sitemap()],
});
