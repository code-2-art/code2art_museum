import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://code-2-art.github.io/code2art_museum/",
  base: "./",
  outDir: "./docs",
  publicDir: "./public",
  vite: {
    plugins: [tailwindcss()]
  }
});
