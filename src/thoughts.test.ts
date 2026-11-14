import katex from "katex";
import { describe, expect, it } from "vitest";
import { patterns } from "./data/patterns";
import { problems } from "./data/problems";
import {
  cardContaining,
  checkSlot,
  findCombination,
  sanitizeBoard,
  sanitizePlaced,
  sourcesOf,
  validateProblem,
  visibleCards,
} from "./thoughts";

describe.each(problems)("問題データ $id", (problem) => {
  it("参照切れがない", () => {
    expect(validateProblem(problem)).toEqual([]);
  });

  it("連想の型がすべて辞書にある", () => {
    const ids = new Set(patterns.map((x) => x.id));
    const missing = problem.associations.filter((a) => a.patternId && !ids.has(a.patternId));
    expect(missing).toEqual([]);
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
  const p = problems.find((x) => x.id === "quadratic-min")!;
  it("順不同で組み合わせが見つかる", () => {
    expect(findCombination(p, "a4", "a1")?.id).toBe("c1");
    expect(findCombination(p, "a1", "a2")).toBeUndefined();
  });
  it("くっつけた考えは新しい考えに代わる", () => {
    expect(visibleCards(p, ["a1", "a4", "a5"])).toEqual(["a1", "a4", "a5"]);
    expect(visibleCards(p, ["a1", "a4", "a5", "c1"])).toEqual(["a5", "c1"]);
    expect(visibleCards(p, ["a2", "a5", "c3"])).toEqual(["c3"]);
  });
  it("考えを含んでいるカードが分かる", () => {
    expect(cardContaining(p, ["a1", "a4", "c1"], "a1")).toBe("c1");
    expect(cardContaining(p, ["a1"], "a1")).toBe("a1");
    expect(cardContaining(p, ["a1"], "a4")).toBeUndefined();
  });
  it("壊れた保存データを直す", () => {
    expect(sanitizeBoard(p, ["a1", "zz", "c1", "c3", "a1"])).toEqual(["a1"]);
    expect(sanitizeBoard(p, ["a1", "a4", "c1"])).toEqual(["a1", "a4", "c1"]);
  });
});

describe("解答ボード", () => {
  const p = problems.find((x) => x.id === "quadratic-min")!;
  it("置いた場所が合っているかが分かる", () => {
    expect(checkSlot(p, 0, null)).toBe("empty");
    expect(checkSlot(p, 0, "c1")).toBe("ok");
    expect(checkSlot(p, 0, "a1")).toBe("ok");
    expect(checkSlot(p, 1, "c1")).toBe("elsewhere");
    expect(checkSlot(p, 2, "a3")).toBe("needs-merge");
  });
  it("骨組みを上から順に全部うめられる", () => {
    for (const problem of problems) {
      const main = problem.skeleton.map((k) => k.thoughts[0]);
      const board = [...new Set(main.flatMap((t) => [...sourcesOf(problem, t), t]))];
      expect(sanitizePlaced(problem, board, main)).toEqual(main);
    }
  });
  it("壊れた配置を直す", () => {
    expect(sanitizePlaced(p, ["a1", "a4", "c1"], ["a1", "c1", "c1", "zz"])).toEqual([
      null,
      "c1",
      null,
    ]);
  });
});

describe("連想の型", () => {
  it("id が重複せず、LaTeX が解釈でき、どれかの問題で使われている", () => {
    expect(new Set(patterns.map((x) => x.id)).size).toBe(patterns.length);
    const used = new Set(problems.flatMap((x) => x.associations.map((a) => a.patternId)));
    expect(patterns.filter((x) => !used.has(x.id)).map((x) => x.id)).toEqual([]);
    for (const x of patterns) {
      for (const t of [x.trigger, x.idea, x.detail]) {
        t.split("$").forEach((part, i) => {
          if (i % 2 === 1) {
            expect(() => katex.renderToString(part, { throwOnError: true })).not.toThrow();
          }
        });
      }
    }
  });
});
