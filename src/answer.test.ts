import { describe, expect, it } from "vitest";
import {
  checkRow,
  isComplete,
  moveRow,
  placeSnippet,
  removeSnippet,
  sanitizeRows,
  type Rows,
  type Snippet,
} from "./answer";
import { problems } from "./data/problems";

const p = problems.find((x) => x.id === "quadratic-min")!;
const s = (id: string, extra: Partial<Snippet> = {}): Snippet => ({ id, text: id, ...extra });
const ids = (rows: Rows) => rows.map((row) => row.map((x) => x.id));

describe("解答ボードにことばを置く", () => {
  it("新しい段、段の最後、ことばの前に置ける", () => {
    let rows = placeSnippet([], s("a"), "new");
    rows = placeSnippet(rows, s("b"), "new");
    rows = placeSnippet(rows, s("c"), { row: 0 });
    rows = placeSnippet(rows, s("d"), { before: "a" });
    expect(ids(rows)).toEqual([["d", "a", "c"], ["b"]]);
  });

  it("すでにあることばは移る。空になった段はなくなる", () => {
    const rows: Rows = [[s("a")], [s("b"), s("c")], [s("d")]];
    expect(ids(placeSnippet(rows, s("a"), { row: 2 }))).toEqual([["b", "c"], ["d", "a"]]);
    expect(ids(placeSnippet(rows, s("c"), "new"))).toEqual([["a"], ["b"], ["d"], ["c"]]);
    expect(ids(placeSnippet(rows, s("d"), { before: "b" }))).toEqual([["a"], ["d", "b", "c"]]);
    // 自分の段に落としても、自分の前に落としても、なくならない
    expect(ids(placeSnippet(rows, s("a"), { row: 0 }))).toEqual(ids(rows));
    expect(placeSnippet(rows, s("b"), { before: "b" })).toBe(rows);
  });

  it("外すと、空になった段もなくなる", () => {
    const rows: Rows = [[s("a")], [s("b"), s("c")]];
    expect(ids(removeSnippet(rows, "a"))).toEqual([["b", "c"]]);
    expect(ids(removeSnippet(rows, "b"))).toEqual([["a"], ["c"]]);
  });

  it("段を上下に動かせる", () => {
    const rows: Rows = [[s("a")], [s("b")], [s("c")]];
    expect(ids(moveRow(rows, 2, -1))).toEqual([["a"], ["c"], ["b"]]);
    expect(ids(moveRow(rows, 0, 1))).toEqual([["b"], ["a"], ["c"]]);
    expect(moveRow(rows, 0, -1)).toBe(rows);
    expect(moveRow(rows, 2, 1)).toBe(rows);
  });

  it("保存されていた中身の、形が違う所を取り除く", () => {
    const rows = sanitizeRows(p, [
      [
        { id: "x", text: "平方完成", thoughtId: "a1" },
        { id: "y", text: "ない考え", thoughtId: "zz", fragmentId: "f1" },
        { id: "x", text: "同じ id" },
        { id: "z" },
        "文字列",
      ],
      [],
      "段でないもの",
      [{ id: "w", text: "最小値", fragmentId: "f4" }],
    ]);
    expect(rows).toEqual([
      [
        { id: "x", text: "平方完成", thoughtId: "a1" },
        { id: "y", text: "ない考え", fragmentId: "f1" },
      ],
      [{ id: "w", text: "最小値", fragmentId: "f4" }],
    ]);
    expect(sanitizeRows(p, null)).toEqual([]);
  });
});

describe("模範の骨組みとくらべる", () => {
  const from = (thoughtId: string) => [s(`s-${thoughtId}`, { thoughtId })];

  it("段ごとに、合っているかが分かる", () => {
    expect(checkRow(p, 0, from("c1"))).toBe("ok");
    expect(checkRow(p, 0, from("a1"))).toBe("ok");
    expect(checkRow(p, 1, from("c1"))).toBe("elsewhere");
    expect(checkRow(p, 2, from("a3"))).toBe("needs-merge");
    expect(checkRow(p, 0, [s("only-problem", { fragmentId: "f4" })])).toBe("no-thought");
    expect(checkRow(p, 3, from("c1"))).toBe("extra");
  });

  it("問題文のことばが一緒に置いてあっても、考えのことばで判定する", () => {
    expect(checkRow(p, 0, [s("t", { fragmentId: "f1" }), ...from("a1")])).toBe("ok");
  });

  it.each(problems)("$id の骨組みどおりに並べると、同じ流れと判定される", (problem) => {
    const rows = problem.skeleton.map((k, i) => [s(`r${i}`, { thoughtId: k.thoughts[0] })]);
    expect(isComplete(problem, rows)).toBe(true);
    expect(isComplete(problem, rows.slice(1))).toBe(false);
    expect(isComplete(problem, [...rows, [s("more", { thoughtId: problem.skeleton[0].thoughts[0] })]])).toBe(
      false,
    );
  });
});
