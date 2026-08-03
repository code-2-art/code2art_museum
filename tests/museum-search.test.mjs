import assert from "node:assert/strict";
import test from "node:test";
import {
  buildExhibitionScheduleAnswer,
  buildGuideAnswer,
  resolveExhibitionSchedule,
  searchMuseum
} from "../src/lib/museum-search.ts";

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

test("keeps large archive collections from crowding out other evidence kinds", () => {
  const crowded = [
    ...Array.from({ length: 8 }, (_, index) => ({
      ...records[2],
      id: `history-${index}`,
      title: `生成艺术历史 ${index}`
    })),
    records[0],
    records[1]
  ];
  const results = searchMuseum(crowded, "生成艺术 prompt", 4);
  assert.ok(results.some((record) => record.kind === "exhibit"));
  assert.ok(results.filter((record) => record.kind === "history").length <= 2);
});

test("answers exhibition relationship questions with the exhibition evidence", () => {
  const exhibition = {
    ...records[1],
    id: "exhibition-open-source",
    kind: "exhibition",
    type: "exhibition",
    title: "开源之后"
  };
  const answer = buildGuideAnswer("这件作品在哪个展览？", [records[0], exhibition]);
  assert.match(answer, /展览《开源之后》/);
  assert.match(answer, /测试数据关系/);
});

test("answers relative exhibition schedule questions from structured local data", () => {
  const exhibitions = [
    {
      ...records[0],
      id: "exhibition-nature",
      kind: "exhibition",
      type: "exhibition",
      title: "可计算的自然",
      schedule: { status: "open", startDate: "2026-01-15" }
    },
    {
      ...records[1],
      id: "exhibition-future",
      kind: "exhibition",
      type: "exhibition",
      title: "未来展览",
      schedule: { status: "planning", startDate: "2026-09-15" }
    }
  ];
  const schedule = resolveExhibitionSchedule(exhibitions, "明天有什么展览", new Date(2026, 7, 3, 12));

  assert.ok(schedule);
  assert.equal(schedule.targetDate, "2026-08-04");
  assert.deepEqual(schedule.openExhibitions.map((record) => record.id), ["exhibition-nature"]);
  const answer = buildExhibitionScheduleAnswer(schedule);
  assert.match(answer, /明天是 2026 年 08 月 04 日/);
  assert.match(answer, /《可计算的自然》/);
  assert.match(answer, /没有逐日开放时段或闭展日期/);
});

test("does not treat ordinary exhibition questions as date schedule queries", () => {
  assert.equal(resolveExhibitionSchedule(records, "这件作品在哪个展览？", new Date(2026, 7, 3, 12)), null);
});
