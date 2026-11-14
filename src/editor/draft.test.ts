import { describe, expect, it } from "vitest";
import { problems } from "../data/problems";
import {
  addMark,
  editText,
  emptyDraft,
  fromProblem,
  isPlayable,
  issues,
  removeMark,
  snapSelection,
  toProblem,
} from "./draft";

describe("下書きと問題データの変換", () => {
  it.each(problems)("$id を下書きにして戻しても同じ", (p) => {
    expect(toProblem(fromProblem(p))).toEqual(p);
  });
  it.each(problems)("内蔵の $id はそのまま試せる", (p) => {
    expect(issues(fromProblem(p)).filter((x) => x.blocking)).toEqual([]);
    expect(isPlayable(p)).toBe(true);
  });
});

describe("着眼点を選ぶ", () => {
  const text = "2次関数 $y=x^2$ の 最小値 を求めよ。";
  it("前後の空白を除き、数式の途中なら数式全体に広げる", () => {
    expect(snapSelection(text, 0, 5)).toEqual({ start: 0, end: 4 });
    expect(snapSelection(text, 7, 9)).toEqual({ start: 5, end: 12 });
    expect(snapSelection(text, 4, 5)).toBeNull();
  });
  it("重なる着眼点は作れない", () => {
    const first = addMark({ ...emptyDraft("x"), text }, 0, 4);
    if (!("draft" in first)) throw new Error("作れるはず");
    expect(first.draft.marks).toEqual([{ id: "f1", start: 0, end: 4 }]);
    expect("error" in addMark(first.draft, 2, 6)).toBe(true);
  });
});

describe("問題文を書きかえる", () => {
  const base = fromProblem(problems.find((p) => p.id === "quadratic-min")!);
  const at = (d: typeof base, id: string) => {
    const m = d.marks.find((x) => x.id === id)!;
    return d.text.slice(m.start, m.end);
  };
  it("前に文字を足すと、着眼点の位置がずれる", () => {
    const d = editText(base, `次の${base.text}`);
    expect(at(d, "f1")).toBe("2次関数");
    expect(at(d, "f4")).toBe("最小値");
    expect(d.associations).toEqual(base.associations);
  });
  it("着眼点の中を直すと、着眼点が伸び縮みする", () => {
    const d = editText(base, base.text.replace("最小値", "最大値と最小値"));
    expect(at(d, "f4")).toBe("最大値と最小値");
  });
  it("着眼点をまるごと消すと、その連想と参照も消える", () => {
    const d = editText(base, base.text.replace("最小値", ""));
    expect(d.marks.map((m) => m.id)).not.toContain("f4");
    expect(d.associations.map((a) => a.id)).not.toContain("a6");
    expect(d.combinations.find((c) => c.id === "c2")!.from).toEqual(["a3", ""]);
    expect(d.solution.every((s) => !s.fromFragments.includes("f4"))).toBe(true);
    expect(issues(d).some((x) => x.blocking)).toBe(true);
  });
  it("着眼点を消すと、連想も消える", () => {
    const d = removeMark(base, "f1");
    expect(d.associations.some((a) => a.fragmentId === "f1")).toBe(false);
  });
});

describe("直すことの一覧", () => {
  it("空の下書きは試せない", () => {
    const list = issues(emptyDraft("x"));
    expect(list.some((x) => x.blocking)).toBe(true);
    expect(list.map((x) => x.section)).toContain("text");
  });
  it("数式の書きまちがいを見つける", () => {
    const d = { ...emptyDraft("x"), title: "t", unit: "u", text: "$\\frac{1$ を求めよ" };
    expect(issues(d).some((x) => x.message.includes("数式"))).toBe(true);
  });
});
