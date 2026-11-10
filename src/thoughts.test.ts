import katex from "katex";
import { describe, expect, it } from "vitest";
import { problems } from "./data/problems";
import { findCombination, partnersOf, validateProblem } from "./thoughts";

describe.each(problems)("問題データ $id", (problem) => {
  it("参照切れがない", () => {
    expect(validateProblem(problem)).toEqual([]);
  });

  it("LaTeX がすべて解釈できる", () => {
    const texts = [
      ...problem.segments.map((s) => s.text),
      ...problem.associations.flatMap((a) => [a.title, a.detail]),
      ...problem.combinations.flatMap((c) => [c.title, c.detail]),
      ...problem.solution.map((s) => s.text),
    ];
    for (const t of texts) {
      t.split("$").forEach((part, i) => {
        if (i % 2 === 1) {
          expect(() => katex.renderToString(part, { throwOnError: true })).not.toThrow();
        }
      });
    }
  });

  it("連想だけから始めて、すべての組み合わせに到達できる", () => {
    const board = new Set(problem.associations.map((a) => a.id));
    let grew = true;
    while (grew) {
      grew = false;
      for (const c of problem.combinations) {
        if (!board.has(c.id) && c.from.every((f) => board.has(f))) {
          board.add(c.id);
          grew = true;
        }
      }
    }
    expect(problem.combinations.filter((c) => !board.has(c.id))).toEqual([]);
  });
});

describe("くっつける", () => {
  const p = problems[0];
  it("順不同で組み合わせが見つかる", () => {
    expect(findCombination(p, "a4", "a1")?.id).toBe("c1");
    expect(findCombination(p, "a1", "a2")).toBeUndefined();
  });
  it("すでに生まれた考えの相手は候補にしない", () => {
    expect(partnersOf(p, "a1", ["a1", "a4"])).toEqual(["a4"]);
    expect(partnersOf(p, "a1", ["a1", "a4", "c1"])).toEqual([]);
  });
});
