import assert from "node:assert/strict";
import test from "node:test";
import { exhibitSchema, historyNodeSchema, profileSchema } from "../src/data/schemas.ts";

const validExhibit = {
  id: "c2a-test",
  title: "测试展品",
  type: "artwork",
  author: "code2art community",
  year: "2026",
  tools: ["p5.js"],
  description: "这是一条长度足够的测试展品说明，用于验证公开馆藏内容契约。",
  process: "测试创作过程。",
  media: [],
  repo: "",
  contributors: ["tester"],
  license: "MIT"
};

test("accepts a complete exhibit record", () => {
  assert.equal(exhibitSchema.parse(validExhibit).id, "c2a-test");
});

test("rejects missing required exhibit fields", () => {
  const { license, ...missingLicense } = validExhibit;
  assert.equal(license, "MIT");
  assert.throws(() => exhibitSchema.parse(missingLicense));
});

test("rejects unknown fields instead of silently publishing them", () => {
  assert.throws(() => exhibitSchema.parse({ ...validExhibit, privateNote: "do not publish" }));
});

test("restricts history verification states", () => {
  assert.throws(() => historyNodeSchema.parse({
    id: "history-test",
    year: "2026",
    title: "测试历史节点",
    description: "这是一条长度足够的历史节点说明，用于验证状态枚举不会被绕过。",
    source: "test",
    status: "published"
  }));
});

test("requires a meaningful profile relationship description", () => {
  assert.throws(() => profileSchema.parse({
    id: "profile-test",
    name: "Tester",
    avatar: "assets/test.svg",
    identity: "测试角色",
    tools: [],
    representativeWorks: [],
    relationToCode2Art: "太短",
    links: [],
    status: "seed"
  }));
});

