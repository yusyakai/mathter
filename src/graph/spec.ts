import type { GraphSpec } from "../types";
import { compile, type Compiled } from "./expr";

export interface Prepared {
  fn: Compiled;
  domain: [Compiled, Compiled] | null;
}

/** グラフの設定を確かめて、描ける形にする。描けないときは理由を返す。 */
export function prepare(spec: GraphSpec): Prepared | { error: string } {
  let fn: Compiled;
  try {
    fn = compile(spec.expr);
  } catch (e) {
    return { error: `グラフの式：${(e as Error).message}` };
  }
  const allowed = ["x", ...(spec.param ? [spec.param.name] : [])];
  const extra = fn.variables.filter((v) => !allowed.includes(v));
  if (extra.length > 0) {
    return {
      error: `グラフの式に文字「${extra.join("、")}」があります。動かす文字として設定するか、数に直してください。`,
    };
  }
  if (!(spec.xMin < spec.xMax)) return { error: "グラフの x の範囲は、左を右より小さくしてください。" };
  if (spec.yMin !== undefined && spec.yMax !== undefined && !(spec.yMin < spec.yMax)) {
    return { error: "グラフの y の範囲は、下を上より小さくしてください。" };
  }
  if (spec.param) {
    const { name, min, max, value } = spec.param;
    if (!/^[a-wyzA-Z]$/.test(name)) return { error: "動かす文字は、x 以外のアルファベット1文字にしてください。" };
    if (!(min < max)) return { error: "動かす文字の範囲は、最小を最大より小さくしてください。" };
    if (value < min || value > max) return { error: "動かす文字の最初の値は、範囲の中にしてください。" };
  }
  let domain: Prepared["domain"] = null;
  if (spec.domain) {
    try {
      domain = [compile(spec.domain[0]), compile(spec.domain[1])];
    } catch (e) {
      return { error: `グラフの定義域：${(e as Error).message}` };
    }
    const bad = domain.flatMap((d) => d.variables).filter((v) => v !== spec.param?.name);
    if (bad.length > 0) return { error: "グラフの定義域には、数か、動かす文字だけを使ってください。" };
  }
  return { fn, domain };
}

/** 縦の範囲。指定がなければ、文字を動かしたときの全体が入るように決める。 */
export function yRange(spec: GraphSpec, fn: Compiled): [number, number] {
  if (spec.yMin !== undefined && spec.yMax !== undefined) return [spec.yMin, spec.yMax];
  const params = spec.param
    ? [0, 0.25, 0.5, 0.75, 1].map((t) => spec.param!.min + (spec.param!.max - spec.param!.min) * t)
    : [0];
  let lo = Infinity;
  let hi = -Infinity;
  for (const p of params) {
    for (let i = 0; i <= 60; i++) {
      const x = spec.xMin + ((spec.xMax - spec.xMin) * i) / 60;
      const y = fn.evaluate({ x, ...(spec.param ? { [spec.param.name]: p } : {}) });
      if (Number.isFinite(y)) {
        lo = Math.min(lo, y);
        hi = Math.max(hi, y);
      }
    }
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [-5, 5];
  if (hi - lo < 1e-9) return [lo - 1, hi + 1];
  const pad = (hi - lo) * 0.08;
  return [spec.yMin ?? lo - pad, spec.yMax ?? hi + pad];
}

/** 目盛りの間かく（1, 2, 5, 10, … のうち、目盛りが多すぎないもの）。 */
export function tickStep(span: number): number {
  const rough = span / 8;
  const base = 10 ** Math.floor(Math.log10(rough));
  for (const m of [1, 2, 5, 10]) {
    if (base * m >= rough) return base * m;
  }
  return base * 10;
}
