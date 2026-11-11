import katex from "katex";
import { describe, expect, it } from "vitest";
import { problems } from "./data/problems";
import {
  cardContaining,
  findCombination,
  nextFragment,
  sanitizeBoard,
  validateProblem,
  visibleCards,
} from "./thoughts";

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

describe("思考ボード", () => {
  const p = problems[0];
  it("順不同で組み合わせが見つかる", () => {
    expect(findCombination(p, "a4", "a1")?.id).toBe("c1");
    expect(findCombination(p, "a1", "a2")).toBeUndefined();
  });
  it("くっつけた考えは新しい考えに代わる", () => {
    expect(visibleCards(p, ["a1", "a4", "a5"])).toEqual(["a1", "a4", "a5"]);
    expect(visibleCards(p, ["a1", "a4", "a5", "c1"])).toEqual(["a5", "c1"]);
    expect(visibleCards(p, ["a1", "a4", "a5", "c1", "c3"])).toEqual(["c3"]);
  });
  it("考えを含んでいるカードが分かる", () => {
    expect(cardContaining(p, ["a1", "a4", "a5", "c1", "c3"], "a1")).toBe("c3");
    expect(cardContaining(p, ["a1"], "a1")).toBe("a1");
    expect(cardContaining(p, ["a1"], "a4")).toBeUndefined();
  });
  it("壊れた保存データを直す", () => {
    expect(sanitizeBoard(p, ["a1", "zz", "c1", "c3", "a1"])).toEqual(["a1"]);
    expect(sanitizeBoard(p, ["a1", "a4", "c1"])).toEqual(["a1", "a4", "c1"]);
  });
  it("見る順番どおりに次の着眼点が決まる", () => {
    expect(nextFragment(p, [])).toBe("f4");
    expect(nextFragment(p, ["f4", "f2"])).toBe("f1");
    expect(nextFragment(p, ["f1", "f2", "f3", "f4"])).toBeUndefined();
  });
});
