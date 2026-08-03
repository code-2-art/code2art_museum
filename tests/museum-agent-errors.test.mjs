import assert from "node:assert/strict";
import test from "node:test";
import { describeAgentFailure } from "../src/lib/museum-agent-errors.ts";

test("explains evidence-version mismatches separately from model outages", () => {
  const failure = describeAgentFailure("invalid_evidence");
  assert.match(failure.title, /证据格式/);
  assert.match(failure.detail, /服务端未接受/);
});

test("explains verified model receipt failures explicitly", () => {
  const failure = describeAgentFailure("model_mismatch");
  assert.match(failure.title, /回执核验/);
  assert.match(failure.detail, /实际模型/);
});

test("uses a safe generic message for unknown failures", () => {
  const failure = describeAgentFailure("future_unknown_reason");
  assert.match(failure.title, /生成服务暂时不可用/);
  assert.doesNotMatch(failure.detail, /future_unknown_reason/);
});
