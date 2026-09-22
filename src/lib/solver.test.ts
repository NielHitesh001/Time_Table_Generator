import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_OPTIONS, measure, solve } from "./solver.ts";

test("default AIML solve is clash-free in the 24–26 band", () => {
  const plans = solve(DEFAULT_OPTIONS);
  assert.ok(plans.length >= 1, "expected at least one plan");
  for (const plan of plans) {
    assert.ok(plan.credits >= 24 && plan.credits <= 26, `credits ${plan.credits}`);
    assert.equal(plan.clashes, 0);
    const codes = plan.offerings.map((o) => o.code);
    assert.equal(new Set(codes).size, codes.length, "duplicate subject");
    const cells = plan.offerings.flatMap((o) => o.cells);
    assert.equal(new Set(cells).size, cells.length, "overlapping cells");
    const m = measure(plan.offerings);
    assert.equal(m.clashes, 0);
  }
});

test("completed AIML fundamentals stay out of the default plan", () => {
  const plans = solve(DEFAULT_OPTIONS);
  const forbidden = new Set(["CSE1035", "CSE3013", "CSE2001", "CSE1017", "CSE2046"]);
  for (const plan of plans) {
    for (const o of plan.offerings) {
      assert.equal(forbidden.has(o.code), false, o.code);
      assert.notEqual(o.group, "pg");
    }
  }
});
