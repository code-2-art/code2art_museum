import { exhibits } from "@/data/museum";

export const prerender = true;

const siteUrl = "https://code-2-art.github.io/code2art_museum/";
const staticPaths = [
  "",
  "archive/",
  "contribute/",
  "exhibitions/",
  "exhibits/",
  "members/",
  "privacy/",
  "profiles/",
  "progress/",
  "research/"
];

export function GET() {
  const paths = [...staticPaths, ...exhibits.map((exhibit) => `exhibits/${exhibit.id}/`)];
  const urls = paths.map((path) => `<url><loc>${new URL(path, siteUrl).href}</loc></url>`).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: { "Content-Type": "application/xml; charset=utf-8" }
  });
}
