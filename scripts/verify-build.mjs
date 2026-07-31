import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "parse5";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(repoRoot, "docs");
const localAttributes = new Map([
  ["a", ["href"]],
  ["iframe", ["src"]],
  ["img", ["src"]],
  ["link", ["href"]],
  ["script", ["src"]],
  ["source", ["src"]],
  ["video", ["src", "poster"]]
]);
const ignoredSchemes = /^(?:https?:|mailto:|tel:|data:|blob:)/i;

async function listHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? listHtmlFiles(target) : entry.name.endsWith(".html") ? [target] : [];
  }));
  return nested.flat();
}

function walk(node, visit) {
  visit(node);
  for (const child of node.childNodes ?? []) walk(child, visit);
  if (node.content) walk(node.content, visit);
}

function attribute(node, name) {
  return node.attrs?.find((item) => item.name === name)?.value;
}

function resolveTarget(sourceFile, rawValue) {
  const [withoutHash, hash = ""] = rawValue.split("#", 2);
  const withoutQuery = withoutHash.split("?", 1)[0];
  if (!withoutQuery) return { targetFile: sourceFile, hash };

  const decoded = decodeURIComponent(withoutQuery);
  const targetPath = decoded.startsWith("/")
    ? path.join(outputRoot, decoded.slice(1))
    : path.resolve(path.dirname(sourceFile), decoded);
  const targetFile = path.extname(targetPath) ? targetPath : path.join(targetPath, "index.html");
  return { targetFile, hash };
}

const htmlFiles = await listHtmlFiles(outputRoot);
const documents = new Map();
for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const document = parse(html);
  const ids = new Set();
  walk(document, (node) => {
    const id = attribute(node, "id");
    if (id) ids.add(id);
  });
  documents.set(path.normalize(file), { document, ids });
}

const failures = [];
for (const [file, { document }] of documents) {
  walk(document, (node) => {
    const attributes = localAttributes.get(node.tagName);
    if (!attributes) return;
    for (const name of attributes) {
      const value = attribute(node, name);
      if (!value || ignoredSchemes.test(value) || value.startsWith("//")) continue;
      if (/^javascript:/i.test(value)) {
        failures.push(`${path.relative(outputRoot, file)}: unsafe ${name}="${value}"`);
        continue;
      }
      const { targetFile, hash } = resolveTarget(file, value);
      if (!targetFile.startsWith(outputRoot)) {
        failures.push(`${path.relative(outputRoot, file)}: ${name} escapes docs/: ${value}`);
        continue;
      }
      node.__resolvedTarget = { name, value, targetFile: path.normalize(targetFile), hash };
    }
  });

  const pending = [];
  walk(document, (node) => {
    if (node.__resolvedTarget) pending.push(node.__resolvedTarget);
  });
  for (const target of pending) {
    try {
      await access(target.targetFile);
    } catch {
      failures.push(`${path.relative(outputRoot, file)}: missing ${target.name} target ${target.value}`);
      continue;
    }
    if (target.hash && target.targetFile.endsWith(".html")) {
      const targetDocument = documents.get(target.targetFile);
      if (targetDocument && !targetDocument.ids.has(decodeURIComponent(target.hash))) {
        failures.push(`${path.relative(outputRoot, file)}: missing anchor ${target.value}`);
      }
    }
  }
}

if (failures.length) {
  console.error(`Build verification failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Build verification passed: ${htmlFiles.length} HTML files and all local targets are valid.`);
}

