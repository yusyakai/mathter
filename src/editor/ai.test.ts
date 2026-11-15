import { describe, expect, it } from "vitest";
import { patterns } from "../data/patterns";
import { problems } from "../data/problems";
import { buildPrompt, extractJson, fromAiDraft, toAiDraft } from "./ai";
import { issues, toProblem } from "./draft";

describe("AIの下書き", () => {
  it.each(problems)("$id を見本の形にして読み戻すと、同じ問題になる", (p) => {
    const back = fromAiDraft(JSON.parse(JSON.stringify(toAiDraft(p))), p.id, patterns);
    if (!("draft" in back)) throw new Error(back.error);
    expect(back.notes).toEqual([]);
    expect(issues(back.draft).filter((x) => x.blocking)).toEqual([]);
    const made = toProblem(back.draft);
    expect(made.segments.map((s) => s.text)).toEqual(p.segments.map((s) => s.text));
    expect(made.associations.map((a) => a.title)).toEqual(p.associations.map((a) => a.title));
    expect(made.skeleton.length).toBe(p.skeleton.length);
    expect(made.solution.length).toBe(p.solution.length);
  });

  it("指示文に、問題文・型の一覧・見本が入る", () => {
    const prompt = buildPrompt("$x^2=4$ を解け。", "", patterns, problems[0]);
    expect(prompt).toContain("$x^2=4$ を解け。");
    expect(prompt).toContain("complete-square");
    expect(prompt).toContain('"skeleton"');
    expect(prompt).not.toContain("参考にする解答");
  });

  it("返事の中から JSON を取り出し、バックスラッシュが1つでも読める", () => {
    const reply = 'はい。\n```json\n{"text": "$0\\le x\\le 2$ で $\\frac{1}{2}$\\, と $\\\\sqrt{2}$", "n": "行1\\n行2"}\n```';
    expect(extractJson(reply)).toEqual({
      text: "$0\\le x\\le 2$ で $\\frac{1}{2}$\\, と $\\sqrt{2}$",
      n: "行1\n行2",
    });
  });

  it("見つからない着眼点は入れず、注意に残す", () => {
    const back = fromAiDraft(
      {
        text: "$x^2=4$ を解け。",
        marks: ["$x^2=4$", "存在しない"],
        associations: [
          { key: "A1", mark: "$x^2=4$", pattern: "なし", title: "平方根", detail: "" },
          { key: "A2", mark: "存在しない", pattern: null, title: "消える", detail: "" },
        ],
        skeleton: [["A1", "A9"]],
        solution: [{ text: "$x=\\pm 2$", marks: ["$x^2=4$"], thoughts: ["A1", "A2"] }],
      },
      "x",
      patterns,
    );
    if (!("draft" in back)) throw new Error(back.error);
    expect(back.notes.length).toBe(2);
    expect(back.draft.marks.length).toBe(1);
    expect(back.draft.associations).toEqual([
      { id: "a1", fragmentId: "f1", title: "平方根", detail: "" },
    ]);
    expect(back.draft.skeleton[0].thoughts).toEqual(["a1"]);
    expect(back.draft.solution[0].fromThoughts).toEqual(["a1"]);
  });

  it("問題文がなければ読み込まない", () => {
    expect("error" in fromAiDraft({ title: "x" }, "x", patterns)).toBe(true);
  });
});
