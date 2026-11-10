import type { Combination, Problem, Thought } from "./types";

export function allThoughts(problem: Problem): Map<string, Thought> {
  const map = new Map<string, Thought>();
  for (const a of problem.associations) map.set(a.id, { kind: "association", ...a });
  for (const c of problem.combinations) map.set(c.id, { kind: "combination", ...c });
  return map;
}

/** 2つの考えをくっつけて生まれる組み合わせ（順不同）。なければ undefined。 */
export function findCombination(
  problem: Problem,
  x: string,
  y: string,
): Combination | undefined {
  return problem.combinations.find(
    (c) => (c.from[0] === x && c.from[1] === y) || (c.from[0] === y && c.from[1] === x),
  );
}

/** id の考えと、まだボードにない新しい考えを生み出せる相手（ボード上のもの）。 */
export function partnersOf(problem: Problem, id: string, board: string[]): string[] {
  return board.filter((other) => {
    if (other === id) return false;
    const c = findCombination(problem, id, other);
    return c !== undefined && !board.includes(c.id);
  });
}

/** 問題データの参照切れなどを検査する。問題がなければ空配列。 */
export function validateProblem(problem: Problem): string[] {
  const errors: string[] = [];
  const fragmentIds = new Set(
    problem.segments.flatMap((s) => (s.fragmentId ? [s.fragmentId] : [])),
  );
  const thoughtIds = new Set<string>();
  for (const t of [...problem.associations, ...problem.combinations]) {
    if (thoughtIds.has(t.id)) errors.push(`id が重複: ${t.id}`);
    thoughtIds.add(t.id);
  }
  for (const f of fragmentIds) {
    const n = problem.associations.filter((a) => a.fragmentId === f).length;
    if (n < 1 || n > 3) errors.push(`着眼点 ${f} の連想は1〜3個にする（現在 ${n}）`);
  }
  for (const a of problem.associations) {
    if (!fragmentIds.has(a.fragmentId)) errors.push(`${a.id}: 着眼点 ${a.fragmentId} がない`);
  }
  for (const c of problem.combinations) {
    for (const f of c.from) {
      if (!thoughtIds.has(f) || f === c.id) errors.push(`${c.id}: 元の考え ${f} が不正`);
    }
  }
  for (const s of problem.solution) {
    for (const f of s.fromFragments) {
      if (!fragmentIds.has(f)) errors.push(`${s.id}: 着眼点 ${f} がない`);
    }
    for (const t of s.fromThoughts) {
      if (!thoughtIds.has(t)) errors.push(`${s.id}: 考え ${t} がない`);
    }
  }
  const texts = [
    ...problem.segments.map((s) => s.text),
    ...problem.associations.flatMap((a) => [a.title, a.detail]),
    ...problem.combinations.flatMap((c) => [c.title, c.detail]),
    ...problem.solution.map((s) => s.text),
  ];
  for (const t of texts) {
    if ((t.match(/\$/g) ?? []).length % 2 !== 0) errors.push(`$ が閉じていない: ${t}`);
  }
  return errors;
}
