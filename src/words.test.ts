import { describe, expect, it } from "vitest";
import { plainSegmenter, tokenize } from "./words";

const words = (text: string, segmenter = undefined as Parameters<typeof tokenize>[1]) =>
  tokenize(text, segmenter)
    .filter((t) => t.kind !== "other")
    .map((t) => t.text);

describe("文をことばに区切る", () => {
  it("区切ったものをつなげると、もとの文に戻る", () => {
    for (const text of [
      "2次関数 $y=x^2-2ax+3$ の $0\\le x\\le 2$ における 最小値 を求めよ。",
      "平方完成して、頂点と軸を調べる",
      "",
      "$x>0$",
      "閉じていない $ がある文",
    ]) {
      expect(tokenize(text).map((t) => t.text).join("")).toBe(text);
      expect(tokenize(text, plainSegmenter).map((t) => t.text).join("")).toBe(text);
    }
  });

  it("数式はまるごと1つになる", () => {
    const tokens = tokenize("2次関数 $y=x^2-2ax+3$ の最小値");
    expect(tokens.filter((t) => t.kind === "math").map((t) => t.text)).toEqual(["$y=x^2-2ax+3$"]);
  });

  it("熟語は1つのことばになる", () => {
    expect(words("平方完成して、頂点と軸を調べる")).toEqual(
      expect.arrayContaining(["平方完成", "頂点", "軸"]),
    );
    expect(words("定義域に制限があるので端点も候補")).toEqual(
      expect.arrayContaining(["定義域", "制限", "端点", "候補"]),
    );
    expect(words("2次関数 の 最小値を求めよ。")).toEqual(expect.arrayContaining(["2次関数", "最小値"]));
    expect(words("グラフ全体が x 軸より上")).toEqual(expect.arrayContaining(["グラフ全体", "x", "軸"]));
  });

  it("1文字の助詞や、記号・空白は、運べることばにしない", () => {
    const list = words("頂点と軸を、調べる。");
    expect(list).not.toContain("と");
    expect(list).not.toContain("を");
    expect(list).not.toContain("、");
    expect(list).not.toContain("。");
  });

  it("辞書を使えない環境でも、漢字やカタカナのまとまりで区切る", () => {
    expect(words("平方完成して、頂点と軸を調べる", plainSegmenter)).toEqual(
      expect.arrayContaining(["平方完成", "頂点", "軸"]),
    );
    // 辞書がないと、ひらがなの続きは助詞と分けられない
    expect(words("グラフをかく", plainSegmenter)).toEqual(["グラフ", "をかく"]);
    expect(words("2次関数の最小値", plainSegmenter)).toEqual(["2次関数", "最小値"]);
  });
});
