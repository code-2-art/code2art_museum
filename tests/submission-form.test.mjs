import assert from "node:assert/strict";
import test from "node:test";

import {
  parseSubmissionSourceLinks,
  parseSubmissionTools,
  safeSubmissionFileName,
  validateSubmissionFiles
} from "../src/lib/submission-form.ts";

test("normalizes and deduplicates tool names", () => {
  assert.deepEqual(parseSubmissionTools("p5.js, Codex，p5.js"), {
    tools: ["p5.js", "Codex"],
    error: null
  });
});

test("accepts only safe HTTP(S) source links", () => {
  assert.equal(parseSubmissionSourceLinks("https://example.com/work\nhttp://example.org").error, null);
  assert.match(parseSubmissionSourceLinks("javascript:alert(1)").error, /HTTP\(S\)/);
  assert.match(parseSubmissionSourceLinks("https://user:pass@example.com/private").error, /HTTP\(S\)/);
  assert.match(parseSubmissionSourceLinks("not a url").error, /格式无效/);
});

test("validates upload count, size, and MIME type", () => {
  assert.equal(validateSubmissionFiles([{ name: "work.png", type: "image/png", size: 1024 }]), null);
  assert.match(validateSubmissionFiles([{ name: "work.svg", type: "image/svg+xml", size: 1024 }]), /不受支持/);
  assert.match(validateSubmissionFiles([{ name: "empty.png", type: "image/png", size: 0 }]), /空文件/);
  assert.match(validateSubmissionFiles(Array.from({ length: 6 }, (_, index) => ({
    name: `${index}.png`,
    type: "image/png",
    size: 1
  }))), /最多上传 5 个/);
});

test("creates a storage-safe fallback filename", () => {
  assert.equal(safeSubmissionFileName("作品 final 版.png"), "final-.png");
  assert.equal(safeSubmissionFileName("作品"), "file");
});
