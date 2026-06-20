import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://code-2-art.github.io",
  base: "/code2art_museum",
  outDir: "./docs",
  publicDir: "./public",
  vite: {
    plugins: [tailwindcss()]
  }
});
