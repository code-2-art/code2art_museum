import assert from "node:assert/strict";
import test from "node:test";
import { buildGuideAnswer, searchMuseum } from "../src/lib/museum-search.ts";

const records = [
  {
    id: "work-p5",
    kind: "exhibit",
    type: "artwork",
    title: "p5.js 生成式草图",
    description: "面向入门者的生成艺术作品。",
    meta: "2024 / code2art",
    keywords: ["p5.js", "JavaScript", "Generative Art"],
    href: "/exhibits/work-p5/"
  },
  {
    id: "prompt-archive",
    kind: "exhibit",
    type: "prompt",
    title: "Prompt 即展品",
    description: "记录 AI 协作中的提示、Skill 与工作流。",
    meta: "2026 / code2art",
    keywords: ["Prompt", "Skill", "AI", "协作"],
    href: "/exhibits/prompt-archive/"
  },
  {
    id: "history-hudoit",
    kind: "history",
    type: "history",
    title: "HUDOIT 论坛活跃",
    description: "实验编程社群的早期历史来源。",
    meta: "2010s / seed",
    keywords: ["论坛", "历史"],
    href: "/archive/#history-hudoit"
  }
];

test("ranks a direct title and tool match first", () => {
  const results = searchMuseum(records, "生成艺术 p5");
  assert.equal(results[0]?.id, "work-p5");
  assert.ok(results[0].score > 0);
});

test("uses intent terms for prompt and skill questions", () => {
  const results = searchMuseum(records, "有哪些作品使用了 skill？");
  assert.equal(results[0]?.id, "prompt-archive");
});

test("builds a beginner route from ranked evidence", () => {
  const results = searchMuseum(records, "给我一条新手入门路线");
  const answer = buildGuideAnswer("给我一条新手入门路线", results);
  assert.match(answer, /入门路线/);
  assert.match(answer, /《.+》/);
});

test("returns an honest no-evidence answer", () => {
  const answer = buildGuideAnswer("量子雕塑", []);
  assert.match(answer, /没有足够证据/);
});

test("respects the result limit", () => {
  assert.equal(searchMuseum(records, "AI 历史 生成", 2).length, 2);
});
