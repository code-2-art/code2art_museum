import assert from "node:assert/strict";
import test from "node:test";
import {
  demoAccounts,
  demoArchiveRecords,
  demoExhibitions,
  demoSubmissions
} from "../src/data/demo.ts";

test("provides exactly ten deterministic development accounts", () => {
  assert.equal(demoAccounts.length, 10);
  assert.equal(new Set(demoAccounts.map((account) => account.id)).size, 10);
  assert.equal(new Set(demoAccounts.map((account) => account.email)).size, 10);
});

test("gives every development account between one and three submissions", () => {
  for (const account of demoAccounts) {
    const works = demoSubmissions.filter((work) => work.accountId === account.id);
    assert.ok(works.length >= 1 && works.length <= 3, `${account.name} has ${works.length} submissions`);
  }
  assert.equal(demoSubmissions.length, 20);
});

test("provides five exhibitions with valid work relationships", () => {
  assert.equal(demoExhibitions.length, 5);
  const workIds = new Set(demoSubmissions.map((work) => work.id));
  for (const exhibition of demoExhibitions) {
    assert.ok(exhibition.submissionIds.length > 0);
    exhibition.submissionIds.forEach((id) => assert.ok(workIds.has(id), `${id} should resolve`));
  }
});

test("provides 200 archive records with resolvable related ids", () => {
  assert.equal(demoArchiveRecords.length, 200);
  assert.equal(new Set(demoArchiveRecords.map((record) => record.id)).size, 200);
  const relatedIds = new Set([
    ...demoAccounts.map((account) => account.slug),
    ...demoSubmissions.map((work) => work.id),
    ...demoExhibitions.map((exhibition) => exhibition.id)
  ]);
  for (const record of demoArchiveRecords) {
    record.relatedIds.forEach((id) => assert.ok(relatedIds.has(id), `${record.id} has unresolved ${id}`));
  }
});
