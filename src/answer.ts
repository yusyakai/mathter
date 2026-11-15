import { sourcesOf } from "./thoughts";
import type { Problem, RichText } from "./types";

/**
 * 解答ボードに置いた、ことば1つ。問題文や思考ボードから取り出した「写し」で、
 * もとの問題文やカードはそのまま残る。
 */
export interface Snippet {
  id: string;
  text: RichText;
  /** 思考ボードの考えから取り出したとき、その考え */
  thoughtId?: string;
  /** 問題文の着眼点から取り出したとき、その着眼点 */
  fragmentId?: string;
}

/** 解答ボードの中身。上から順の段で、1段にことばをいくつでも並べられる。 */
export type Rows = Snippet[][];

/** ことばを置く場所。新しい段、ある段の最後、あることばの前。 */
export type Target = "new" | { row: number } | { before: string };

export function newSnippetId(): string {
  return `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function findSnippet(rows: Rows, id: string): Snippet | undefined {
  return rows.flat().find((s) => s.id === id);
}

/**
 * ことばを置く。すでに解答ボードにあることばなら、そこから移す。
 * 空になった段はなくなる。
 */
export function placeSnippet(rows: Rows, snippet: Snippet, target: Target): Rows {
  if (typeof target === "object" && "before" in target && target.before === snippet.id) return rows;
  const next = rows.map((row) => row.filter((s) => s.id !== snippet.id));
  if (target === "new") {
    next.push([snippet]);
  } else if ("row" in target) {
    if (next[target.row]) next[target.row] = [...next[target.row], snippet];
    else next.push([snippet]);
  } else {
    const r = next.findIndex((row) => row.some((s) => s.id === target.before));
    if (r < 0) {
      next.push([snippet]);
    } else {
      const at = next[r].findIndex((s) => s.id === target.before);
      next[r] = [...next[r].slice(0, at), snippet, ...next[r].slice(at)];
    }
  }
  return next.filter((row) => row.length > 0);
}

export function removeSnippet(rows: Rows, id: string): Rows {
  return rows.map((row) => row.filter((s) => s.id !== id)).filter((row) => row.length > 0);
}

/** 段を上（by = -1）や下（by = 1）へ動かす。 */
export function moveRow(rows: Rows, index: number, by: number): Rows {
  const to = index + by;
  if (to < 0 || to >= rows.length || index < 0 || index >= rows.length) return rows;
  const next = [...rows];
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}

/** 保存されていた解答ボードを読む。形が違う所や、いまはない考え・着眼点への参照は取り除く。 */
export function sanitizeRows(problem: Problem, value: unknown): Rows {
  if (!Array.isArray(value)) return [];
  const thoughts = new Set([...problem.associations, ...problem.combinations].map((t) => t.id));
  const fragments = new Set(problem.fragments.map((f) => f.id));
  const seen = new Set<string>();
  const rows: Rows = [];
  for (const row of value) {
    if (!Array.isArray(row)) continue;
    const list: Snippet[] = [];
    for (const item of row as unknown[]) {
      if (typeof item !== "object" || item === null) continue;
      const v = item as Record<string, unknown>;
      if (typeof v.id !== "string" || typeof v.text !== "string" || v.text === "") continue;
      if (seen.has(v.id)) continue;
      seen.add(v.id);
      list.push({
        id: v.id,
        text: v.text,
        ...(typeof v.thoughtId === "string" && thoughts.has(v.thoughtId)
          ? { thoughtId: v.thoughtId }
          : {}),
        ...(typeof v.fragmentId === "string" && fragments.has(v.fragmentId)
          ? { fragmentId: v.fragmentId }
          : {}),
      });
    }
    if (list.length > 0) rows.push(list);
  }
  return rows;
}

/**
 * 模範の骨組みとくらべた結果。「配置を確かめる」を使うときだけ出す。
 * ok: この段で使う考え / elsewhere: 別の段で使う考え / needs-merge: くっつける前の考え /
 * unused: 骨組みに使わない考え / no-thought: 考えから取り出したことばがない / extra: 骨組みより段が多い
 */
export type RowResult = "ok" | "elsewhere" | "needs-merge" | "unused" | "no-thought" | "extra";

/** index 段目に置いたことばが、模範の骨組みのその段に合っているか。 */
export function checkRow(problem: Problem, index: number, row: Snippet[]): RowResult {
  const step = problem.skeleton[index];
  if (!step) return "extra";
  const thoughts = [...new Set(row.flatMap((s) => s.thoughtId ?? []))];
  if (thoughts.length === 0) return "no-thought";
  if (thoughts.some((t) => step.thoughts.includes(t))) return "ok";
  const accepted = problem.skeleton.flatMap((k) => k.thoughts);
  if (thoughts.some((t) => accepted.includes(t))) return "elsewhere";
  if (thoughts.some((t) => accepted.some((a) => sourcesOf(problem, a).includes(t)))) {
    return "needs-merge";
  }
  return "unused";
}

/** 解答ボードが、模範の骨組みと同じ流れになっているか。 */
export function isComplete(problem: Problem, rows: Rows): boolean {
  return (
    problem.skeleton.length > 0 &&
    rows.length === problem.skeleton.length &&
    rows.every((row, i) => checkRow(problem, i, row) === "ok")
  );
}
