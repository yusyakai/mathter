import { describe, expect, it } from "vitest";
import { compile } from "./expr";

const value = (source: string, vars: Record<string, number> = {}) => compile(source).evaluate(vars);

describe("式を読み取る", () => {
  it("四則と累乗の順番", () => {
    expect(value("1+2*3")).toBe(7);
    expect(value("(1+2)*3")).toBe(9);
    expect(value("2^3^2")).toBe(512);
    expect(value("-x^2", { x: 3 })).toBe(-9);
    expect(value("2^-1")).toBe(0.5);
    expect(value("6/2/3")).toBe(1);
  });
  it("掛け算の記号を省ける", () => {
    expect(value("x^2-2ax+3", { x: 2, a: 1 })).toBe(3);
    expect(value("x(10-x)", { x: 4 })).toBe(24);
    expect(value("2(x+1)(x-1)", { x: 3 })).toBe(16);
    expect(value("-(x-5)^2+25", { x: 5 })).toBe(25);
    expect(value("x^2+2kx+k+2", { x: 1, k: -1 })).toBe(0);
  });
  it("y= や $ や全角の記号が付いていても読める", () => {
    expect(value("$y=x^2−4x+1$", { x: 2 })).toBe(-3);
    expect(value("２".normalize("NFKC") + "×x", { x: 3 })).toBe(6);
  });
  it("関数が使える", () => {
    expect(value("sqrt(x)+abs(-2)", { x: 9 })).toBe(5);
  });
  it("出てくる文字が分かる", () => {
    expect(compile("x^2-2ax+3").variables.sort()).toEqual(["a", "x"]);
    expect(compile("sqrt(x)").variables).toEqual(["x"]);
  });
  it("読み取れない式は、理由を付けて知らせる", () => {
    expect(() => compile("")).toThrow("式が入っていません");
    expect(() => compile("(x+1")).toThrow(") が足りません");
    expect(() => compile("x+")).toThrow();
    expect(() => compile("x=1")).toThrow("使えません");
  });
});
