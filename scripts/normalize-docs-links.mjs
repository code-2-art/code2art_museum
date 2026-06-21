import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const docsDir = fileURLToPath(new URL("../docs/", import.meta.url));
const htmlFiles = [];

async function collectHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectHtmlFiles(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      htmlFiles.push(fullPath);
    }
  }
}

function prefixFor(filePath) {
  const relativePath = relative(docsDir, filePath).replaceAll(sep, "/");
  const depth = relativePath.split("/").length - 1;
  return depth > 0 ? "../".repeat(depth) : "";
}

await collectHtmlFiles(docsDir);

for (const filePath of htmlFiles) {
  const prefix = prefixFor(filePath);
  const html = await readFile(filePath, "utf8");
  const normalized = html
    .replaceAll('href="/./_astro/', `href="${prefix}_astro/`)
    .replaceAll('src="/./_astro/', `src="${prefix}_astro/`)
    .replaceAll('href="/_astro/', `href="${prefix}_astro/`)
    .replaceAll('src="/_astro/', `src="${prefix}_astro/`)
    .replaceAll('href="/code2art_museum/_astro/', `href="${prefix}_astro/`)
    .replaceAll('src="/code2art_museum/_astro/', `src="${prefix}_astro/`)
    .replaceAll('href="/code2art_museum/assets/', `href="${prefix}assets/`)
    .replaceAll('src="/code2art_museum/assets/', `src="${prefix}assets/`);

  if (normalized !== html) {
    await writeFile(filePath, normalized, "utf8");
  }
}
